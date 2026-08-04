---
name: commit-by-domain
description: "Use when the user wants their pending/uncommitted changes turned into a list of proposed commits grouped by domain (schema, models, services, UI, tests, docs, etc.) with Conventional-Commits-style English messages — e.g. 'dame una lista de commits ordenados por dominio', 'group these changes into commits', 'plan my commits by domain', 'how should I split this into commits'. Produces a review-then-iterate proposal (no git action taken) until the user explicitly confirms, then stages and creates the commits domain-by-domain. Do not use when the user directly says 'commit this' with no request for grouping/listing first — just follow the normal commit workflow in that case."
license: MIT
metadata:
  author: GFrancV
---

# Commit by Domain

A workflow for turning a pile of uncommitted changes into a clean, reviewable sequence of commits grouped by domain/concern rather than by the chronological order the files happened to be edited in — and for iterating on that grouping with the user before anything is actually committed.

## Ground rules

- **Listing is not committing.** Producing the list (even when explicitly asked for "commits to make") is not authorization to run `git add`/`git commit`. Only stage and commit after the user gives an explicit go-ahead on *this specific list* (e.g. "hazlo", "sí, procedé", "commit these"). If unsure, ask — don't infer consent from the listing request itself.
- **Commit messages are always in English**, even when the surrounding conversation is in another language — match this repo's own git history convention, not the conversation's language, unless the user says otherwise.
- **Iterate freely before committing.** The user may ask to merge two domains, split one, reword a message, drop a file, or reorder groups — re-present the updated list; don't re-litigate groups they didn't ask to change.
- **Never sweep in unrelated changes.** Anything in the working tree that predates or is unrelated to the session's actual work must be explicitly flagged and excluded from every group,not silently included or silently dropped.
- **Never use `git add -A`/`git add .`.** Stage each group's files by exact name.
- **Check for secrets before staging.** Skim the diff of each file in a group for anything that looks like a credential/token/key — even in an innocuous filename — and flag it to the user instead of staging it silently.

## Step 1 — Inventory the real diff

- `git status` (never `-uall`) and `git diff --stat` to see everything that changed.
- For every modified/untracked file, confirm it's actually part of what was just built in this session. Cross-check against the conversation: if a file's diff doesn't map to anything discussed, it's unrelated — flag it by name and by what it appears to be (e.g. "already modified before this session started", "untracked directory unrelated to this task") and exclude it from every proposed group.
- If a single file mixes this session's work with unrelated pre-existing changes that can't be cleanly separated, say so explicitly rather than picking a side silently.
- If a single file legitimately belongs to two domains of this session's *own* work (e.g. a model file with both a schema-level change and a UI-facing accessor), decide whether to split it with `git add -p` into two groups or keep it as one group under whichever domain is primary — state the call explicitly rather than assigning it silently.

## Step 2 — Group by domain, not by edit order or finding/task ID

Domain = the layer or concern the files serve *together*, not the order they were touched in or which finding/task prompted the edit — a domain is what a reviewer would want to evaluate independently.

**Pick a taxonomy based on the project's actual shape.** Detect it from manifest/config files before grouping (don't ask the user unless it's genuinely ambiguous). Each list below is roughly in dependency order (earlier groups are usually what later ones build on):

- `composer.json` + `artisan` (Laravel), or an equivalent Rails/Django layout → **Layered backend**:
  1. Schema + models (migrations, ORM models, casts/mutators, policies)
  2. Observers / events / listeners / jobs reacting to the model layer
  3. Services / actions / controllers consuming the model layer
  4. UI (admin panel vs. customer-facing as separate groups if independently reviewable)
  5. Factories + seeders
  6. Tests
  7. Docs
- `astro.config.*` → **Astro**:
  1. Content layer (content collections, `content.config.*`, frontmatter schemas)
  2. Integrations/config (`astro.config.*`, adapters)
  3. Layouts
  4. Pages/routes (`src/pages/`)
  5. Components (islands — split by framework if mixed: React/Vue/Svelte)
  6. Styles/assets
  7. Tests
  8. Docs
