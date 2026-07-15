# Emailnator V3 execution plan

## Branch

`codex/v3-market-led-design-system`

## Scope

The user approved the full app scope:

- landing;
- auth;
- pricing;
- dashboard;
- email generation;
- editor;
- funnel builder;
- history and reusable documents where relevant.

Backend V2 remains preserved unless a UI flow exposes a missing contract.

## Sequence

### Phase 1: Foundation

- Add V3 documentation.
- Add V3 tokens and shared component helpers.
- Add motion dependency for controlled UI transitions.
- Keep GLM `demo/` as a local design reference.

### Phase 2: Public surfaces

- Rebuild landing around the six-section V3 narrative.
- Update pricing copy and layout.
- Update auth to match the new product language.

### Phase 3: Workspace surfaces

- Refresh header/navigation and dashboard.
- Convert email generation into a campaign briefing studio.
- Improve editor framing, toolbar clarity and empty states.
- Improve funnel builder visual sequence and inspector language.

### Phase 4: Hardening

- Audit copy in PT-BR.
- Add or preserve loading, empty and error states.
- Check keyboard focus and reduced motion.
- Test mobile at 390px and short desktop height.

### Phase 5: Validation

- `npm run check`
- `npm audit`
- Browser QA for `/`, `/auth`, `/pricing`, `/dashboard`, `/email-ai`, `/email-builder`, `/funnel-builder`.
- Test login with `diego@teste.com` if the configured Supabase project is reachable.

## Risk controls

- Keep changes frontend-first.
- Do not touch migrations or Edge Functions unless necessary.
- Avoid broad dependency churn.
- Preserve route slugs and protected-route behavior.
- Do not introduce unproven market claims.
