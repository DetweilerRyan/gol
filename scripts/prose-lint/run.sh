#!/bin/sh
#
# Run Vale over every tracked file it is configured for, and FAIL LOUDLY when it
# cannot lint. It does not fail on a finding.
#
# That split is the whole point. `.vale.ini` is report-only and three of the six
# STE rules are prompts needing per-finding judgement, so a gate on findings would
# contradict the design. But a run that CANNOT lint reports zero and reads exactly
# like a clean pass -- prose-linting.md enumerates the ways that happens. This script
# closes the ones a command can close.
#
# Paths, never a filesystem walk: a bare `vale .` walks into every checkout under
# .claude/worktrees/ and every Stryker sandbox, reporting the same finding once
# per copy. The exemption sections in .vale.ini cover that too, belt and braces.
set -u

if ! command -v vale >/dev/null 2>&1; then
	echo "prose-lint: vale is not on PATH. See .claude/agents/articles/prose-linting.md, Setup." >&2
	echo "prose-lint: a machine without it lints nothing, which reads exactly like a clean run." >&2
	exit 1
fi

if ! vale ls-config >/dev/null 2>&1; then
	echo "prose-lint: vale cannot load .vale.ini. Run 'vale sync' -- .vale/ is gitignored," >&2
	echo "prose-lint: so a fresh worktree has none and the run aborts before reaching a rule." >&2
	vale ls-config 2>&1 | head -3 >&2
	exit 1
fi

files=$(git ls-files '*.md' '*.ts' '*.tsx' | grep -v '^src/catalyst/')
if [ -z "$files" ]; then
	echo "prose-lint: no tracked files matched. That is not a clean run, it is an empty one." >&2
	exit 1
fi

# `--no-exit` plus a status check is what splits "cannot lint" from "found
# something", and the split is measured rather than assumed. Against vale 3.20.0:
# a clean run and a warning-only run both exit 0; an error-severity alert exits 1,
# which `--no-exit` turns into 0; a runtime error exits 2, which `--no-exit` does
# NOT suppress. So with the flag on, any nonzero means vale could not lint.
#
# That is the case this script existed for and did not catch. Without the status
# check below, vale aborting the whole run on one unparseable file -- the failure
# .vale.ini's own agent-docs section documents -- printed its error to stderr and
# still reached the "measured zero" line with exit 0.
#
# The number the check reads is xargs' own, never vale's, and the two differ by
# platform: measured against macOS's BSD xargs, a command exit of 1-125 is
# reported as 1, where GNU xargs reports 123. So do not print it as vale's exit
# code and do not branch on its value -- only its nonzero-ness carries meaning,
# which is exactly what `--no-exit` leaves well defined. xargs may also split a
# long list across several vale invocations; it still reports nonzero if any one
# of them failed.
echo "$files" | xargs vale --no-exit --output=line
status=$?
if [ "$status" -ne 0 ]; then
	echo "prose-lint: vale could not lint (xargs status $status), so the output above is not a result." >&2
	echo "prose-lint: with --no-exit a finding cannot cause this. See prose-linting.md's confident-zero list." >&2
	exit 1
fi

echo "prose-lint: linted $(echo "$files" | wc -l | tr -d ' ') tracked file(s). A zero above is a measured zero."
