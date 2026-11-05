#!/usr/bin/env bash
#
# Selective dotfiles installer for Linux. Windows stays manual for now
# (see README).
#
# Usage:
#   ./install.sh               interactive install, synced mode (symlinks)
#   ./install.sh --copy        interactive install, fixed mode (copies files)
#   ./install.sh update        refresh copied (fixed) installs from the repo
#   ./install.sh check         scan managed targets for broken symlinks
set -euo pipefail
shopt -s nullglob

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Each entry: "label:source_path_relative_to_repo:absolute_target_dir"
MODULES=(
  "agents (Claude Code skills):.agents/skills:$HOME/.claude/skills"
)

# Single-file symlinks: "label:source_file_relative_to_repo:absolute_target_file"
# Unlike MODULES (whose items are subfolders linked 1:1 by name into a target
# dir), each entry here links one specific source file to one specific target
# path, which can have a different name than the source.
FILES=(
  "global agent rules -> Codex CLI:.agents/AGENTS.md:$HOME/.codex/AGENTS.md"
  "global agent rules -> Claude Code:.agents/AGENTS.md:$HOME/.claude/CLAUDE.md"
  "Neovim (LazyVim) config, whole folder:nvim:$HOME/.config/nvim"
  "lazygit config:lazygit/config.yml:$HOME/.config/lazygit/config.yml"
)

link_item() {
  local src="$1" target="$2"

  if [ -L "$target" ]; then
    # readlink -f resolves relative/broken symlinks without requiring the target to exist
    if [ "$(readlink -f "$target")" = "$(readlink -f "$src")" ]; then
      echo "  already installed: $target"
      return
    fi
    echo "  existing symlink points elsewhere, replacing: $target"
    rm "$target"
  elif [ -e "$target" ]; then
    local bak="${target}.bak"
    if [ -e "$bak" ]; then
      echo "  WARNING: a backup already exists at $bak, overwriting it"
      rm -rf "$bak"
    fi
    mv "$target" "$bak"
    echo "  backup created: $bak"
  fi

  ln -s "$src" "$target"
  echo "  installed: $target -> $src"
}

# Fixed install: copy instead of symlink. Edits at the destination are NOT
# reflected in the repo; use `./install.sh update` to pull repo changes in.
copy_item() {
  local src="$1" target="$2"

  # Never copy "through" a symlink: it would overwrite the repo file itself.
  [ -L "$target" ] && rm "$target"
  if [ -e "$target" ]; then
    local bak="${target}.bak"
    if [ -e "$bak" ]; then
      echo "  WARNING: a backup already exists at $bak, overwriting it"
      rm -rf "$bak"
    fi
    mv "$target" "$bak"
    echo "  backup created: $bak"
  fi

  cp -r "$src" "$target"
  echo "  copied: $src -> $target"
}

place_item() {
  if [ "$MODE" = "copy" ]; then copy_item "$@"; else link_item "$@"; fi
}

