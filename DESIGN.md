---
name: BioTracker
description: A quiet, honest personal ledger for daily health data.
colors:
  primary: "#137676"
  primary-foreground: "#f5fcfc"
  accent: "#e69d0a"
  accent-foreground: "#2c1e02"
  background: "#f8fcfd"
  foreground: "#16232b"
  card: "#ffffff"
  secondary: "#e4ebf1"
  secondary-foreground: "#1e3140"
  muted: "#e9f0f2"
  muted-foreground: "#52677a"
  border: "#cdd9df"
  destructive: "#bd1a1a"
  chart-weight: "#137676"
  chart-body-fat: "#2472cc"
  chart-muscle: "#25834e"
  chart-heart: "#c02138"
  chart-sleep: "#5e3aaa"
typography:
  headline:
    fontFamily: "Aptos, 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(1.5rem, 2.5vw, 1.875rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Aptos, 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  metric:
    fontFamily: "Aptos, 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Aptos, 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Aptos, 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.18em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "16px"
  segment-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  unit-chip:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.md}"
    padding: "0 12px"
---

# Design System: BioTracker

## 1. Overview

**Creative North Star: "The Personal Ledger"**

BioTracker is a durable, plainly-kept record of one person's own body data. The
interface behaves like a well-made ledger: legible, ordered, honest about what
it does and doesn't contain. Depth comes from structure — a fixed left rail, a
centered reading column capped at 64rem, borders and tonal fills that separate
without shouting — not from decoration. Teal is the one voice of the system;
everything else is quiet ink on cool paper. The tone is calm and utilitarian:
it respects the reader's time and never dramatizes a number.

The palette is a cool teal-slate on a barely-tinted near-white. A single warm
amber accent exists for the rare moment that genuinely needs attention; it is
not sprinkled for flavor. Five fixed metric hues (teal / blue / green / crimson
/ violet) are reserved exclusively for charting the corresponding data series,
never for UI chrome. Type is one family (Aptos) worked across weights; there is
no display face, because a ledger doesn't have a hero.

This system explicitly rejects the consumer-wellness playbook: no gamification,
no streak badges or confetti, no generic SaaS-cream background, no gradient
hero-metric block, no wall-of-charts cockpit. It also rejects any visual cue
that implies clinical authority — no red/green "good vs bad" verdicts on values,
no risk gauges, no diagnostic framing. Reports inform; they never advise.

**Key Characteristics:**
- One accent voice (teal), amber reserved for genuine attention only
- Flat-by-default: borders and tonal fills over shadows
- Cool near-white paper, dark teal-slate ink, no warm-cream default
- Single sans family (Aptos) across weights; no display face
- Metric hues are for data series only, never for chrome
- Honest presentation: `--` for missing values, no dramatization

## 2. Colors

A cool teal-slate palette on barely-tinted near-white paper, with one reserved warm accent and a fixed five-hue set for data series. Canonical values are authored in HSL (see the CSS custom properties in `src/styles/globals.css`); the hex in the frontmatter is the sRGB equivalent.

### Primary
- **Ledger Teal** (`#137676`, `hsl(180 72% 27%)`): The single brand voice. Used for the active nav item, primary buttons, selected segments, focus rings, links, and the weight data series. In dark mode it brightens to `hsl(176 62% 49%)` for contrast against the deep slate ground.

### Secondary (accent)
- **Signal Amber** (`#e69d0a`, `hsl(40 92% 47%)`): Reserved warm accent for the rare element that must pull the eye. Deliberately scarce — it is not a decorative flourish and does not appear on most screens.

### Neutral
- **Paper** (`#f8fcfd`, `hsl(190 35% 98%)`): App background. A cool near-white with a faint cyan tint toward the brand hue — never a warm cream.
- **Card White** (`#ffffff`): Container surfaces sit one step brighter than paper.
- **Ink** (`#16232b`, `hsl(205 34% 13%)`): Primary text; dark teal-slate, not pure black.
- **Muted Ink** (`#52677a`, `hsl(204 18% 39%)`): Secondary text, descriptions, metric labels. Meets 4.5:1 on paper and card — do not lighten it further.
- **Tonal Fill** (`#e4ebf1`, `hsl(207 32% 93%)`): `secondary` surface for unit chips, source panels, nav hover.
- **Divider** (`#cdd9df`, `hsl(199 24% 84%)`): 1px borders on cards, inputs, and rails.

