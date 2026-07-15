# Proposta de Design System v3 — Emailnator

> Documentação da demo visual em `demo/index.html`.
> Abra o arquivo no navegador para comparar lado-a-lado o design **atual** (esquerda) e o **proposto** (direita) usando a barra arrastável central.

---

## 1. Premissa

A proposta **não descarta** o sistema atual — ela o **escala**. A paleta terracota + papel quente já está alinhada com a direção premium do mercado em 2026 (Klaviyo, Loops, beehiiv). O que falta é:

- **Densidade visual** (mockups vivos, números, logos)
- **Micro-interações** (scroll reveal, count-up, marquee)
- **Componentes faltantes** (Stat, LogoCloud, Testimonial)
- **Upgrade tipográfico** mais contemporâneo

A demopage demonstra exatamente essas quatro frentes aplicadas sobre o mesmo layout.

---

## 2. Como usar a demo

1. Abra `demo/index.html` em qualquer navegador moderno (Chrome, Firefox, Safari, Edge).
2. A barra vertical central com a seta dupla é o controle.
3. **Arraste** com mouse, **deslize** com touch, ou use **← →** (Shift = passos de 10%) com o handle focado via Tab.
4. **Clique** em qualquer ponto da página para mover a barra até lá.
5. **Home / End** levam a 0% e 100%.

A label **"ATUAL"** (escura, à esquerda) mostra o design system atual.
A label **"PROPOSTO"** (terracota, à direita) mostra a versão modernizada.

---

## 3. Comparação lado-a-lado

### 3.1 Tokens fundamentais

| Token              | Atual                                 | Proposto                                          | Mudança |
| ------------------ | ------------------------------------- | ------------------------------------------------- | ------- |
| `--primary`        | `#C0491F` (terracota)                 | `#C0491F` (mantido) + `#D65A2A` (bright)          | +1 cor  |
| `--background`     | `#F5F1E8` (papel quente + grão)       | Idem + wash radial terracota no topo              | +camada |
| `--radius`         | `8px`                                 | `6px`                                             | -2px    |
| `--shadow-paper`   | `0 18px 44px -34px / 0.45`            | `0 24px 60px -32px / 0.5`                         | +6px    |
| `--shadow-glow`    | (não usado em superfícies)            | `0 0 80px -20px terracota / 0.4`                  | novo    |
| Tipografia body    | **DM Sans**                           | **Inter**                                         | troca   |
| Tipografia display | **DM Serif Display**                  | **Inter Tight** (sans grotesque)                  | troca   |
| Tipografia mono    | **IBM Plex Mono**                     | **JetBrains Mono**                                | troca   |

### 3.2 Componentes / padrões novos

| Padrão              | Local na demo               | Impacto                                                 |
| ------------------- | --------------------------- | ------------------------------------------------------- |
| EditorMockup vivo   | Hero direito                | Substitui CampaignSpecimen estático — mostra o produto  |
| Stat / StatGroup    | Stats band direito          | Prova social numérica (196k+, 1.7M, 97%)                |
| LogoMarquee         | Após capabilities           | Carrossel infinito de marcas — pausa no hover           |
| Eyebrow aprimorado  | Todas as seções             | Traço horizontal `—` antes do texto + gap               |
| Hero meta com LED   | Sub-CTA do hero             | Bolinha verde pulsante + texto "sem cartão"             |
| Button magnetic     | Todos os `.btn-primary`     | `translateY(-2px)` + glow shadow no hover               |
| Card hover lift     | Capabilities                | Background sobe + ícone rotaciona 8°                    |
| Workflow dot        | Numeração dos passos        | Círculo terracota + halo antes do número                |
| CTA glyph gigante   | Final CTA                   | `@` em 16rem com gradient clip — efeito editorial       |

---

## 4. Decisões de design — justificativa

### 4.1 Por que manter a paleta?

A análise de mercado mostrou que **Klaviyo usa exatamente o mesmo terracota** (`#C0491F` ≈ assinatura Klaviyo) e **Loops usa o mesmo schema creme + 6px radius + 1px border**. O sistema atual está alinhado com a direção premium 2026 — descartar a paleta seria perder posicionamento.

### 4.2 Por que trocar a tipografia?

DM Sans é excelente mas foi lançada em 2019 — soa "2021" no mercado. As três trocas propostas:

- **Inter** (body): melhor renderização em subpixel, mais neutra, usada por Linear, Vercel, Resend
- **Inter Tight** (display): variação condensada do Inter, mais aguda em títulos grandes
- **JetBrains Mono** (mono): mais legível que IBM Plex Mono em tamanhos pequenos

A troca é **invisível estruturalmente** — apenas o `<link>` do Google Fonts e o `fontFamily` do Tailwind mudam.

### 4.3 Por que reduzir radius de 8px → 6px?

A diferença é sutil mas perceptível em escala. 6px soa mais **"SaaS técnico"** (Linear, Vercel, Resend), enquanto 8px soa mais **"editorial soft"** (Mailchimp, Notion). Como o produto tem vibe ferramenta + editorial, 6px equilibra melhor.

### 4.4 Por que adicionar `--shadow-glow`?

O mercado (Klaviyo, Loops, beehiiv) usa brilhos sutis de cor de marca em CTAs e mockups. Adicionar um glow terracota no hero do editor mockup dá profundidade sem virar "neon genérico".

---

## 5. O que NÃO mudou (intencionalmente)

Estes elementos são a **identidade do produto** e foram preservados:

