#!/bin/sh
# Layer 1 of backlog-readiness.md: deterministic facts, never a judgment. Always
# exits 0 -- the board has no gate. --hook reads the PostToolUse JSON on stdin;
# the sed extraction breaks on an escaped quote in a path, and an empty result
# is reported as a finding rather than read as nothing-to-check.
if [ "$1" = "--hook" ]; then
  exec 1>&2
  path=$(sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
  [ -n "$path" ] || { echo "LAYER1 (no path): 0 checks, 1 findings -- extraction returned empty"; exit 0; }
  case "$path" in */ideas/*|ideas/*) ;; *) exit 0 ;; esac
else
  path=$1
fi
[ -n "$path" ] && [ -f "$path" ] || { echo "LAYER1 ${path:-(no path)}: 0 checks, 1 findings -- path missing or unreadable"; exit 0; }
base=$(basename "$path" .md); f=0
fm=$(sed -n '2,/^---$/p' "$path")
echo "$fm" | grep -q "^name: $base\$" || { echo "name: does not match basename '$base'"; f=$((f+1)); }
echo "$fm" | grep -q '^title: ..*' || { echo "title: missing or empty"; f=$((f+1)); }
echo "$fm" | grep -Eq '^created: [0-9]{4}-[0-9]{2}-[0-9]{2}$' || { echo "created: not a YYYY-MM-DD date"; f=$((f+1)); }
echo "$fm" | grep -q '^status:' && { echo "status: present -- the directory is the status"; f=$((f+1)); }
if grep -q '^## Situation$' "$path"; then era=scqa; s1='## Question'; else era=legacy; s1='## Touches'; fi
for h in "$s1" '## Open questions'; do
  grep -q "^$h\$" "$path" || { echo "section missing: $h"; f=$((f+1)); }
done
echo "lane $(basename "$(dirname "$path")"), $era shape, $(wc -l < "$path" | tr -d ' ') lines, $(grep -ci 'depends on' "$path") depends-on mention(s)"
echo "LAYER1 $path: 6 checks, $f findings"
exit 0