### Chart (data-series only)
- **Weight** `#137676` · **Body Fat** `#2472cc` · **Muscle** `#25834e` · **Heart** `#c02138` · **Sleep** `#5e3aaa`. Fixed mapping, one hue per metric, brightened in dark mode. These belong to charts and the small metric-card icons that label a series — nowhere else.

### Named Rules
**The One Voice Rule.** Teal is the only brand color on any given screen. Amber is an exception you must justify, not a second accent. If two colors are competing for attention, one of them is wrong.

**The No-Verdict Rule.** Color never renders a health judgment. A value is never tinted red for "bad" or green for "good". The metric hues identify *which series*, not *how the user is doing*.

## 3. Typography

**Body / Display Font:** Aptos (with Segoe UI, system-ui, -apple-system, BlinkMacSystemFont, sans-serif)
**Mono Font:** SFMono-Regular (with Consolas, Menlo, monospace) — reserved for raw data / code echoes; rare in UI.

**Character:** One humanist-neutral sans across the whole product, differentiated by weight and size alone. There is no display face on purpose: the ledger speaks in one plain voice. Numbers are set in the same family at bold weight so a reading reads as substantial without needing ornament.

### Hierarchy
- **Headline** (700, `clamp(1.5rem, 2.5vw, 1.875rem)`, `-0.02em`, line-height 1.1): Page titles ("Dashboard", "Reports"). One per screen. `text-wrap: balance`.
- **Title** (600, `1.125rem`, line-height 1.3): Section headings inside cards ("Body Composition", "Review and save").
- **Metric** (700, `1.5rem`, `-0.01em`): The value display on metric cards. The largest number on a card is the point of the card.
- **Body** (400, `0.875rem`, line-height 1.5): Descriptions, field help, disclaimer copy. Cap prose at 65–75ch.
- **Label** (500, `0.75rem`, tracking `0.18em`, uppercase): Small structural labels like the "Source" tag. Used sparingly — this is the *only* place tracked uppercase is allowed.

### Named Rules
**The One Family Rule.** Aptos does every job. Never introduce a second typeface for "personality" — hierarchy comes from weight (400/500/600/700) and size, not from font pairing.

**The Honest Number Rule.** A missing metric renders as `--`, never as `0` and never hidden. The absence of data is itself information the ledger must show.

## 4. Elevation

Flat-by-default. Structure is carried by 1px dividers (`#cdd9df`) and tonal fills, not by shadow. Exactly one shadow exists in the system — `shadow-soft` — reserved for genuine content containers (entry-form sections, action bars). Metric cards and quick-record panels use the lighter `shadow-sm` as a whisper of separation from paper, never as a lift. Nothing floats; the interface reads like ink pressed into a page.

### Shadow Vocabulary
- **soft** (`box-shadow: 0 1px 2px hsl(205 34% 13% / 0.08), 0 8px 24px hsl(205 34% 13% / 0.08)`): Real containers only — form sections, the save/action bar.
- **sm** (Tailwind default `0 1px 2px 0 rgb(0 0 0 / 0.05)`): Subtle card separation on the dashboard.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. A shadow is a statement of containment, not a style. If a shadow is doing decoration rather than grouping, delete it and use a border.

## 5. Components

### Buttons
- **Shape:** Gently curved (6px radius, `rounded-md`), min touch height 44px (`min-h-11`).
- **Primary:** Teal fill (`#137676`), `primary-foreground` text, `shadow-sm`, padding `8px 16px`. Hover darkens via `bg-primary/90`. Icon + label, gap 8px. Used for the single most important action on a view (Save entry, Add Measurement).
- **Secondary:** Card-white fill, `#16232b` ink, 1px divider border. Hover shifts border to `primary/70` and fills `secondary`. For Cancel and low-emphasis actions.
- **Focus:** 2px `ring` (teal) outline, 2px offset — system-wide via `:focus-visible`.

