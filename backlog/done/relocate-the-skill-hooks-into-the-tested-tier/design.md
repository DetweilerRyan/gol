---
name: design
title: Design — relocate the skill hooks into the tested tier
created: 2026-09-18
---

# Design: relocate-the-skill-hooks-into-the-tested-tier

Architect DESIGN pass, 2026-09-18. Enabler-technical, so this pass is the slice's only
pre-implementation gate. The ruled Answer in `proposal.md` binds; this design executes its six
steps and settles the four questions it left open. No product code was written in this pass.

## Ruling 1 — the file set

| File                                      | Role                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| `scripts/post-tool-use.ts`                | Shared, pure: the PostToolUse wire contract (payload in, envelope out)   |
| `scripts/board-shape-hook/run.ts`         | I/O shell: stdin, argv, fs probes, channel writes, exit                  |
| `scripts/board-shape-hook/board-shape.ts` | Pure: everything from path to verdict — scope, identity, shape checks    |
| `scripts/prose-write-hook/run.ts`         | I/O shell: stdin, git spawn, PATH scan, vale spawn, channel writes, exit |
| `scripts/prose-write-hook/audit.ts`       | Pure: scope test, findings count, every message                          |

Plus one `.test.ts` per module, six test files. No npm script for either program — they are
invoked by `.claude/settings.json` and one `SKILL.md` injection line, under bare `node`, and
adding an npm entry would be a new config surface the proposal forbids.

- **`post-tool-use.ts` sits at `scripts/` root** because both programs extract
  `tool_input.file_path` from the same payload shape and build the same
  `hookSpecificOutput` envelope — the layout rule's "shared by two or more programs" test,
  and it is also what keeps `dry4ts:scripts` quiet about the duplication the two single
  files currently carry.
- Names follow the corpus vocabulary: `proposal.md` and the parked sibling both call
  `layer1.ts` "the board-shape hook", and `on-edit.ts` "the write-time Vale hook".
  `board-shape-hook`'s header notes that its argv mode is `idea-assess`'s Layer 1, so the
  `LAYER1` output prefix keeps its anchor.
- No `#!/usr/bin/env tsx` shebang on either `run.ts` — every other program in the tier
  carries one, but these two are the tier's first bare-`node` entry points and a tsx shebang
  would state the wrong runner. No shebang at all; the header states the runner contract.

## Ruling 2 — the seam the parked sibling edits (proposal open question 2)

**`the-board-hook-misfits-per-item-artifacts` edits `scripts/board-shape-hook/board-shape.ts`
and its test file, and nothing else.** The positional discriminator replaces `isBoardPath`,
the per-artifact shape table lands inside `checkShape`, and the identity rule generalises the
`proposal.md`-folder special case — all three are one decision ("what does this write owe"),
so they live in one module rather than across a classification/checks split whose boundary
would sit exactly where that slice's table goes. `run.ts` and `post-tool-use.ts` are wire
concerns (channels, envelope, exit-0) and stay untouched by the rewrite. Both of
`board-shape.ts`'s inputs are the path and the file text, and the sibling's discriminator is
path-positional, so the interface below survives the rewrite unchanged.

If the module grows past comfort after that rewrite, `cleaner` splits it then, with the tests
already in place — not now, ahead of the shape the table will actually take.

## Ruling 3 — the split at 91 lines (proposal open question 3)

