#!/usr/bin/env bash
#
# Apply the MyCloud / horizon-az patch series to a Horizon checkout.
#
#   ./apply.sh --check  /path/to/horizon    # dry run, changes nothing
#   ./apply.sh          /path/to/horizon    # apply
#   ./apply.sh --revert /path/to/horizon    # undo
#
# Skips patches that are already applied, and only falls back to a 3-way merge
# when a plain apply fails, so a partially-patched tree is safe to re-run.
# See README.md for what each patch contains.

set -uo pipefail

PATCH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="apply"
TARGET=""

# Horizon has paths over the Windows 260-char limit; git refuses to touch them
# without this. Harmless on Linux.
GIT="git -c core.longpaths=true"

RED=$'\033[31m'; GRN=$'\033[32m'; YEL=$'\033[33m'; BLD=$'\033[1m'; RST=$'\033[0m'
ok(){   printf "  ${GRN}OK${RST}    %s\n" "$*"; }
warn(){ printf "  ${YEL}SKIP${RST}  %s\n" "$*"; }
err(){  printf "  ${RED}FAIL${RST}  %s\n" "$*"; }
head_(){ printf "\n${BLD}%s${RST}\n" "$*"; }

usage(){ sed -n '3,12p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 1; }

for a in "$@"; do
  case "$a" in
    --check)  MODE="check"  ;;
    --revert) MODE="revert" ;;
    -h|--help) usage ;;
    -*) echo "unknown option: $a" >&2; usage ;;
    *)  TARGET="$a" ;;
  esac
done
[ -n "$TARGET" ] || usage

# ---------------------------------------------------------------- sanity
head_ "Target"
[ -d "$TARGET" ] || { err "not a directory: $TARGET"; exit 1; }
cd "$TARGET" || exit 1
TARGET="$(pwd)"

if [ ! -f openstack_dashboard/defaults.py ] || [ ! -d horizon ]; then
  err "$TARGET does not look like a Horizon checkout"
  err "(expected openstack_dashboard/defaults.py and horizon/)"
  exit 1
fi
$GIT rev-parse --git-dir >/dev/null 2>&1 || { err "not a git repo (needed for git apply)"; exit 1; }

VER="$(sed -n 's/^ *version *= *//p' setup.cfg 2>/dev/null | head -1)"
BR="$($GIT rev-parse --abbrev-ref HEAD 2>/dev/null)"
ok "$TARGET"
ok "horizon version=${VER:-unknown}  ref=${BR:-detached}"

if [ "$MODE" != "check" ] && ! $GIT diff --quiet HEAD 2>/dev/null; then
  warn "working tree has uncommitted changes - commit or stash first if you want a clean revert path"
fi

PATCHES=("$PATCH_DIR"/0*.patch)
[ -e "${PATCHES[0]}" ] || { err "no patches found in $PATCH_DIR"; exit 1; }

# ---------------------------------------------------------------- run
head_ "Patches ($MODE)"
applied=0; skipped=0; failed=0
FAILED_LIST=()

