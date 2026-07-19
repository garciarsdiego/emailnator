# Emailnator 2.0

Workspace para gerar, editar, organizar e exportar campanhas de email. A V2 mantém React, Vite e Supabase, mas reorganiza o produto em módulos de domínio, move cobrança de créditos para o servidor e substitui fluxos simulados por persistência real.

## O que está incluído

- geração de email, texto de bloco e funil com respostas validadas;
- análise de site com proteção contra SSRF;
- editor visual por blocos com HTML sanitizado e compatível com email;
- documentos editáveis, templates, campanhas e sequências persistidos no Supabase;
- planos, créditos extras, checkout, portal do cliente e webhook Stripe;
- rotas protegidas por autenticação e plano;
- interface responsiva e acessível, sem prometer disparo de email ou recursos de equipe.

O Emailnator produz e exporta o conteúdo. O envio continua sendo feito no provedor de email escolhido pelo usuário.

## Requisitos

- Node.js 22.12 ou superior;
- npm 10 ou superior;
- projeto Supabase para autenticação, banco e Edge Functions;
- Deno para validar localmente as Edge Functions;
- Stripe, Firecrawl e uma chave do gateway de IA para os recursos correspondentes.

## Ambiente local

```bash
npm install
cp .env.example .env
npm run dev
```

No PowerShell, use `Copy-Item .env.example .env`. Preencha apenas as três variáveis públicas `VITE_SUPABASE_*`. Segredos de backend nunca devem receber o prefixo `VITE_`.

## Comandos

```bash
npm run dev       # servidor local em 127.0.0.1:8080
npm run lint      # ESLint
npm run typecheck # TypeScript strict
npm run test      # Vitest (roda uma vez e sai)
npm run test:watch # Vitest em modo watch
npm run deadcode  # arquivos, exports e dependências sem uso
npm run build     # build de produção
npm run preview   # serve o build de produção localmente
npm run check     # todos os gates acima, na ordem: lint, typecheck, test, deadcode, build
```

O `npm run test` cobre `src/**/*.test.{ts,tsx}` (componentes, hooks e regras de negócio do frontend) e `supabase/functions/**/*.test.ts` (módulos compartilhados das Edge Functions: validação, proteção contra SSRF, rate limit, créditos, sanitização de HTML e processamento do webhook Stripe). Esses testes rodam em Node/Vitest, não em Deno; `Deno.env`/`Deno.resolveDns` são simulados via stub por teste (ver `supabase/functions/_shared/test-support.ts`). Módulos que importam pacotes reais via `https://esm.sh/...` no runtime resolvem esse import para a cópia local em `node_modules` via alias em `vitest.config.ts` (ver `sanitize.ts`, testado com a devDependency `sanitize-html`); `auth.ts` e `stripe-client.ts` ainda não têm teste automatizado — ver pendências na auditoria mais recente em `CHANGELOG-AUDITORIA.md`.

## Supabase e serviços externos

As variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são fornecidas pelo ambiente das Functions. Configure também:

- `APP_ORIGIN` e, opcionalmente, `ALLOWED_ORIGINS`;
- `LOVABLE_API_KEY` e, opcionalmente, `AI_MODEL`;
- `FIRECRAWL_API_KEY`;
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `STRIPE_TRIAL_DAYS`;
- IDs Stripe opcionais descritos em `supabase/functions/_shared/stripe-catalog.ts`.

Aplicação inicial em um projeto vinculado:

```bash
supabase db push
supabase functions deploy
```

Cadastre no Stripe o endpoint `https://<project-id>.supabase.co/functions/v1/stripe-webhook`. Não aplique a migration V2 sem ler a nota de normalização de créditos em [Segurança](docs/security-v2.md).

## Estrutura

- `src/app`: providers, query client, roteamento e guards;
- `src/features`: autenticação, billing, geração, editor e funis;
- `src/shared`: contratos de infraestrutura reutilizáveis;
- `src/components`: composição visual e primitives realmente usadas;
- `supabase/functions`: adaptadores HTTP finos e módulos compartilhados;
- `supabase/migrations`: schema, RLS, ledger, jobs e RPCs transacionais.

Veja [Arquitetura V2](docs/architecture-v2.md) e [Segurança V2](docs/security-v2.md) para decisões e limites do sistema.

## Checklist antes de publicar

Antes de fazer deploy de uma branch de trabalho para produção:

1. Configure os segredos de backend (Supabase, Stripe, IA, Firecrawl) no ambiente de destino — nunca no `.env` do frontend.
2. Aplique as migrations em um ambiente de staging antes de produção (`supabase db push`).
3. Cadastre/atualize o endpoint do webhook Stripe.
4. Rode `npm run check` (lint, typecheck, test, deadcode, build) e confirme que os cinco gates passam.
