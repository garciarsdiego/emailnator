# Changelog da auditoria de produção — 2026-07-18

Registro das mudanças aplicadas durante a auditoria de nível de produção na branch
`auditoria-producao/2026-07-18`. Cada agente de correção documenta aqui o que mudou
no seu escopo; o agente finalizador usa este arquivo como referência para montar os
commits atômicos e a mensagem de release.

## Escopo: testes e qualidade

### Testes (categoria B)

- **Cobertura zero → cobertura real nas Edge Functions críticas.** Antes desta
  auditoria, `vitest.config.ts` só incluía `src/**/*.test.{ts,tsx}`; nenhuma das
  Edge Functions em `supabase/functions` tinha teste automatizado, incluindo os
  módulos de maior risco financeiro/segurança do sistema. Adicionado
  `supabase/functions/**/*.test.ts` ao `include` do Vitest e criados 119 novos
  testes em 14 novos arquivos (13 em `supabase/functions/_shared`, 1 no
  frontend) cobrindo:
  - `url-security.ts` — proteção contra SSRF: esquemas bloqueados, credenciais
    embutidas, portas não padrão, IPs privados/loopback, endereço de metadados
    de nuvem (`169.254.169.254`), sufixos de host internos, e DNS rebinding
    (hostname público que resolve para IP privado);
  - `validation.ts` — validação de entrada (`objectValue`, `requiredString`,
    `optionalString`, `optionalObject`, `trimmed`);
  - `credits.ts` — reserva/estorno de créditos: caminho feliz, conflito de
    idempotência, créditos insuficientes, replay de job já concluído, retry de
    job em andamento, recuperação de job travado;
  - `rate-limit.ts` — limite de requisições e cálculo de `retry-after`;
  - `stripe-catalog.ts`, `subscriptions.ts` — resolução de plano/catálogo a
    partir de eventos Stripe, incluindo o caso de preço ativo fora do catálogo;
  - `stripe-webhook-users.ts`, `stripe-webhook-store.ts` — mapeamento
    cliente↔usuário e deduplicação/idempotência de eventos do webhook
    (`claimed`/`duplicate`/`busy`, recuperação de linha travada);
  - `stripe-webhook-credits.ts` — concessão e estorno de créditos comprados,
    incluindo um **teste de regressão que documenta o limite conhecido de
    arredondamento** em reembolsos parciais repetidos (ver
    `docs/security-v2.md`, seção "Limite conhecido de reembolso");
  - `stripe-webhook-events.ts` — o dispatcher principal do webhook Stripe,
    incluindo um teste de regressão para a lógica de reconciliação que evita
    fazer downgrade de um usuário para o plano free quando um evento
    `customer.subscription.deleted` chega fora de ordem para uma assinatura
    antiga enquanto uma assinatura mais nova já está ativa;
  - `errors.ts`, `hash.ts`, `cors.ts` — utilitários compartilhados usados por
    praticamente todas as funções acima.
  - Helper de teste novo: `supabase/functions/_shared/test-support.ts` (mocks
    de `SupabaseClient` via RPC/query builder encadeável, e stub de
    `globalThis.Deno.env`/`Deno.resolveDns`). Não é um arquivo `*.test.ts`, não
    é coletado como suíte pelo Vitest.
- **Frontend:** adicionado `src/app/ErrorBoundary.tsx` (ver categoria D) com
  teste dedicado em `src/app/ErrorBoundary.test.tsx` (renderização normal,
  fallback acessível quando um filho lança, log estruturado do erro).
- Suíte completa validada: **19 arquivos, 127 testes, 100% passando**
  (`npm run test`), partindo de 5 arquivos / 8 testes na baseline.

### Qualidade (categoria D)

- **Corrigido:** ausência de `React ErrorBoundary` — um erro de render não
  tratado em qualquer componente derrubava a árvore inteira e deixava o
  usuário com tela branca. Adicionado `src/app/ErrorBoundary.tsx`, que:
  - renderiza um fallback acessível (`role="alert"`, foco visível, texto em
    pt-BR) com um botão para recarregar a página;
  - registra o erro em `console.error` como JSON estruturado
    (`event: "render_error_boundary"`) para facilitar a ingestão por um
    pipeline de logs/observabilidade;
  - envolve `<AppProviders>`/`<AppRouter>` em `src/App.tsx`.
