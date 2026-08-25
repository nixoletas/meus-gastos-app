// Quem lê a foto da nota.
//
// Dois provedores atrás da mesma função: `gemini` (padrão, tem free tier) e
// `anthropic`. O schema de saída é o mesmo JSON Schema nos dois — quem troca
// é só a forma da requisição. Escolha por `RECEIPT_PROVIDER`.
import { RECEIPT_SCHEMA, SYSTEM_PROMPT, USER_PROMPT } from './schema.ts';

export type Provider = 'gemini' | 'anthropic';

/** Erro com mensagem já escrita para o usuário ler na tela. */
export class ReaderError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
    this.name = 'ReaderError';
  }
}

export function currentProvider(): Provider {
  return (Deno.env.get('RECEIPT_PROVIDER') ?? 'gemini') === 'anthropic' ? 'anthropic' : 'gemini';
}

const DEFAULT_MODEL: Record<Provider, string> = {
  // Flash de free tier: dá conta de cupom fiscal e não cobra nada.
  gemini: 'gemini-3.7-flash',
  anthropic: 'claude-opus-5',
};

/** Nome da variável de ambiente com a chave, por provedor. */
const KEY_ENV: Record<Provider, string> = {
  gemini: 'GEMINI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
};

export function apiKeyFor(provider: Provider): string | undefined {
  return Deno.env.get(KEY_ENV[provider]);
}

export function missingKeyMessage(provider: Provider): string {
  return `Leitura de notinha não está configurada no servidor (falta ${KEY_ENV[provider]}).`;
}

function modelFor(provider: Provider): string {
  return Deno.env.get('RECEIPT_MODEL') ?? DEFAULT_MODEL[provider];
}

/** Os formatos que o bucket aceita e que os dois provedores entendem. */
export type MediaType = 'image/jpeg' | 'image/png' | 'image/webp';

type Input = { base64: string; mediaType: MediaType; apiKey: string };

/**
 * Gemini via REST.
 *
 * Sem SDK de propósito: a API está no endpoint novo (`/v1beta/interactions`),
 * o corpo é pequeno e assim a função não carrega um pacote npm inteiro em
 * cada cold start.
 */
async function readWithGemini({ base64, mediaType, apiKey }: Input): Promise<unknown> {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelFor('gemini'),
      system_instruction: SYSTEM_PROMPT,
      input: [
        { type: 'image', data: base64, mime_type: mediaType },
        { type: 'text', text: USER_PROMPT },
      ],
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: RECEIPT_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('gemini', response.status, detail.slice(0, 500));

    // 429 no free tier é cota, não bug: a mensagem tem que dizer isso.
    if (response.status === 429) {
      throw new ReaderError(
        'A cota grátis de leitura acabou por agora. Tente de novo mais tarde.',
        429
      );
    }
    if (response.status === 401 || response.status === 403) {
      throw new ReaderError('A chave da leitura de notinha foi recusada.', 500);
    }
    throw new ReaderError('A leitura da notinha falhou. Tente de novo.', 502);
  }

  const data = (await response.json()) as {
    output_text?: string;
    steps?: { content?: { type?: string; text?: string }[] }[];
  };

  // `output_text` é a conveniência; os blocos de `steps` são a fonte.
  const text =
    data.output_text ??
    data.steps
      ?.flatMap((step) => step.content ?? [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('');

  if (!text) throw new ReaderError('A leitura voltou vazia. Tente de novo.', 502);
  return JSON.parse(text);
}

/** Anthropic via SDK oficial. Import dinâmico: só carrega se for o provedor ativo. */
async function readWithAnthropic({ base64, mediaType, apiKey }: Input): Promise<unknown> {
  const { default: Anthropic } = await import('npm:@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: modelFor('anthropic'),
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    // `effort: medium` porque o usuário está olhando a tela esperando: ler um
    // cupom não precisa da profundidade máxima, e cada segundo aqui aparece.
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: RECEIPT_SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: USER_PROMPT },
        ],
      },
    ],
  });

  if (message.stop_reason === 'refusal') {
    throw new ReaderError('Não consegui ler essa imagem. Tente outra foto.', 422);
  }

  const block = message.content.find((item) => item.type === 'text');
  if (!block || block.type !== 'text') {
    throw new ReaderError('A leitura voltou vazia. Tente de novo.', 502);
  }
  return JSON.parse(block.text);
}

/** Lê a foto e devolve o JSON cru, ainda sem normalizar. */
export function readReceipt(provider: Provider, input: Input): Promise<unknown> {
  return provider === 'anthropic' ? readWithAnthropic(input) : readWithGemini(input);
}