### Metric Card
- **Corner:** 8px (`rounded-xl` mapped to `--radius`). **Background:** card white, 1px divider border, `shadow-sm`.
- **Anatomy:** muted label + series-colored icon on top row; large bold metric value below. On mobile the card is a square (`aspect-square`); on desktop it relaxes to `min-h-[140px]`. This is the signature surface — restrained, one number per card, no sparkline clutter.

### Section Card
- **Corner:** 8px. **Background:** card white, 1px divider border, `shadow-soft`. **Padding:** `16px` (`sm:24px`).
- Header pattern: a `40px` tonal-fill square holding a series/section icon (teal), beside a Title + muted description. Groups related form fields or report blocks.

### Inputs / Fields
- **Style:** 1px `input` border, paper background, 6px radius, `shadow-sm`, min-height 48px, `0.875rem` text. Placeholder uses `muted-foreground` (must hold 4.5:1).
- **Unit chip:** numeric inputs pair with a tonal-fill (`secondary`) suffix chip showing the unit (kg, %, bpm) — border + `secondary-foreground` text, same height as the field.
- **Focus:** 2px teal outline, 2px offset. **Error:** `aria-invalid` + `destructive` (`#bd1a1a`) helper text below. **Disabled:** `opacity-60`, `not-allowed` cursor.

### Segmented Control
- Row of buttons (`sm:grid-cols-3`). **Selected:** teal fill + `primary-foreground`, `shadow-sm`, `aria-pressed`. **Unselected:** paper, `foreground` text, divider border; hover → `primary/70` border + `secondary` fill. Left-aligned label with optional muted sub-description.

### Navigation
- **Desktop:** fixed 256px left rail, card background, right divider. Brand lockup (Activity icon in teal + "BioTracker" bold) at top. Items are icon + label; **active** = `primary/10` tint + teal text + medium weight; **hover** = `secondary` fill.
- **Mobile:** fixed bottom bar (64px), card background, top divider, `env(safe-area-inset-bottom)` padding. Icon over 10px medium label; **active** = teal text, no fill.

### Disclaimer Block
- Signature non-medical guardrail. Dashed `muted-foreground/40` border, `muted/30` fill, 8px radius, Info icon + heading + fine muted print. Appears on every report. Deliberately quiet and set-apart — it reads as a footnote, not an alert, because it must never look like a clinical warning.

## 6. Do's and Don'ts

### Do:
- **Do** keep teal as the one brand voice per screen; reserve amber for genuinely attention-worthy moments (The One Voice Rule).
- **Do** render missing metrics as `--`. Show gaps and flat trends honestly (The Honest Number Rule).
- **Do** carry structure with 1px dividers (`#cdd9df`) and tonal fills; reserve `shadow-soft` for real containers (The Flat-By-Default Rule).
- **Do** use metric hues (teal/blue/green/crimson/violet) only to identify data series, in charts and series icons.
- **Do** keep `muted-foreground` (`#52677a`) as the floor for secondary text — it holds 4.5:1 on paper. Verify contrast on tonal-fill surfaces too.
- **Do** pair numeric inputs with a unit chip so a value is never ambiguous.
- **Do** use one family (Aptos) across weights for all hierarchy.

### Don't:
- **Don't** gamify: no streak badges, confetti, mascots, or dopamine loops. Logging is a utility, not a game.
- **Don't** ship the generic SaaS-cream look — no warm near-white/cream background, no gradient hero-metric block, no endless identical icon+heading card grid, no tracked-uppercase eyebrow over every section (the "Source" label is the *only* sanctioned tracked-uppercase).
- **Don't** imply clinical authority: no red/green "good vs bad" tinting of values, no risk gauges, no diagnostic framing. Reports inform, never advise (The No-Verdict Rule).
- **Don't** build a data-overwhelming cockpit — one number per metric card, no wall of charts.
- **Don't** add a second typeface for "personality" (The One Family Rule).
- **Don't** use shadow as decoration or let cards float; if a shadow isn't grouping content, replace it with a border.
- **Don't** use `border-left`/`border-right` greater than 1px as a colored accent stripe on cards or the disclaimer — full borders only.
- **Don't** use gradient text or `background-clip: text` anywhere.
