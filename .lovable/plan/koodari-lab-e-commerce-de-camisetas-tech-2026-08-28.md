# Koodari Lab — E-commerce de camisetas tech

Loja minimalista de camisetas em tecido tech, com catálogo próprio, conta de cliente, painel admin e checkout via Asaas (cartão, Pix e boleto).

## Identidade visual

- Estilo minimalista: muito espaço em branco, tipografia limpa, poucas cores.
- Base clara (off-white/cinza claro) com preto para texto e um único acento discreto.
- Fotos de produto grandes, grid uniforme, bordas suaves e transições sutis.

## Páginas

- **Home** — hero da marca, destaque do tecido tech, grade de produtos em destaque.
- **Loja** — grade de produtos com filtro por tamanho e cor.
- **Produto** — galeria, descrição do tecido, seleção de tamanho/cor, adicionar ao carrinho.
- **Carrinho / Checkout** — resumo, dados do cliente + endereço, escolha do meio de pagamento (Pix, boleto ou cartão), frete fixo com regra de frete grátis acima de um valor.
- **Confirmação do pedido** — QR Code/copia-e-cola do Pix, link do boleto ou resultado do cartão, com status atualizado automaticamente.
- **Minha conta** — login/cadastro, lista de pedidos e status de pagamento.
- **Admin** — CRUD de produtos, variações (tamanho/cor), preços, estoque, configuração de frete e lista de pedidos.

## Backend (Lovable Cloud)

Tabelas: `products`, `product_variants` (tamanho/cor/estoque/SKU), `product_images`, `orders`, `order_items`, `profiles`, `user_roles` (admin em tabela separada), `shipping_settings`.

Regras de acesso: catálogo público para leitura; pedidos visíveis apenas ao dono; escrita de catálogo e leitura de todos os pedidos apenas para admin.

## Integração Asaas

Toda comunicação com a Asaas fica no servidor; nenhuma chave no navegador.

- Chave de API guardada como segredo (`ASAAS_API_KEY`), começando no ambiente **sandbox** para testes.
- Fluxo: criar/reutilizar cliente na Asaas → criar cobrança do pedido com o tipo escolhido (`PIX`, `BOLETO`, `CREDIT_CARD`) → devolver ao app o QR Code Pix, o link do boleto ou o resultado do cartão.
- Cartão tokenizado pela Asaas; o app nunca guarda dados do cartão.
- Webhook público recebe eventos de pagamento (confirmado, recebido, vencido, estornado), valida o token do webhook e atualiza o status do pedido e o estoque.
- Estoque é reservado na criação do pedido e baixado na confirmação do pagamento.

## Detalhes técnicos

- Rotas TanStack: `/`, `/loja`, `/produto/$slug`, `/carrinho`, `/checkout`, `/pedido/$id`, `/conta`, `/conta/pedidos`, `/admin/*`.
- Chamadas Asaas via `createServerFn` (checkout, consulta de status) e uma rota pública `src/routes/api/public/asaas-webhook.ts` para o webhook, com validação de assinatura/token.
- Validação de entrada com Zod; preços em centavos; totais recalculados no servidor (nunca confiando no cliente).
- Cada rota com `head()` próprio (título/descrição/OG) para SEO.

## Ordem de execução

1. Ativar Lovable Cloud e criar schema + dados de exemplo.
2. Design system minimalista + Home, Loja e Produto.
3. Carrinho, autenticação e "meus pedidos".
4. Painel admin.
5. Integração Asaas (sandbox): cobranças Pix/boleto/cartão + webhook.

## O que preciso de você depois

- A chave de API da Asaas (sandbox) — vou pedir de forma segura na hora certa.
- Valor do frete fixo e do limite para frete grátis.
- Fotos e descrições reais dos produtos (uso placeholders até lá).