1. **Fundo creme com grão** (`background-size: 5px 5px`)
2. **Tipografia tripla** (serif/sans/mono — mesmo com troca de família)
3. **Eyebrow uppercase com letter-spacing**
4. **Editorial rules** (`border-foreground/15`)
5. **Layout assimétrico** do hero (`grid-cols: 1.02fr 0.98fr`)
6. **Workflow em `<ol>`** com bordas em zigue-zague
7. **Capacities com translate-y alternado**
8. **CTA com caractere decorativo gigante** (`@` em 12rem)
9. **Classes utilitárias**: `.paper-panel`, `.eyebrow`, `.editorial-rule`

---

## 6. Roadmap de implementação

A demopage prova o conceito; a implementação real no projeto React deve seguir esta ordem:

### Fase 1 — Quick wins (1-2 dias)

- [ ] Trocar fontes no `index.html` e `tailwind.config.ts` (DM Sans → Inter)
- [ ] Adicionar token `--primary-bright` e `--shadow-glow` no `index.css`
- [ ] Reduzir `--radius` para `6px` (1 linha)
- [ ] Adicionar `box-shadow` magnético nos botões (`button.tsx`)

### Fase 2 — Componentes novos (3-5 dias)

- [ ] Criar `src/components/v2/Stat.tsx` (baseado no `.stat-item` da demo)
- [ ] Criar `src/components/v2/StatGroup.tsx` (grid de 3 stats)
- [ ] Criar `src/components/v2/LogoMarquee.tsx` (com `prefers-reduced-motion`)
- [ ] Criar `src/components/v2/EditorMockup.tsx` (substituto do CampaignSpecimen)
- [ ] Aprimorar `Brand.tsx` com traço horizontal antes do eyebrow

### Fase 3 — Páginas (3-5 dias)

- [ ] Atualizar `src/pages/Index.tsx` com as novas seções (Stats + LogoMarquee)
- [ ] Aplicar novo eyebrow em todas as páginas internas (Dashboard, Pricing, Auth)
- [ ] Adicionar count-up animation via `useInView` hook

### Fase 4 — Dark mode como cidadão de primeira classe (2-3 dias)

- [ ] Toggle no `Header.tsx` (Sun/Moon do lucide)
- [ ] Persistência em `localStorage`
- [ ] Default dark para usuários autenticados

### Fase 5 — Micro-interações de luxo (3-5 dias)

- [ ] Hook `useScrollReveal` com IntersectionObserver
- [ ] Animations `marquee`, `count-up`, `shimmer-line` no `tailwind.config.ts`
- [ ] Magnetic cursor no hero principal

**Total estimado**: 12-20 dias para rollout completo, ou 1-2 dias para os quick wins de fase 1.

---

## 7. Estrutura técnica da demo

```
demo/
├── index.html           ← arquivo único self-contained
└── PROPOSTA_DESIGN.md   ← este arquivo
```

### 7.1 Como a comparação funciona

```css
.comparison {
  --pos: 50%;                    /* variável CSS controlada pelo JS */
  position: relative;
}
.side-current {
  clip-path: inset(0 calc(100% - var(--pos)) 0 0);  /* clipa conforme --pos */
  z-index: 2;                    /* fica acima do side-new */
}
.side-new {
  z-index: 1;                    /* renderizado por baixo, sempre completo */
}
```

O JS apenas atualiza a variável `--pos` (0% a 100%) em resposta a:
- mousedown / touchstart no handle
- mousemove / touchmove global
- click direto na área
- keydown (←, →, Home, End) no handle focado

### 7.2 Acessibilidade

- `role="separator"` no handle
- `aria-orientation="vertical"`
- `aria-valuemin`, `aria-valuemax`, `aria-valuenow` atualizados em tempo real
- `tabindex="0"` para foco por teclado
- `aria-label` descritivo
- Respeita `prefers-reduced-motion`? **Não aplicado na demo** (animações são parte da comparação), mas na implementação real deve ser.

### 7.3 Compatibilidade

- **Sem dependências externas além do Google Fonts**
- Vanilla CSS + JS — funciona em qualquer navegador moderno
- Touch + mouse + keyboard cobertos
- Responsivo até 360px

---

## 8. Métricas de sucesso

Como saber se a proposta vale a implementação?

| Métrica                          | Como medir                                  | Meta                    |
| -------------------------------- | ------------------------------------------- | ----------------------- |
| Tempo até "first value" no hero  | Teste de usabilidade (5s test)              | < 3s (atual: ~6s)       |
| Conversão de signup no `/`       | Analytics                                   | +15-25% vs. baseline    |
| Perceived quality (survey)       | Pergunta subjetiva pós-teste                | Nota ≥ 4.2/5            |
| Bounce rate no `/pricing`        | GA4                                         | -10%                    |
| Densidade de informação          | Audit visual: seções com propósito          | ≥ 7 seções ricas         |

---

## 9. Referências de mercado (resumo)

| Concorrente | Inspiração trazida para a proposta        |
| ----------- | ----------------------------------------- |
| **Klaviyo** | Stats band com numerais gigantes tabular  |
| **Loops**   | Wash gradient sutil + paleta creme idêntica |
| **beehiiv** | Logo marquee + badges flutuantes          |
| **Resend**  | Inter Tight para display, glow minimal   |
| **Stripo**  | Editor mockup como herói do marketing     |
| **Mailchimp** | Aprendido: NÃO copiar — destoa do tom    |

---

## 10. Próximos passos sugeridos

1. **Revisar a demo com stakeholders** — abrir `demo/index.html` em call
2. **Coletar feedback estruturado** — especialmente dos items: tipografia, radius, densidade
3. **Decidir escopo da fase 1** — validar quick wins antes do rollout completo
4. **Se aprovado**: implementar Fase 1 primeiro, medir, depois avançar

---

**Documento vivo.** Atualizar conforme decisões são tomadas e implementadas.