**`on-edit.ts` gets the same `run.ts` split, and the asymmetry is module count, not whether
to split.** The forcing facts are size-independent: the file executes at import, so no test
can import it, and logic left in a `run.ts` is unmeasured (Ruling 4). What size does decide
is the pure side's shape — one module, `audit.ts`, not the three-or-four-module layout the
larger checkers use. `board-shape-hook` likewise gets exactly one pure module. CRAP ≤ 6
forces function-level decomposition _inside_ each pure module regardless (a function's CRAP
at full coverage equals its cyclomatic complexity, so no function may exceed CC 6 — the
current `run()`'s check chain must become small named functions), and that is structure, not
logic.

## Ruling 4 — a correction to the proposal's forcing mechanism

The proposal says "Stryker excludes `run.ts` and crap4ts does not". Measured against the
configs 2026-09-18: `crap4ts.scripts.config.ts` excludes `**/run.ts`, and `.dry4tsrc.json`
ignores it too, so **all three** tools skip a `run.ts`. The corrected forcing argument, and
it still forces the split both ways: an unsplit program named `run.ts` is invisible to
Stryker, crap4ts and dry4ts alike — wholly in the blind spot — and an unsplit program under
any other name is mutated by Stryker but executes at import, so no test can import it and
every mutant survives against the tier's break threshold. Read that threshold from
`stryker.scripts.config.json` (`break: 95` as of this pass — the strictest gate this slice
faces; the direct unit tests over the pure modules carry the whole kill load, because a
spawned-subprocess test runs outside Stryker's in-process mutant activation and can kill
nothing).

## Interfaces

```ts
// scripts/post-tool-use.ts — imports nothing
export type HookOutcome = { lines: string[]; deliver: boolean }
export const extractFilePath = (stdinText: string): string // '' on malformed/keyless payload
export const envelope = (lines: string[]): string // the hookSpecificOutput JSON; caller guards emptiness

// scripts/board-shape-hook/board-shape.ts — imports node:path only
export const isBoardPath = (path: string): boolean // hook-mode scope gate, runs before any fs read
export const resolveTarget = (target: string, exists: (p: string) => boolean): string // bare-slug, last hit wins
export const emptyPathOutcome = (): HookOutcome // 'extraction returned empty', deliver: true
export const missingOutcome = (target: string): HookOutcome // 'path missing or unreadable', deliver: true
export const checkShape = (target: string, text: string): HookOutcome // the six checks + report lines

// scripts/prose-write-hook/audit.ts — imports node:path only
export const repoRelative = (path: string, root: string): string
export const inScope = (rel: string): boolean // skills/ + references/ .md, minus .meta.md
export const valeCandidates = (pathEnv: string | undefined): string[] // join(dir, 'vale') per PATH entry
export const outcomeFor = (rel: string, valeOutput: string): HookOutcome // findings vs clean; clean delivers nothing
export const noRootOutcome = (path: string): HookOutcome
export const valeAbsentOutcome = (rel: string): HookOutcome
export const emptyPathOutcome = (): HookOutcome
```

Each `run.ts` owns channel discipline and nothing else: argv-mode dispatch, stdin via
`readFileSync(0)`, the `existsSync`/`readFileSync`/`accessSync`/spawn calls, every line of an
outcome written to stderr (hook mode) or stdout (argv mode) with `+ '\n'`, and
`envelope(lines)` to stdout only when `deliver && lines.length > 0`. That reproduces the
current byte streams exactly, including the prose hook's vale-text-then-summary stderr order
and the board hook's argv mode never delivering an envelope. Exit 0 on every path, as today.

## What the current shape hides and must survive the move (invoking question 4)

- **The measured delivery contract** (envelope-only delivery, measured 2026-09-16) is the
  wire contract and moves to `post-tool-use.ts` as `envelope`'s JSDoc — it is what a caller
  needs; today it is duplicated as `//` in both files.
- **The bare-node runner header** (zero-stderr contract, erasable-syntax constraint) stays
  atop each `run.ts`, since that is the file the hook command names. Joined by the
  worktree caveat line the proposal asked a home for: the project-directory variable stays at
  the session's starting root, so a hook run mid-`EnterWorktree` executes the main checkout's
  copy — moot under one-session-per-worktree. This settles proposal open question 4.
- **The load-bearing `//` blocks move with the code they explain**: the sed-equivalence
  comment with the frontmatter window, the last-hit-wins slug comment with `resolveTarget`,
  the lane-segment comment with the lane computation, the absolute-path Vale-section
  measurement with `repoRelative`, and the spawnSync-not-execFileSync rationale beside the
  spawn in `prose-write-hook/run.ts`.
- **Single-file-ness itself is not a constraint.** Measured 2026-09-18 on this machine's
  v24.19.0: bare `node` ran a two-file `.ts` split (explicit `.ts` import specifier, the
  tier's existing convention under `allowImportingTsExtensions`) with exit 0 and zero stderr
  bytes. Step 4 re-measures on the real programs.

## Ordering — six steps, each with its own check

No suite covers these files today, so "leaves the suite green" is replaced per step by the
named reading below. `coder` executes 1–5; step 6 waits on the grant ruling.

1. **Land the five modules as a split of copies.** Old files untouched; hooks still point at
   the old paths, so nothing user-facing moves. Check: `npm run build` (first compiler
   contact — `erasableSyntaxOnly`, `verbatimModuleSyntax` and the `.ts`-extension imports all
   verified here), `npm run lint`, and a **byte-differential run**: a throwaway scratchpad
   harness feeds the input matrix below to old file and new program, both under bare `node`
   from the repo root, and diffs stdout, stderr and exit code. Byte-identical or the step is
   not done. Record the matrix and result in the handoff.
   - Board hook, argv mode: clean idea file; a fixture tripping all six findings; a
     legacy-era file (no `## Situation`, exercising `## Touches`); bare slug resolving in
     `ideas/`; bare slug in `ready/`; a slug present in both (last hit wins → ready); missing
     path; empty argv.
   - Board hook, `--hook`: in-scope clean; in-scope with findings; out-of-scope path;
     absolute path containing `/backlog/`; malformed JSON; payload without `file_path`.
   - Prose hook: in-scope `.md` with findings; in-scope clean; `.meta.md` (silent);
     out-of-scope (silent); malformed JSON; a path outside any git repo (NOT RUN); vale
     absent via a stripped `PATH` (NOT RUN).
2. **Add the six test files.** Direct-import unit tests over the three pure modules carry
   the mutation load; each `run.test.ts` spawns bare `node` on its program to pin the shell
   contract (mode dispatch, envelope on stdout, log on stderr, exit 0 always, and the
   zero-byte silence of the out-of-scope paths) — the differential matrix made durable.
   Check by name: `npx vitest list --config vitest.scripts.config.ts` names all six new
   files (command verified 2026-09-18); then `npm run test:scripts` green.
3. **Read each gate's own file list — never its green.** `npm run test:coverage:scripts`
   then `npm run crap4ts:scripts`: the three pure modules appear with a nonzero function
   count each, both `run.ts` files absent. Stryker, scoped so the report names files:
   `npx stryker run stryker.scripts.config.json --mutate 'scripts/board-shape-hook/*.ts' --mutate 'scripts/prose-write-hook/*.ts' --mutate 'scripts/post-tool-use.ts'`
   — per-file mutant tallies nonzero for the three pure modules, `run.ts` absent, score
   against the config's break threshold. `npm run dry4ts:scripts` exit 0. `npm run ast-grep`
   read. (`--dryRunOnly` exists but reports no per-file tally; the scoped real run is the
   reading. The full `npm run test:mutation:scripts` stays `hardener`'s stage.)
4. **The zero-stderr measurement the spike left unrun.** For each program: the out-of-scope
   hook payload piped to `node <run.ts> [--hook]`, using the `node` the hooks actually
   resolve (`command -v node`, record path and `node --version`), asserting **0 bytes** on
   stderr and stdout and exit 0. That run is the spike's probe 2, performed for real; the
   spawn tests from step 2 keep re-measuring it every `test:scripts` run thereafter.
5. **The five granted `.claude/` edits, one commit, nothing else in it.** Per the user's
   2026-09-18 ruling, `coder` writes, by name:
   - `.claude/settings.json`, four command strings:
     `node "$CLAUDE_PROJECT_DIR/scripts/board-shape-hook/run.ts" --hook` (×2, Write/Edit on
     `backlog/**`) and `node "$CLAUDE_PROJECT_DIR/scripts/prose-write-hook/run.ts"` (×2,
     Write/Edit on `.claude/**`). Timeouts, statusMessages and `if:` scopes unchanged.
   - `.claude/skills/idea-assess/SKILL.md` line 18:
     `` !`node "${CLAUDE_PROJECT_DIR}/scripts/board-shape-hook/run.ts" $target` `` — note
     the variable changes from the skill-dir form to the project-dir form the spike
     sanctioned (floor v2.1.196, installed 2.1.236).
     Check: grep both files for the old paths → zero hits; execute each new command string by
     hand with the project-dir variable set to the worktree root and a sample stdin/argv →
     expected output; `npm run agent-doc-check` (a `.claude/**` surface moved).
6. **Delete the two old files** (their `scripts/` dirs empty with them). Ordered last: the
   differential harness needs both copies, and a reference must never outlive its target.
   Check: `npm run reference-check` green, and a tree grep for `layer1.ts` / `on-edit.ts` —
   measured 2026-09-18, the only live mentions outside `backlog/` are the two files step 5
   edits, so post-deletion the expected count outside `backlog/` is zero.
   **Blocked on a grant ruling** — see below.

## What the seat or the user must settle

1. **The deletion in step 6 is not covered by the five-edit grant.** The grant covers four
   command strings and one injection line, and "nothing else under `.claude/`". Either the
   user extends it by two named deletions — `.claude/skills/idea-assess/scripts/layer1.ts`
   and `.claude/skills/prose-audit/scripts/on-edit.ts` — or the seat performs the deletion
   itself. Recommend extending the grant: the deletion is the same relocation, and splitting
   authorship across a two-line rm helps no audit.
2. **Live-fire check after step 5 is the seat's**: settings edits bind new sessions, so in a
   fresh session confirm one `backlog/**` write and one `.claude/**` write each show their
   statusMessage and behave. No role can restart a session to observe this.
3. **Staleness to report at merge** (seat edits, with approval): CLAUDE.md's "Ten programs,
   and only the five below gate" and "All ten run via tsx" — twelve directories after this
   slice, and the two hook programs run via bare `node` with no npm script;
   `quality-tooling.md`'s advisory-program roster does not cover them (they are neither
   gating nor advisory CLI — they are hooks) and wants one routing sentence.

## Mechanical guard candidates — named, not authored (this pass writes no rule)

- **`no-process-io-outside-run-in-hook-programs`**: within the two new program directories,
  no file but `run.ts` touches `process`, `node:child_process` or `node:fs`. The seam in
  Ruling 2 depends on it. Before authoring at REVIEW, measure whether the invariant can be
  stated tier-wide without firing on existing pure modules; scope to the two directories if
  not.
- **Not this slice, a board idea**: nothing checks that a `.claude/settings.json` hook
  command names a file that exists — `reference-check` reads comments and `.md` lines, not
  JSON strings, so a future rename of `scripts/board-shape-hook/` breaks the hook silently.
  Same confident-zero class this slice closes.
