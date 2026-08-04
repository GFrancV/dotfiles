#!/usr/bin/env bash
#
# Selective dotfiles installer for Linux. Windows stays manual for now
# (see README).
#
# Usage:
#   ./install.sh            interactive install (default)
#   ./install.sh check      scan managed targets for broken symlinks
set -euo pipefail
shopt -s nullglob

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Each entry: "label:source_path_relative_to_repo:absolute_target_dir"
MODULES=(
  "agents (Claude Code skills):.agents/skills:$HOME/.claude/skills"
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

install_module() {
  local label="$1" src_dir="$2" target_dir="$3"
  [ -d "$src_dir" ] || return

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
      link_item "$item_path" "$target_dir/$item_name"
    else
      echo "  skipped: $item_name"
    fi
  done
  echo
}

check_module() {
  local label="$1" target_dir="$2"
  [ -d "$target_dir" ] || return

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
  local module label src_rel target_dir
  for module in "${MODULES[@]}"; do
    IFS=':' read -r label src_rel target_dir <<< "$module"
    install_module "$label" "$REPO_ROOT/$src_rel" "$target_dir"
  done
}

run_check() {
  local module label src_rel target_dir
  for module in "${MODULES[@]}"; do
    IFS=':' read -r label src_rel target_dir <<< "$module"
    check_module "$label" "$target_dir"
  done
}

case "${1:-install}" in
  install)
    run_install
    ;;
  check)
    run_check
    ;;
  *)
    echo "Usage: $0 [install|check]" >&2
    exit 1
    ;;
esac
