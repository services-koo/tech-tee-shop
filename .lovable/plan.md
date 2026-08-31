# Error tracking no PostHog

Hoje o PostHog recebe pageviews, eventos do funil de compra e autenticação. Nenhum erro é enviado: não existe nenhuma chamada de captura de exceção no código. Este plano liga o error tracking.

## O que passa a ser capturado

- Erros JavaScript não tratados no navegador (`window.onerror`).
- Promessas rejeitadas sem tratamento (`unhandledrejection`).
- Erros que derrubam uma página e caem no error boundary do roteador (a tela "This page didn't load"), com a rota onde aconteceram.
- Falhas de operações importantes do checkout (criação de pedido/pagamento), enviadas como erro com o passo em que falhou.

Cada erro chega ao PostHog com mensagem, stack, rota atual e id do usuário quando logado, aparecendo na aba Error tracking com agrupamento por tipo de erro.

## Cuidados

Nenhum dado sensível é enviado: apenas mensagem, stack e rota. Dados de cartão, CPF e endereço continuam fora do PostHog, e o mascaramento do session replay permanece como está.

## Detalhes técnicos

- Ativar o handler de exceções do `posthog-js` no `init` (`capture_exceptions: true`), que instala os listeners de `error` e `unhandledrejection`.
- Adicionar `captureError(error, context)` em `src/lib/analytics.ts` usando `posthog.captureException(error, properties)`; no-op quando o token não está configurado.
- Chamar `captureError` no `ErrorComponent` do `src/routes/__root.tsx` (junto do `reportLovableError` já existente), com `boundary` e rota.
- Chamar `captureError` nos `catch` do checkout (`src/routes/_authenticated/checkout.tsx`) e da página do pedido, marcando o passo (`create_order`, `load_order`).
- Erros de servidor (server functions, webhook Asaas) continuam nos logs do servidor; não serão enviados ao PostHog nesta etapa.
