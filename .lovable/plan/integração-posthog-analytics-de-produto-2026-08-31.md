# Integração PostHog (analytics de produto)

Adicionar o PostHog ao Koodari Lab para medir navegação, funil de compra, autenticação e gravação de sessão com dados sensíveis mascarados.

## Conexão

O PostHog entra como connector do Lovable: um card no chat permite escolher/criar a conexão do workspace. Depois disso o token de projeto fica disponível automaticamente para o app — nenhuma chave é escrita no código.

## O que será rastreado

Pageviews automáticos em toda troca de rota (incluindo navegação client-side do TanStack Router).

Funil de compra:
- `product_viewed` — página do produto (slug, nome, preço)
- `add_to_cart` — adicionar ao carrinho (variante, tamanho, quantidade, preço)
- `remove_from_cart` — remover item do carrinho
- `checkout_started` — entrada no checkout (subtotal, frete, total, nº de itens)
- `order_created` — pedido criado (id, método de pagamento, total)
- `order_paid` — quando a página do pedido detecta pagamento confirmado

Autenticação:
- `signed_up` e `signed_in` (com o método: e-mail ou Google)
- `identify` do usuário pelo id da conta com o e-mail como propriedade, e `reset` no logout, para ligar as sessões anônimas ao usuário

Nenhum dado de cartão, CPF/CNPJ ou endereço é enviado ao PostHog — apenas ids, valores e nomes de produto.

## Session replay

Ativado com mascaramento total de inputs e de texto sensível, para que campos de cartão, CPF, telefone e endereço nunca apareçam nas gravações. Heatmaps ligados junto.

## Detalhes técnicos

- Instalar `posthog-js`.
- Novo `src/lib/analytics.tsx`: inicialização única no cliente com `VITE_LOVABLE_CONNECTOR_POSTHOG_API_KEY` e host derivado de `VITE_LOVABLE_CONNECTOR_POSTHOG_REGION` (`eu`/`us`); `capture_pageview: false` (pageview manual por rota), `session_recording: { maskAllInputs: true, maskTextSelector: '*' }`, `autocapture` ligado. Sem token configurado, tudo vira no-op — o app não quebra.
- Init apenas no browser (nunca no SSR), dentro de `useEffect` no `__root.tsx`; pageview disparado ao mudar `location.pathname` via subscrição do router.
- Helper `track(event, props)` exportado e usado nos pontos: `produto.$slug.tsx`, `carrinho.tsx`, `lib/cart.tsx` (add/remove), `_authenticated/checkout.tsx`, `_authenticated/pedido.$id.tsx`, `auth.tsx`.
- `identify`/`reset` acoplados ao listener de `onAuthStateChange` já existente no `__root.tsx`.
- Valores monetários enviados em reais (centavos/100) para leitura direta nos gráficos do PostHog.