for p in "${PATCHES[@]}"; do
  name="$(basename "$p")"

  if [ "$MODE" = "revert" ]; then
    if $GIT apply --reverse --check "$p" 2>/dev/null; then
      $GIT apply --reverse "$p" && { ok "reverted  $name"; applied=$((applied+1)); } \
                                || { err "revert failed  $name"; failed=$((failed+1)); FAILED_LIST+=("$name"); }
    else
      warn "not applied, nothing to revert  $name"; skipped=$((skipped+1))
    fi
    continue
  fi

  # Already applied? A clean reverse-apply proves the content is in the tree.
  if $GIT apply --reverse --check "$p" 2>/dev/null; then
    warn "already applied  $name"; skipped=$((skipped+1)); continue
  fi

  if $GIT apply --check "$p" 2>/dev/null; then
    if [ "$MODE" = "check" ]; then
      ok "would apply cleanly  $name"; applied=$((applied+1))
    else
      $GIT apply "$p" && { ok "applied  $name"; applied=$((applied+1)); } \
                      || { err "apply failed  $name"; failed=$((failed+1)); FAILED_LIST+=("$name"); }
    fi
    continue
  fi

  # Plain apply won't go. Try a 3-way merge before giving up.
  if $GIT apply --3way --check "$p" 2>/dev/null; then
    if [ "$MODE" = "check" ]; then
      warn "needs 3-way merge  $name"; applied=$((applied+1))
    else
      $GIT apply --3way "$p" && { warn "applied via 3-way (check for <<<< markers)  $name"; applied=$((applied+1)); } \
                             || { err "3-way failed  $name"; failed=$((failed+1)); FAILED_LIST+=("$name"); }
    fi
    continue
  fi

  err "cannot apply  $name"
  failed=$((failed+1)); FAILED_LIST+=("$name")
  if [ "$MODE" = "apply" ]; then
    printf "        -> rejects: %s apply --reject %s\n" "git" "$p"
  fi
done

# ---------------------------------------------------------------- verify
if [ "$MODE" = "apply" ] && [ "$failed" -eq 0 ]; then
  head_ "Verify"
  vfail=0
  n=$(find openstack_dashboard/themes/mycloud -type f 2>/dev/null | wc -l | tr -d ' ')
  [ "$n" -ge 20 ] && ok "theme files present ($n)" || { err "theme files missing (found $n)"; vfail=1; }

  grep -q "'mycloud'" openstack_dashboard/defaults.py \
    && ok "mycloud registered in AVAILABLE_THEMES" \
    || { err "mycloud NOT registered in defaults.py"; vfail=1; }

  for f in openstack_dashboard/usage/az.py \
           openstack_dashboard/templatetags/mycloud_filters.py \
           openstack_dashboard/dashboards/project/volumes/views.py \
           openstack_dashboard/dashboards/project/overview/views.py \
           openstack_dashboard/defaults.py; do
    if [ -f "$f" ]; then
      python -m py_compile "$f" 2>/dev/null && ok "compiles  $f" || { err "SYNTAX ERROR  $f"; vfail=1; }
    else
      err "missing  $f"; vfail=1
    fi
  done

  # Conflict markers from a 3-way merge would silently poison the tree.
  if $GIT grep -qIl '^<<<<<<< ' -- . 2>/dev/null; then
    err "conflict markers left in tree:"
    $GIT grep -Il '^<<<<<<< ' -- . | sed 's/^/          /'
    vfail=1
  else
    ok "no conflict markers"
  fi
  [ "$vfail" -eq 0 ] || failed=$((failed+1))
fi

# ---------------------------------------------------------------- summary
head_ "Summary"
printf "  applied/ok: %d   skipped: %d   failed: %d\n" "$applied" "$skipped" "$failed"
if [ "$failed" -gt 0 ]; then
  for f in "${FAILED_LIST[@]}"; do err "$f"; done
  # Only nudge about 04 when 04 is actually the thing that failed - otherwise the
  # hint sends you chasing the wrong patch.
  if printf '%s\n' "${FAILED_LIST[@]:-}" | grep -q '^04-'; then
    echo
    echo "  Note: 04-fix-neutron-trunk-ports usually fails because this Horizon"
    echo "  ALREADY carries the upstream fix - that is fine, skip it."
  fi
  echo
  echo "  Inspect a conflict with:"
  echo "    cd $TARGET && git apply --reject $PATCH_DIR/<patch>   # then look at *.rej"
  exit 1
fi

if [ "$MODE" = "apply" ]; then
  cat <<'EOS'

  Next steps (the theme does NOT show up on its own):
    1. local_settings.py:  DEFAULT_THEME = 'mycloud'
                           COMPRESS_OFFLINE = False     # else the custom theme won't render
    2. python manage.py collectstatic --noinput
    3. docker restart horizon      # Django caches templates - restart is REQUIRED
EOS
fi
exit 0
