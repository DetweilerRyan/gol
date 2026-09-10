#!/bin/sh
#
# Run Vale over every tracked file it is configured for, and FAIL LOUDLY when it
# cannot lint. It does not fail on a finding.
#
# That split is the whole point. `.vale.ini` is report-only and three of the six
# STE rules are prompts needing per-finding judgement, so a gate on findings would
# contradict the design. But a run that CANNOT lint reports zero and reads exactly
# like a clean pass -- prose-linting.md lists eight ways that happens. This script
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

echo "$files" | xargs vale --output=line
echo "prose-lint: linted $(echo "$files" | wc -l | tr -d ' ') tracked file(s). A zero above is a measured zero."
