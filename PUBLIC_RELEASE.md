# Public release status

## Product

**Emailnator** is a workspace for generating, editing, organizing, and exporting email campaigns. It supports structured content generation, a block editor, persisted campaign assets, and Stripe-backed credits; it does not send email on the user's behalf.

## Verified status

The V2 implementation passed build, typecheck, lint, 165 tests, audit, and secret scanning in the 2026-07-18 release audit. It is ready for code review and a controlled deployment, not a claim that every product flow has full end-to-end coverage.

## Roadmap

1. Rotate or retire legacy Supabase API keys before public deployment.
2. Add coverage for AI generation and remaining frontend flows.
3. Decide whether to introduce a cumulative monetary ledger for repeated partial refunds.
4. Validate Stripe checkout and webhooks in staging, then publish a stable release.

## Security boundary

Use `.env.example` only as a template. `VITE_*` values are browser-visible; AI, Stripe, and service credentials must remain in Supabase or the deployment provider's secret store.

## License

Licensed under the [MIT License](LICENSE).
