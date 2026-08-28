# Validar boleto pago via Asaas Sandbox

O pedido de teste com boleto já foi criado e está com status "Aguardando pagamento":

- Pedido `5239CDFA` (`5239cdfa-9c9a-4958-8287-f418e6878ef7`)
- Item: Camiseta Tech Onyx · M × 1
- Total: R$ 213,90
- Método: Boleto

## O que você faz na Asaas (Sandbox)

1. Abra a cobrança correspondente a este pedido (descrição "Pedido Koodari Lab 5239cdfa").
2. Use a ação de confirmar recebimento em dinheiro / marcar como recebida, que no sandbox simula a liquidação do boleto.
3. Confirme que o evento `PAYMENT_RECEIVED` saiu da fila de webhooks com status 200.

## O que eu verifico depois

1. Consulto o pedido no banco e confirmo `payment_status = RECEIVED`, `status = paid` e `stock_applied = true`.
2. Confirmo que o estoque da variante M foi baixado exatamente uma vez.
3. Abro a página `/pedido/5239cdfa-...` no navegador e confirmo que aparece "Pagamento confirmado" / "Boleto · Pago".
4. Se o webhook não chegar ou voltar 401, leio os logs do servidor para identificar se é token, header ou payload, e reporto a causa.

## Detalhes técnicos

Nenhuma alteração de código está prevista. O fluxo já existente é: `POST /api/public/asaas-webhook` valida o token, localiza o pedido por `externalReference`, atualiza `payment_status`/`status` e chama `apply_order_stock`, que é idempotente. A verificação é apenas de leitura (consulta ao banco e checagem visual da página do pedido).

Caso a validação exponha algum defeito real (ex.: status de boleto que a Asaas envia e que ainda não tratamos), eu proponho a correção antes de aplicá-la.