- **Pendência (não corrigida nesta auditoria):** `eslint-plugin-jsx-a11y` não
  está instalado; a cobertura de acessibilidade no lint continua dependendo de
  disciplina manual. Ver `depsSugeridas`.

### Documentação (categoria F)

- `README.md`:
  - lista de comandos completada com `test:watch` e `preview` (ambos já
    existiam em `package.json` mas não apareciam no README);
  - adicionado parágrafo explicando o escopo do `npm run test` (frontend +
    módulos compartilhados das Edge Functions) e a limitação atual (módulos
    que importam pacotes reais via `https://esm.sh/...` em runtime —
    `sanitize.ts`, `auth.ts`, `stripe-client.ts` — ainda não têm teste
    automatizado);
  - seção "Estado desta branch" (que referenciava uma branch de trabalho
    específica já encerrada, `codex/v2-refactor`) substituída por um
    checklist genérico de pré-publicação, para não ficar obsoleta a cada nova
    branch de auditoria.
- `.env.example` (raiz e `supabase/functions/.env.example`): conferidos contra
  o uso real de variáveis no código; já estavam corretos e completos, nenhuma
  mudança necessária.

### Performance (categoria E)

- Nenhuma mudança de baixo risco identificada além do que outras branches/
  agentes já tratam via `vite.config.ts`. O chunk principal de produção segue
  monitorável (ver pendências); o roteamento já usa `React.lazy` por rota.

## Validação executada

```
npm run lint       # 0 problemas
npm run typecheck   # 0 erros (tsc -b --pretty false)
npm run test        # 19 arquivos, 127 testes, 100% passando
npm run deadcode     # knip limpo (0 arquivos/exports/deps não usados)
npm run build        # build de produção OK
```

## Pendências desta auditoria (escopo testes-qualidade)

- `supabase/functions/_shared/sanitize.ts` (sanitização de HTML de email) e
  `supabase/functions/_shared/auth.ts` (autenticação) importam pacotes reais
  em runtime via `https://esm.sh/...` (`sanitize-html`, `@supabase/supabase-js`
  com `createClient` real) e não foram cobertos por teste automatizado nesta
  auditoria — teria exigido instalar `sanitize-html` como devDependency (não
  autorizado neste agente). Ver `depsSugeridas`.
- `supabase/functions/_shared/ai.ts` (chamada ao gateway de IA) e
  `supabase/functions/_shared/stripe-client.ts` (construção do cliente Stripe)
  não foram testados: são adaptadores finos de I/O externo, priorizados abaixo
  dos módulos de lógica de negócio/segurança listados acima.
- `src/features/email-generation`, `src/features/funnels`, `src/features/brand`
  e a maior parte de `src/shared/api` continuam sem teste automatizado
  (gap de prioridade média na análise original). Não coberto nesta rodada por
  orçamento de tempo — priorizei o risco financeiro/segurança das Edge
  Functions (prioridade alta) sobre a cobertura ampla do frontend (prioridade
  média).
- Duplicação de código e estrutura de pastas não passaram por uma revisão
  profunda nesta rodada (build/lint/typecheck/deadcode já estavam limpos na
  baseline e a auditoria não encontrou duplicação óbvia numa varredura rápida).
- `eslint-plugin-jsx-a11y` não instalado (ver `depsSugeridas`).

## Escopo: finalização (agente finalizador)

Dependências de `depsSugeridas` aplicadas, sempre como devDependency (sem
impacto no bundle de produção), seguidas de re-validação completa do zero
(`lint`, `typecheck`, `test`, `deadcode`, `build`):