install_module() {
  local label="$1" src_dir="$2" target_dir="$3"
  [ -d "$src_dir" ] || return 0

  echo "== $label =="
  local items=("$src_dir"/*/)
  if [ ${#items[@]} -eq 0 ]; then
    echo "  (no items)"
    echo
    return
  fi

  mkdir -p "$target_dir"
  local item_path item_name ans
  for item_path in "${items[@]}"; do
    item_path="${item_path%/}"
    item_name="$(basename "$item_path")"
    read -rp "Install '$item_name'? [y/N] " ans || ans="n"
    if [[ "$ans" =~ ^[Yy]$ ]]; then
      place_item "$item_path" "$target_dir/$item_name"
    else
      echo "  skipped: $item_name"
    fi
  done
  echo
}

install_file() {
  local label="$1" src="$2" target="$3"
  [ -e "$src" ] || return 0 # file or folder

  echo "== $label =="
  mkdir -p "$(dirname "$target")"
  local ans
  read -rp "Install '$(basename "$target")' -> $target? [y/N] " ans || ans="n"
  if [[ "$ans" =~ ^[Yy]$ ]]; then
    place_item "$src" "$target"
  else
    echo "  skipped: $target"
  fi
  echo
}

check_file() {
  local label="$1" target="$2"
  [ -L "$target" ] || return 0

  echo "== $label =="
  if [ -e "$target" ]; then
    echo "  ok: $target"
  else
    echo "  broken symlink: $target -> $(readlink "$target")"
    local ans
    read -rp "  remove it? [y/N] " ans || ans="n"
    if [[ "$ans" =~ ^[Yy]$ ]]; then
      rm "$target"
      echo "  removed: $target"
    fi
  fi
  echo
}

check_module() {
  local label="$1" target_dir="$2"
  [ -d "$target_dir" ] || return 0

  echo "== $label =="
  local entries=("$target_dir"/*)
  if [ ${#entries[@]} -eq 0 ]; then
    echo "  (no items)"
    echo
    return
  fi

  local entry ans found_broken=0
  for entry in "${entries[@]}"; do
    [ -L "$entry" ] || continue
    [ -e "$entry" ] && continue # symlink resolves fine

    found_broken=1
    echo "  broken symlink: $entry -> $(readlink "$entry")"
    read -rp "  remove it? [y/N] " ans || ans="n"
    if [[ "$ans" =~ ^[Yy]$ ]]; then
      rm "$entry"
      echo "  removed: $entry"
    fi
  done
  [ "$found_broken" -eq 1 ] || echo "  no broken symlinks"
  echo
}

run_install() {
  local module label src_rel target_dir target_file
  for module in "${MODULES[@]}"; do
    IFS=':' read -r label src_rel target_dir <<< "$module"
    install_module "$label" "$REPO_ROOT/$src_rel" "$target_dir"
  done
  for module in "${FILES[@]}"; do
    IFS=':' read -r label src_rel target_file <<< "$module"
    install_file "$label" "$REPO_ROOT/$src_rel" "$target_file"
  done
}

# Refresh one fixed (copied) install. Symlinks (synced) and missing targets are
# skipped; only differing copies are offered for overwrite.
update_item() {
  local src="$1" target="$2" ans
  [ -L "$target" ] && { echo "  synced (symlink), nothing to do: $target"; return; }
  [ -e "$target" ] || return 0
  if diff -rq "$src" "$target" > /dev/null; then
    echo "  up to date: $target"
    return
  fi
  echo "  differs: $target"
  diff -rq "$src" "$target" | sed 's/^/    /' || true
  read -rp "  overwrite from repo? (merges; files only in target are kept) [y/N] " ans || ans="n"
  if [[ "$ans" =~ ^[Yy]$ ]]; then
    if [ -d "$src" ]; then cp -r "$src/." "$target/"; else cp "$src" "$target"; fi
    echo "  updated: $target"
  else
    echo "  skipped: $target"
  fi
}

run_update() {
  local module label src_rel target_dir target_file item
  for module in "${MODULES[@]}"; do
    IFS=':' read -r label src_rel target_dir <<< "$module"
    echo "== $label =="
    for item in "$REPO_ROOT/$src_rel"/*/; do
      item="${item%/}"
      update_item "$item" "$target_dir/$(basename "$item")"
    done
    echo
  done
  for module in "${FILES[@]}"; do
    IFS=':' read -r label src_rel target_file <<< "$module"
    echo "== $label =="
    update_item "$REPO_ROOT/$src_rel" "$target_file"
    echo
  done
}

run_check() {
  local module label src_rel target_dir target_file
  for module in "${MODULES[@]}"; do
    IFS=':' read -r label src_rel target_dir <<< "$module"
    check_module "$label" "$target_dir"
  done
  for module in "${FILES[@]}"; do
    IFS=':' read -r label src_rel target_file <<< "$module"
    check_file "$label" "$target_file"
  done
}

MODE=link
CMD=install
for arg in "$@"; do
  case "$arg" in
    --copy) MODE=copy ;;
    install|update|check) CMD="$arg" ;;
    *)
      echo "Usage: $0 [install|update|check] [--copy]" >&2
      exit 1
      ;;
  esac
done

case "$CMD" in
  install) run_install ;;
  update) run_update ;;
  check) run_check ;;
esac
