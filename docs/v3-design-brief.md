# Emailnator V3 design brief

## Design read

Reading this as a market-led redesign of a creative SaaS for campaign operators, founders, creators and agencies. The landing can be editorial and art-directed; the authenticated workspace must be technical, fast and calm.

## Chosen direction

Name: Emailnator
Descriptor: Campaign Studio
Language: PT-BR
Positioning: campanhas com contexto, prontas para editar e exportar.

## Visual thesis

Emailnator should feel like a campaign desk: paper, notes, editorial judgment and a precise digital editor. The product should not look like a generic AI chat wrapper. It should feel like a focused instrument for turning brand context into usable email assets.

## Palette

- Paper: `hsl(42 38% 96%)`
- Soft paper: `hsl(42 48% 98%)`
- Ink: `hsl(24 18% 12%)`
- Muted ink: `hsl(25 10% 40%)`
- Terracotta: `hsl(9 68% 45%)`
- Terracotta bright: `hsl(12 66% 54%)`
- Graphite: `hsl(30 8% 15%)`
- Graphite soft: `hsl(28 9% 22%)`
- Border: `hsl(30 18% 81%)`

## Typography

V3 keeps the V2 font family initially:

- Display: DM Serif Display
- Body: DM Sans
- Utility: IBM Plex Mono

Rationale: the existing serif/sans/mono trio carries the editorial identity better than a generic Inter migration. If a later brand pass chooses a sans-led identity, test Geist/Satoshi/Cabinet before Inter.

## Shape and surfaces

- Radius remains tight: 8px for panels, 6px for controls.
- Cards are used for real workspace hierarchy, not decorative repetition.
- Landing uses editorial sections, oversized type and product mockups.
- Workspace uses compact panels, tabular numbers, clear controls and strong focus states.

## Motion

- Use `motion` for entrance, hover and layout transitions.
- Use GSAP only for isolated landing choreography if it materially improves storytelling.
- Respect `prefers-reduced-motion`.
- No magnetic cursor or ornamental motion in editor/workspace.

## Image direction

Generated section references live in the Codex generated images folder for this thread. They are guidance, not source assets. Implementation should recreate structure with real React/CSS and restrained decorative material.

Use images as product context only when they support the campaign/editor metaphor. Do not use fake customer logos, fake metrics or invented social proof.

## Landing sections

1. HeroProductStage: off-grid editorial hero with real product editor mockup.
2. BriefingStudio: brand memory and campaign briefing as a guided flow.
3. FeatureBento: five high-signal capabilities, no fake proof.
4. EditorShowcase: block editor and export controls.
5. FunnelSequence: visual sequence builder with inspector.
6. FinalCTA: direct action, honest promise.

## Workspace principles

- Keep the header and navigation predictable.
- Make "brand context" visible before generation.
- Reduce vertical form fatigue by grouping briefing into progressive panels.
- Make editor modes explicit: edit, preview, HTML.
- Empty states should explain the next useful action.
- Pricing and credit copy should be plain and non-manipulative.

## Non-negotiables

- No fake logos.
- No fake statistics.
- No "trusted by" without real customers.
- No dark mode as authenticated default.
- No unbounded animation in productivity surfaces.
- No claims about native sending, CRM or integrations until implemented.
