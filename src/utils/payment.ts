import type { Dict } from '../i18n';
import { PaymentMethod } from '../types';
import { normalizeText } from './text';

/**
 * Rótulo do meio de pagamento: "Nubank (Pix)", "Banco do Brasil (Crédito)".
 * Quando o nome já é a própria forma ("Dinheiro" + dinheiro), não repete.
 */
export function paymentLabel(method: PaymentMethod | undefined, t: Dict): string {
  if (!method) return t.payment.none;
  const kind = t.payment.kinds[method.kind] ?? method.kind;
  if (method.kind === 'outro' || normalizeText(method.name) === normalizeText(kind)) {
    return method.name;
  }
  return t.payment.display(method.name, kind);
}