- **`sanitize-html@2.17.0` + `@types/sanitize-html@2.16.1`** instalados como
  devDependency, na mesma versão que `supabase/functions/_shared/sanitize.ts`
  importa de `https://esm.sh/sanitize-html@2.17.0` em runtime. Adicionado alias
  em `vitest.config.ts` (`"https://esm.sh/sanitize-html@2.17.0" → "sanitize-html"`)
  para que o Vitest resolva esse import para a cópia local em vez de bater na
  rede. Criado `supabase/functions/_shared/sanitize.test.ts` (13 testes): tags/
  atributos não permitidos removidos, handlers de evento (`onerror`, `onclick`)
  removidos, URLs `javascript:`/`data:`/protocol-relative bloqueadas, esquemas
  `http`/`https`/`mailto`/`tel` permitidos, `rel="noopener noreferrer"`
  injetado em links, estilos inline validados por allowlist de regex, tags de
  tabela preservadas. Fecha a maior lacuna de cobertura de segurança apontada
  na análise original (sanitização de HTML de email, risco de XSS).
  `sanitize-html`/`@types/sanitize-html` adicionados a `ignoreDependencies` em
  `knip.json` — são consumidos apenas via o alias do Vitest, que a análise
  estática do knip não consegue seguir.
- **`eslint-plugin-jsx-a11y@6.10.2`** instalado e habilitado em
  `eslint.config.js` (regras `recommended`, escopo `**/*.tsx`). `npm run lint`
  passou a acusar 6 erros reais em 5 arquivos, todos corrigidos:
  - `CampaignTypeSelector.tsx`, `NicheSelector.tsx`, `ToneSelector.tsx`:
    `<label>` usado como rótulo de um grupo de botões (não associado a nenhum
    controle de formulário) trocado por `<span>` com a mesma classe visual
    (`jsx-a11y/label-has-associated-control`);
  - `email-builder/DraggableBlock.tsx`: o cartão de bloco arrastável tinha
    `onClick` sem equivalente de teclado; adicionado `role="button"`,
    `tabIndex={0}`, `aria-pressed` e `onKeyDown` (Enter/Espaço) preservando o
    clique original (`jsx-a11y/click-events-have-key-events`,
    `jsx-a11y/no-static-element-interactions`);
  - `ui/card.tsx`: `CardTitle` é um `<h3>` genérico do design system que
    recebe o conteúdo via `{...props}` (spread), invisível para a análise
    estática do lint; suprimido com `eslint-disable-next-line` documentado,
    em vez de alterar o componente compartilhado (`jsx-a11y/heading-has-content`).
- `npm audit` seguiu em 0 vulnerabilidades (nenhuma ação de `audit fix`
  necessária). Nenhuma dependência claramente não usada foi encontrada para
  remover.
- Verificação final do zero, todas passando: `npm run lint`, `npm run
  typecheck`, `npm run test -- --run` (140 testes, 20 arquivos — 13 a mais que
  os 127/19 reportados pelo agente de testes, pelos 13 novos testes de
  `sanitize.ts`), `npm run deadcode`, `npm run build`.

## Onda 2 — Item 18: testes de `auth.ts` e `stripe-client.ts` (esm-tests)

