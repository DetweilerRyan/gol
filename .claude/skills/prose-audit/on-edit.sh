#!/bin/sh
# The write-time prose loop for the zero-baseline instruction surfaces: run Vale on the
# edited file and, on findings, name /prose-audit as the fix procedure. Always exits 0 --
# PostToolUse cannot block, and the surfaces stay advisory. An absent vale binary is
# reported loudly as NOT RUN, never read as clean, on prose-lint's probe discipline.
# Scope is skills/ and references/ only; articles and CLAUDE.md wait on their backlog triage.
# Vale matches .vale.ini section globs against the path AS GIVEN, and the harness hands this
# hook absolute paths -- measured: absolute matches no section and reads clean -- so the
# path is made repo-relative before Vale ever sees it.
path=$(sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
[ -n "$path" ] || { echo "PROSEHOOK (no path): extraction returned empty" >&2; exit 0; }
root=$(git -C "$(dirname "$path")" rev-parse --show-toplevel 2>/dev/null)
[ -n "$root" ] || { echo "PROSEHOOK $path: no repo root found -- NOT RUN" >&2; exit 0; }
rel=${path#"$root"/}
case "$rel" in
  .claude/skills/*.md|.claude/references/*.md) ;;
  *) exit 0 ;;
esac
case "$rel" in *.meta.md) exit 0 ;; esac
command -v vale >/dev/null 2>&1 || { echo "PROSEHOOK $rel: vale absent -- NOT RUN" >&2; exit 0; }
out=$(cd "$root" && vale --output=line "$rel" 2>&1)
n=$(printf '%s' "$out" | grep -c ':')
if [ "$n" -gt 0 ]; then
  { printf '%s\n' "$out"; echo "PROSEHOOK $rel: $n finding(s) -- run /prose-audit on this file, and fix before landing"; } >&2
else
  echo "PROSEHOOK $rel: 0 findings" >&2
fi
exit 0
