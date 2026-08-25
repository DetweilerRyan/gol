---
name: post-write-quality-hooks
title: Run format and lint per TypeScript write, and typecheck once per turn, via Claude Code hooks
created: 2026-08-25
---

## Context

Every role's workflow ends with the same manual step — `coder.md` step 8 and
`cleaner.md` step 6 both say "Run `npm run lint` then `npm run format`, in that
order, as the last two steps before committing." Both also run `npm run build`
separately to catch type errors, because (as `cleaner.md` step 5 puts it)
"Vitest doesn't type-check, so a mistyped mock/stub can pass every test while
`tsc -b` is red."

All three are mechanical, and a Claude Code **hook** is run by the harness
rather than by the role, so it holds whether or not the role remembers.

The naive shape — run all three after every write — is the wrong one, and the
numbers say why. Measured on this repo:

|                                      | via `npx` | direct binary |
| ------------------------------------ | --------- | ------------- |
| `tsc -b` (real rebuild, warm caches) | **2.9s**  | —             |
| `oxlint <file>`                      | 0.29s     | **0.04s**     |
| `prettier --check <file>`            | 0.52s     | **0.16s**     |

Two consequences. **`npx` costs 7x on oxlint alone**, so a hook should call
`./node_modules/.bin/<tool>` directly. And **`tsc` cannot be scoped to one
file**: with the four-project reference graph (`tsconfig.app`/`node`/`scripts`
under the solution config), typechecking is inherently whole-project, so a
per-write `tsc -b` repeats identical work. Ten writes in a turn costs ~31s
naively against ~5s split by cost.

Note the repo-scoped npm scripts are the wrong tool here for the same reason:
`npm run lint` is bare `oxlint` (whole repo) and `npm run format` is
`prettier --write .` (whole repo). A hook wants the single file.

## Sketch

Two hooks, split by what each check actually costs.

**1. `PostToolUse` on `Write|Edit` — format and lint, that file only (~0.2s).**
Exit fast for non-TypeScript paths so the hook is free on Markdown and JSON
writes. oxlint findings go to stderr, where the agent reads them.

**2. `Stop` — `tsc -b` once per turn (~2.9s), however many files changed.**
`npm run build` is `tsc -b && vite build`; only the first half belongs here.
The `tsBuildInfoFile` caches are already configured for all three projects,
which is why an incremental rebuild is 2.9s rather than a cold typecheck.

Both live in `.claude/settings.json` rather than a role's frontmatter: these
apply to any TypeScript write, by any role or by the main session, unlike a
role-specific boundary which must be scoped to the subagent that owns it.

## Touches

New `.claude/hooks/ts-touchup.sh` and `.claude/hooks/typecheck.sh`; a `hooks`
block in `.claude/settings.json`. Keep both scripts dependency-free POSIX `sh`
— `jq` is not a declared dependency of this repo.

If this lands, `coder.md` step 8 and `cleaner.md` step 6 become redundant, and
CLAUDE.md should say the checks are partly mechanical so a future reader does
not assume prose is the only enforcement. Editing those role files needs
explicit user direction under `workflow.md`'s role-boundary rule.

## Open questions

- **`prettier --write` in a `PostToolUse` hook desyncs the harness's file
  state.** The harness tracks what it believes a file contains; a hook
  rewriting it after a `Write` means the next `Edit` — which needs an exact
  string match — can fail until the agent re-reads. Recoverable but real. The
  alternative is `--check`, reporting the violation and letting the agent fix
  it, which trades that friction for noise. Undecided which is worse in
  practice.
- **Should the `Stop` typecheck block?** `exit 2` on `Stop` prevents the turn
  from ending, forcing a red `tsc` to be fixed before the agent can stop. That
  is the strong version and also the one that can wedge a turn when the error
  is not the agent's to fix. Starting non-blocking (exit 0, output on stderr)
  and tightening later is the cautious order.
- **Does this belong to every role, or only the implementing ones?** `product`
  writes step tests and the harness, so it benefits too. But a hook that fires
  during `product`'s acceptance spike — whose implementation is deliberately
  never committed — may be running checks on code that is about to be thrown
  away.
- **Interaction with `Stop` and subagents.** The hooks docs note a `Stop` hook
  declared in subagent frontmatter is converted to `SubagentStop`. A
  settings-level `Stop` hook and a per-slice subagent chain need checking
  against each other, or the typecheck may fire once per role rather than once
  per turn.
- **Is the per-write half worth it at all?** oxlint at 0.04s and prettier at
  0.16s are cheap, but the roles already run both before committing. The
  honest case is that a hook catches the write that never reaches a commit —
  worth confirming that actually happens rather than assuming it.