Fecha a pendência registrada acima ("`auth.ts`/`stripe-client.ts` ... não
foram cobertos por teste automatizado nesta auditoria"), aplicando a mesma
técnica de alias do Vitest já usada para `sanitize-html`.

- **`vitest.config.ts`**: dois novos aliases em `resolve.alias`, resolvendo os
  imports runtime `https://esm.sh/...` desses dois módulos para as cópias
  locais em `node_modules` (mesmo pin de versão do import Deno):
  - `"https://esm.sh/@supabase/supabase-js@2.89.0"` → `"@supabase/supabase-js"`
    (já era `dependencies` de produção — usado de verdade pelo frontend em
    `src/integrations/supabase/client.ts` — nenhuma instalação nova
    necessária);
  - `"https://esm.sh/stripe@18.5.0"` → `"stripe"` (nova devDependency,
    `stripe@18.5.0`, pin exato igual ao import Deno, mesmo padrão do
    `sanitize-html@2.17.0`).
- **`supabase/functions/_shared/auth.test.ts`** (18 testes): `createServiceClient`
  e `requireUser` cobertos fim a fim. Como `requireUser` chama
  `userClient.auth.getUser(token)` (I/O real), o alias sozinho não bastava —
  o módulo `@supabase/supabase-js` (resolvido) é mockado com `vi.mock` +
  `vi.hoisted` para controlar `createClient`/`auth.getUser` sem rede. Cobre:
  ausência/formato inválido do header `Authorization`, token igual à anon key
  (rejeitado — não pode ser usado para se passar por usuário autenticado),
  `getUser` retornando erro ou `user: null`, esquema `bearer` case-insensitive,
  variáveis de ambiente Supabase ausentes/em branco (`SERVER_MISCONFIGURED`),
  e o contrato de retorno no caminho feliz (`{ user, token, userClient,
  serviceClient }`, com o client de usuário recebendo a anon key + o token do
  chamador em `Authorization`, e um client de service role separado).
- **`supabase/functions/_shared/stripe-client.test.ts`** (9 testes): `stripeClient()`
  testado contra o pacote `stripe` real (via alias) — sem mock, mesma
  abordagem usada para `sanitize-html`, já que construir um `Stripe` não faz
  I/O de rede. Cobre: `STRIPE_SECRET_KEY` ausente/vazia/só espaços
  (`AppError STRIPE_NOT_CONFIGURED`, 503, `expose: false` — confirmado que
  `errorMessage()` nunca vaza a mensagem interna), instância `Stripe` real
  retornada com `apiVersion` fixado em `2025-08-27.basil`, namespaces de
  recurso usados pelo restante do código (`subscriptions`, `customers`,
  `paymentIntents`, `charges`, `checkout.sessions`), `httpClient` baseado em
  `fetch` (`Stripe.createFetchHttpClient()`, necessário no runtime Deno edge
  — sem isso o SDK tentaria usar módulos `http`/`https` do Node) e ausência de
  cache entre chamadas.
- `knip` não acusou nada: `stripe` já é importado de verdade em
  `stripe-client.test.ts` (para os `toBeInstanceOf(Stripe)`), então não
  precisou de `ignoreDependencies` — diferente de `sanitize-html`, que só é
  referenciado através do alias.
- Suíte completa validada do zero: `npm run lint`, `npm run typecheck`,
  `npm run test -- --run` (**165 testes, 22 arquivos** — 25 a mais que os
  140/20 anteriores), `npm run deadcode`, `npm run build`. Todas verdes.

## Onda 2 — item ci-gitleaks: secret-scan no CI

Não existia nenhum workflow de CI no repositório. Adicionado
`.github/workflows/ci.yml` com dois jobs independentes:

- **`secret-scan`**: `actions/checkout@v4` com `fetch-depth: 0` (histórico
  completo) + `gitleaks/gitleaks-action@v2`, que lê `.gitleaks.toml` na raiz
  do repositório. `GITLEAKS_LICENSE` não deveria ser necessário porque o
  remote (`github.com/garciarsdiego/email-muse`) é conta pessoal, não
  organização — a confirmar na primeira execução real do Actions, caso o
  repositório tenha sido transferido para uma org.
- **`web`**: `actions/setup-node@v4` (Node 22, cache `npm`) + `npm ci` +
  `npm run lint` + `npm run typecheck` + `npm run test` + `npm run build`,
  espelhando o `npm run check` local (exceto `knip`, que fica de fora do CI
  por enquanto).
- Criado `.gitleaks.toml` na raiz com `[extend] useDefault = true` (herda o
  ruleset padrão do gitleaks) e um `[allowlist]` que ignora paths de baixo
  risco (`.env.example`, `supabase/functions/.env.example`,
  `package-lock.json`, `deno.lock`) e faz allowlist explícita de 4 commits
  históricos onde a chave anon/publishable do Supabase ficou versionada em
  `.env` antes do `.gitignore` cobrir o arquivo (era Lovable) — já
  documentado em `docs/security-v2.md` como exposição conhecida e não
  sensível (chave pública por design, protegida por RLS). Sem essa allowlist
  o job `secret-scan` falharia permanentemente por um segredo já
  classificado como seguro. As 4 SHAs completas foram conferidas nesta
  validação e existem no histórico do repositório (`git cat-file -t`).
- **Verificação do finalizador**: sintaxe de `.github/workflows/ci.yml`
  validada com `js-yaml` (parse sem erros, chaves e blocos `${{ }}`
  corretos). `npm run lint`, `npm run typecheck`, `npm run test -- --run`
  (165/22) e `npm run build` re-executados do zero nesta mesma sessão,
  incorporando também o item esm-tests acima — todos verdes, confirmando que
  o job `web` do CI passaria na primeira execução.