- `package.json` with a `react`/`next` dependency → **React**:
  1. State/data (hooks, context, stores, API clients)
  2. Routing (`app/`/`pages/` if Next.js, route definitions otherwise)
  3. Components (feature vs. shared/ui-kit as separate groups if independently reviewable)
  4. Styles/theming
  5. Build/config
  6. Tests
  7. Docs
- `package.json` with a `vue` dependency → **Vue**:
  1. Store (Pinia/Vuex)
  2. Composables
  3. Router
  4. Components/Views (`.vue` SFCs, grouped by feature)
  5. Styles
  6. Build/config
  7. Tests
  8. Docs
- `wp-content/` or a theme/plugin header comment → **WordPress**:
  1. Custom post types / taxonomies / ACF field group registration
  2. Gutenberg blocks (`block.json`, edit/save JS)
  3. Plugin/theme functionality (hooks, filters, shortcodes)
  4. Theme templates (PHP)
  5. Enqueued assets (CSS/JS)
  6. Tests
  7. Docs/readme
- Top-level dirs named after tools/apps with no single build manifest (e.g. this repo) → **Infra/dotfiles**: config per tool → shared scripts/aliases → docs/README
- A `bin/`/`cmd/` entrypoint with a core lib and no UI layer → **CLI/library**: commands/subcommands → core lib → build/packaging → docs
- Any other frontend framework not listed above (Svelte, Angular, Solid, ...) → **Frontend-only fallback**: components/hooks-state → routing → styles/theming → tests → docs
- None of the above fit → fall back to the general principle: group first by top-level directory/tool boundary, then split by concern within that.

Don't force every session into exactly one template's buckets — split further if two concerns in the same layer are independently reviewable (e.g. two unrelated bugfixes touching different call sites in the same layer), and merge if a domain would otherwise be a single trivial file that's tightly coupled to its neighbor.

*Optional, never required:* if a framework-specific MCP is already connected in the session (e.g. Laravel Boost) and exposes a read-only introspection tool (routes, schema, models), it can be used as a second opinion on an ambiguous file — but the file-based heuristic above must work standalone with zero MCP connected.

## Step 3 — Draft each commit

For each domain group:
- List the exact files (repo-relative paths).
- Check `git log --oneline -15` once per session to match this repo's actual prefix convention (`feat(scope):`, `fix(scope):`, etc.) — don't assume Conventional Commits if the repo doesn't actually use it.
- Write a message: an imperative summary line, then a body explaining *why* (the problem/motivation/decision), not a restatement of the diff — pull the "why" from the conversation's own reasoning (a bug found in review, a design decision confirmed with the user, a precedent from another platform, etc.), the same way a good PR description would.
- If the session had no real discussion behind a change (trivial fix, no back-and-forth), don't invent a rationale — use just the imperative summary line and skip the body rather than fabricating a "why".

## Step 4 — Present, then iterate

Present the full ordered list before touching git. Number the groups. Wait for either:
- A request to adjust (merge/split/reword/reorder/exclude a file) — apply it, re-present the updated list.
- An explicit go-ahead — proceed to Step 5.

## Step 5 — Execute (only after explicit go-ahead)

For each group, in order:
- Stage only that group's files by exact name.
- `git status` after staging to confirm exactly the intended files are staged — nothing more, nothing less.
- Never pass `--no-verify` or otherwise skip hooks. If a hook fails, stop, report it, and let the user decide — don't skip it to keep the sequence moving.
- Commit with the drafted message via heredoc (preserves line breaks correctly).
- Move to the next group.

Verify with a final `git log --oneline` and `git status` (clean tree) once all groups are committed. Report the final list of commit hashes + one-line summaries back to the user.