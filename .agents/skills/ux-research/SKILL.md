---
name: ux-research
description: Researches a UI/UX question before it's decided or built: audits an existing screen, picks between design options, or checks a solution already built. Backs every recommendation with external references (design systems, accessibility, usability, comparable apps) and checks it fits the project's own design system. Writes no code.
disable-model-invocation: true
---

# UX research

A screen or a UI decision gets researched before anyone builds or changes it. You research and recommend, I decide. Every interface has to be **functional, intuitive (no useless, confusing or repeated information), useful, good-looking, and consistent with the current design system.**

## Modes (infer from my request)

- **Audit:** an existing screen or flow feels wrong. Find out why and how far the problem goes.
- **Decide:** a new or changed UI has open choices (layout, size, control type, copy, empty/error states, where a control goes).
- **Verify:** something is already built. Is it correct against standards and the design system?
- **Is it real?:** I noticed something (a flash, a shift, a misalignment). Reproduce and measure it before giving an opinion.

## Steps

1. **Read the project's design rules first:** CLAUDE.md / CONSTRAINTS.md UI sections, the token file, and the current list of primitives (e.g. `components/ui/`). Then read the screens and components involved.
2. **Consistency inventory.** Find every place in the app that solves the same concept (the same action, path display, dialog, badge, link, error) and put them in a table with `file:line`. Inconsistency is usually the finding.
3. **Root cause vs. patch.** If what I asked for patches a symptom (a tooltip, a one-off spacing fix) of a bigger UX problem, say so and describe the root fix. If both make sense, say whether the patch still earns its place after the root fix.
4. **External research → a fresh subagent with `model: "sonnet"`.** Brief it with: the context (stack, theme, the component as it is today, the concern), numbered questions, and the sources to check. It reports in English, with a URL for every claim, and ends with a concrete recommendation (numbers when they apply: widths, heights, characters per line, timing). Sources, picking what applies:
   - Design systems: Material 3, Apple HIG, Fluent 2 / WinUI, GitHub Primer, Atlassian, IBM Carbon, Shopify Polaris, GOV.UK, and the official docs of the project's own UI library (shadcn/Radix…). **Check whether the library already solves this before inventing anything.**
   - Accessibility: WAI-ARIA APG, WCAG 2.2.
   - Usability: NN/g (Nielsen's heuristics), Baymard, Shneiderman, Norman.
   - Comparable apps (same category, plus well-known desktop apps such as VS Code, Obsidian, Slack, KeePassXC): how they solve this exact case.
   Verify yourself any claim a decision depends on.
5. **Is it real? → measure, don't guess.** Reproduce it in the running app (scripted browser or Playwright, timings, bounding boxes, computed styles) and report numbers before recommending a fix or no fix.
6. **Filter through the design system.** Every recommendation uses existing primitives and semantic tokens. If none fits, say which library component would (don't add it) or that a custom component is needed. A recommendation that looks foreign in the app fails, however standard it is.
7. **Show it when it's visual.** When the choice is about how something looks (size, badge vs. button, link vs. button, density), publish an Artifact mockup using the project's real tokens, with each option side by side and realistic content (short, medium and long when content size matters). Iterate on it with me.
8. **Ask the open decisions one at a time,** each with your recommendation and its reference.

## Rules

- **No reference, no recommendation.** Each one carries its link (external) or `file:line` (code). Code reasoning alone isn't enough.
- **Less is more.** Prefer removing or merging information over adding it. Flag anything repeated, decorative or ambiguous. Never add a hint or tooltip to explain a control that could just be clearer.
- **Honest severity.** Say plainly when something is fine and needs no change. Don't pad.
- **Respect past decisions** in the project docs and my memory. Don't re-propose what was decided against.
- **Don't write or edit code.** Output feeds /story or /backlog.
- Chat in my language. Anything that ends up in the repo or an issue is in English.

## Output format

```markdown
## Findings
### 1. <what's wrong> (<severe | medium | minor>)
`file:line` — what it does, why it fails (heuristic / guideline + link), the concrete scenario.

## Consistency
| Concept | Screen A | Screen B | ... |

## How others solve it
- <app or design system>: <pattern> (<link>)

## Recommendation
- <change>: <why>, (<reference>). Fits the design system via <primitive/token>.

## Open decisions
1. <question> — suggested: <answer> (<reference>)
```

Omit sections that don't apply (Verify mode may be only Findings + Recommendation).
