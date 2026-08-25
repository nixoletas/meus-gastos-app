// Teste do leitor da página da NFC-e contra o layout de referência do ENCAT
// e contra uma página "fora do padrão" (para exercitar o leitor genérico).
import { lerPaginaNfce } from './scrape.ts';
import { chaveDaUrl, chaveValida, portalPermitido } from './chave.ts';

const referencia = `
<html><body>
<div id="conteudo">
  <div class="txtTopo">SUPERMERCADO BOM PRECO LTDA</div>
  <div class="text">CNPJ: 12.345.678/0001-95</div>
  <div class="text">Rua das Flores, 100 - Centro</div>
  <table id="tabResult">
    <tr id="Item + 1">
      <td><span class="txtTit">BANANA PRATA KG</span>
          <span class="RCod">(Código: 000123)</span>
          <span class="Rqtd">Qtde.:1,240</span>
          <span class="RUN">UN: KG</span>
          <span class="RvlUnit">Vl. Unit.:&nbsp; 5,89</span></td>
      <td class="txtTit noWrap"><span class="valor">7,30</span></td>
    </tr>
    <tr id="Item + 2">
      <td><span class="txtTit">LEITE INT ITBA 1L</span>
          <span class="RCod">(Código: 000987)</span>
          <span class="Rqtd">Qtde.:3</span>
          <span class="RUN">UN: UN</span>
          <span class="RvlUnit">Vl. Unit.:&nbsp; 4,99</span></td>
      <td class="txtTit noWrap"><span class="valor">14,97</span></td>
    </tr>
  </table>
  <div id="totalNota">
    <div id="linhaTotal">Valor total R$ <span class="totalNumb">22,27</span></div>
    <div id="linhaTotal">Descontos R$ <span class="totalNumb">0,00</span></div>
    <div id="linhaTotal">Valor a pagar R$ <span class="totalNumb txtMax">22,27</span></div>
    <div id="linhaTotal">Forma de pagamento: Cartão de Débito</div>
  </div>
  <div id="infos">Emissão: 24/08/2026 19:32:05 - Via Consumidor</div>
</div>
</body></html>`;

const foraDoPadrao = `
<html><body>
<table>
  <tr><th>Produto</th><th>Total</th></tr>
  <tr><td>PAO FRANCES Qtde: 0,450 UN: KG Vl. Unit: 18,90</td><td>8,51</td></tr>
  <tr><td>CAFE TORRADO 500G Qtde: 2 UN: UN Vl. Unit: 21,45</td><td>42,90</td></tr>
</table>
<p>Valor a pagar R$ 51,41</p>
<p>Emissão: 01/07/2026</p>
</body></html>`;

function check(nome: string, ok: boolean, extra = '') {
  console.log(`${ok ? 'ok  ' : 'FALHA'} ${nome}${extra ? ' -> ' + extra : ''}`);
  if (!ok) Deno.exitCode = 1;
}

// ---- layout de referência
const a = lerPaginaNfce(referencia);
check('referência: 2 itens', a.items.length === 2, String(a.items.length));
check('referência: descrição', a.items[0].description === 'BANANA PRATA KG', a.items[0].description);
check('referência: quantidade fracionada', a.items[0].quantity === 1.24, String(a.items[0].quantity));
check('referência: unidade', a.items[0].unit === 'kg', String(a.items[0].unit));
check('referência: unitário', a.items[0].unit_price === 5.89, String(a.items[0].unit_price));
check('referência: total do item', a.items[1].total === 14.97, String(a.items[1].total));
check('referência: mercado', a.merchant === 'SUPERMERCADO BOM PRECO LTDA', String(a.merchant));
check('referência: CNPJ', a.merchant_doc === '12345678000195', String(a.merchant_doc));
check('referência: total', a.total === 22.27, String(a.total));
check('referência: pagamento', a.payment_method === 'debito', String(a.payment_method));
check('referência: emissão', a.issued_at === '2026-08-24T19:32:05', String(a.issued_at));

// ---- fora do padrão (leitor genérico)
const b = lerPaginaNfce(foraDoPadrao);
check('genérico: 2 itens', b.items.length === 2, String(b.items.length));
check('genérico: quantidade', b.items[0].quantity === 0.45, String(b.items[0].quantity));
check('genérico: total do item', b.items[0].total === 8.51, String(b.items[0].total));
check('genérico: total da nota', b.total === 51.41, String(b.total));

// ---- chave e portal
const qr =
  'https://www.fazenda.pr.gov.br/nfce/qrcode?p=41260812345678000195650010000012341123456789|2|1|1|ABCDEF';
const chave = chaveDaUrl(qr);
check('chave extraída do QR', chave?.length === 44, String(chave));
check('portal .gov.br permitido', portalPermitido(qr));
check('portal http bloqueado', !portalPermitido('http://www.fazenda.pr.gov.br/x'));
check('portal externo bloqueado', !portalPermitido('https://evil.example.com/?p=' + chave));
check('IP bloqueado', !portalPermitido('https://169.254.169.254/latest/meta-data'));

// DV: monta uma chave válida e confere que a inválida cai.
const base43 = '4126081234567800019565001000001234112345678';
let soma = 0;
let peso = 2;
for (let i = 42; i >= 0; i -= 1) {
  soma += Number(base43[i]) * peso;
  peso = peso === 9 ? 2 : peso + 1;
}
const resto = soma % 11;
const dv = resto === 0 || resto === 1 ? 0 : 11 - resto;
check('DV válido aceito', chaveValida(base43 + dv));
check('DV errado recusado', !chaveValida(base43 + ((dv + 1) % 10)));
