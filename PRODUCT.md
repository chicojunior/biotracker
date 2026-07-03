# Product

## Register

product

## Users

A single individual tracking their own health data over time — weight and body
composition, blood pressure, resting heart rate, sleep, steps, workout and
nutrition notes. Not a clinician, not a team. They open BioTracker to log a
reading in seconds (often right after stepping off a smart scale or checking a
band), then occasionally to review how a metric is trending across days, weeks,
or months. Context is personal and routine: a fast, private, manual-first log
they own end to end, with device/platform sync as a future convenience rather
than a dependency.

## Product Purpose

BioTracker is a personal health tracking app: record health metrics in one
place and review simple daily / weekly / monthly summaries. It exists to give
one person a durable, owned record of their own body data without handing it to
a platform. Success = logging an entry is frictionless, past data is easy to
find and trust, reports surface honest trends, and the whole record can be
backed up and restored as JSON. The current build is a React SPA; the active
work is a rewrite to Ruby on Rails preserving domain behavior, reporting
semantics, and the manual-first ethos.

## Brand Personality

Focused, utilitarian, precise. Three words: **fast, honest, quiet.** The voice
is plain and direct — a well-built personal tool, not a coach and not a
consumer wellness brand. It respects the user's time and intelligence: minimal
decoration, maximal signal, no motivational theater. Data is presented
truthfully, including gaps and flat trends. Calm confidence over enthusiasm.

## Anti-references

- **Not gamified or gimmicky.** No streak badges, confetti, dopamine loops,
  mascots, or nudge-to-engage patterns. Logging is a utility, not a game.
- **Not generic SaaS-cream.** Avoid the AI-default look: warm near-white/cream
  body background, gradient hero-metric block, endless identical icon+heading
  card grids, tiny tracked uppercase eyebrows over every section.
- **Not medical or clinical guidance.** Reports are informational only. No
  diagnosis, prescription, risk scoring, or "you should" health advice. Every
  report carries a non-medical disclaimer. (Non-negotiable product constraint.)
- **Not a data-overwhelming cockpit.** Single-user personal tracking stays
  simple and legible; no wall-of-charts dashboard.

## Design Principles

- **Manual-first, always.** The fastest path is always the human logging a
  value by hand. Automation and device sync augment that path; they never
  replace or gate it.
- **Honest data, no theater.** Show real trends including missing days and flat
  lines. Never dramatize a number, never imply meaning the data doesn't carry.
- **Speed is the feature.** Entry and review are measured in seconds. Every bit
  of chrome that doesn't serve logging or reading gets cut.
- **Own your record.** The data belongs to the user — legible history,
  transparent semantics, JSON backup/restore as a first-class capability.
- **Ready for more sources, biased toward none.** The model and UI stay open to
  smart scale / band / BP / fitness-platform / CSV inputs without complicating
  the manual core today.

## Accessibility & Inclusion

Target **WCAG 2.1 AA.** Body text ≥4.5:1 and large text ≥3:1 against their
backgrounds (verify against the tinted surfaces, not assumed). Full keyboard
operability for entry forms, history, and settings. Honor
`prefers-reduced-motion` with non-motion alternatives. Charts must remain
readable for color-vision deficiency: distinguish metric series by more than hue
(shape, label, direct annotation), never color alone. Support both light and
dark themes at AA contrast.
