# dotfiles

Personal dotfiles repo, meant to move configs and environment setups easily
between devices. Currently holds Claude Code skills; more tools (zsh,
alacritty, ...) will be added as modules over time.

## Contents

- **`.agents/skills/`** — tool-agnostic skill sources, symlinked into
  `~/.claude/skills/` on install.
  - `commit-by-domain` — groups pending git changes into a reviewable,
    domain-ordered list of commits; only stages/commits after an explicit
    go-ahead.
  - `privacy-inventory` — builds a plain-language Word inventory of the
    personal data, emails, third parties, retention and cookies a site
    handles, read from its code, for the client's legal team.
- **`.agents/AGENTS.md`** — global rules meant to apply to every repo/project,
  regardless of which coding agent is working in it. Symlinked on install to
  each agent's own global config path: `~/.codex/AGENTS.md` (Codex CLI) and
  `~/.claude/CLAUDE.md` (Claude Code).

## Requirements

Linux (bash + coreutils). Windows isn't automated yet — configs are kept in
sync there manually for now.

## Installation

**1. Clone into a fixed, permanent path: `~/.dotfiles`.**

```sh
git clone <repo-url> ~/.dotfiles
cd ~/.dotfiles
```

This matters: `install.sh` symlinks files from inside this repo into their
target locations. If the repo is later moved or deleted, every symlink it
created breaks silently. Cloning to a stable, well-known path — the same
convention tools like dotbot recommend — makes that far less likely to
happen by accident. Treat `~/.dotfiles` as live infrastructure, not a
folder you casually delete or relocate.

**2. Run the installer.**

```sh
./install.sh
```

You'll be prompted per item (`[y/N]`) for each module found. Answering `y`
creates a symlink from the repo into place; `N`/Enter skips it.

**3. (Optional) check for broken symlinks**, e.g. after moving the repo or
if a link stops working:

```sh
./install.sh check
```

Scans every managed target for dangling symlinks and offers to remove each
one it finds, one by one.

## How it works

- `install.sh` defines a `MODULES` list mapping a source folder in this
  repo to a destination folder on your system.
- Items inside each module are installed as individual symlinks (`ln -s`),
  not copies — editing the file at its destination edits the repo file
  directly, so there's no manual copy-back step.
- If a destination already exists as a real file/folder (not a symlink),
  it's backed up to `<name>.bak` before the symlink is created. Running
  install again over another conflict overwrites that `.bak` (with a
  warning first).

## Adding a new module

For a folder of interchangeable items (like `.agents/skills/`, where each
subfolder is linked 1:1 into the target dir), add a line to `MODULES` in
`install.sh`:

```
"label:source_relative_to_repo:absolute_target_dir"
```

For a single file that needs to land at a specific target path (possibly
under a different name, like `.agents/AGENTS.md` -> `~/.claude/CLAUDE.md`),
add a line to `FILES` instead:

```
"label:source_file_relative_to_repo:absolute_target_file"
```

Then run `./install.sh` again — the new entry shows up in the selection
prompts automatically.

## Windows

Not automated yet. Native Windows symlinks need Developer Mode (or admin),
and git doesn't handle them consistently out of the box, so configs are
kept in sync manually there for now. A dedicated `install.ps1` may be
added later if that becomes worth automating.
