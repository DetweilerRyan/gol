# Spike report: spike-where-a-skill-script-can-live-and-be-tested

**Ruling: yes — a skill's script may live outside its skill directory. The skill system
resolves nothing by location. Both invocation surfaces are plain text substitution, so the
two encoded references are the entire coupling, and relocation is a two-file reference edit.
Option A follows: relocate both programs under `scripts/`, where every gate in the tested
tier picks them up by glob with zero config edits.**

Answered by `architect` on 2026-09-18. The proposal's falsifier fired on probe 1: the skill
system's own documentation answers the out-of-directory question outright, so this closed as
a reading task, and probes 2 to 4 were not run. What each would have measured is recorded
under "Not measured" rather than inferred. The harness refused the subagent's file write, so
the orchestrating seat recorded this text.

One access note: the invoking prompt offered the `claude-code-guide` agent for this class of
question, but that invocation carried no Agent tool, so it could not be consulted. The
published Claude Code documentation was read directly instead — the skills and hooks pages,
fetched 2026-09-18, checked against the installed Claude Code 2.1.236 where a claim was
locally checkable.

## Probe 1 — the documentation answers it outright (the falsifier)

Three documented facts, each read 2026-09-18:

1. **The skills doc's substitution table sanctions the out-of-directory reference by name.**
   `${CLAUDE_PROJECT_DIR}` is substituted in a skill's markdown content, and its documented
   purpose is to reference project-local scripts or files independent of where the skill is
   installed. The doc's own example is a script in no skill directory. The substitution
   carries a version floor of Claude Code v2.1.196; the installed version is 2.1.236,
   measured 2026-09-18, so the floor is cleared here.
2. **The hooks system has no skill-awareness at all.** A hook's command is an arbitrary
   command string with `${CLAUDE_PROJECT_DIR}` substituted, and the hooks doc's canonical
   project example runs a script outside any skill directory. Both of this repo's hook
   programs are wired in `.claude/settings.json`, not in skill frontmatter, so they were
   never coupled to a skill directory by the system — only by the path string someone wrote.
3. **Packaging is permissive, not required.** The supporting-files section says skills can
   include multiple files in their directory, and `${CLAUDE_SKILL_DIR}` is described as a
   convenience for bundled scripts regardless of the current working directory — a
   portability convention for skills that get distributed, not a resolution mechanism. These
   skills are repo-local and never distributed, so the convention buys nothing here.

So the answer to open question 1 is: **only the encoded references matter.** As of
2026-09-18 those are the four hook entries in `.claude/settings.json`, two per program for
Write and Edit, plus one dynamic-injection line in `.claude/skills/idea-assess/SKILL.md`. A
grep of `prose-audit`'s own skill file the same day found no script reference at all, so
`on-edit.ts`'s only encoded path is the settings file.

**One discovered caveat, location-neutral so it does not move the ruling.** Per the hooks
doc, when Claude enters a worktree mid-session `${CLAUDE_PROJECT_DIR}` stays at the project
root where the session started, so a hook runs the main checkout's copy of its script. That
is equally true of the current skills path and of any `scripts/` path. It is moot under this
repo's one-session-per-worktree convention and live only for `EnterWorktree` flows — worth a
line in whatever documents the relocated hooks.

## Readings that price the options

Reading facts, not probes — each is one config file's own text, read 2026-09-18:

- `tsconfig.json` references `tsconfig.scripts.json`, so `tsc -b`, the first half of
  `npm run build`, type-checks everything that file includes — which is all of `scripts/`.
- **`tsconfig.scripts.json` sets `erasableSyntaxOnly`.** The tested tier already enforces,
  mechanically and tier-wide, the exact syntax half of the bare-node runner contract that
  both program headers state by hand. Relocation does not cost that contract; it gains a
  compiler guarantee for it.
- `vitest.scripts.config.ts` collects the tier's test files, `stryker.scripts.config.json`
  mutates the tier minus its test files, `run.ts` and `test-support.ts`, and
  `crap4ts.scripts.config.ts` includes the tier. All glob-based — a new program is covered
  the day it lands, with no config edit.
- **The proposal's claim that Option A costs the bare-node runner contract does not survive
  these readings.** The hook command names `node` explicitly and keeps naming it at any
  path. That `scripts/` is tsx-based is a fact about how npm scripts invoke the ten existing
  programs, not a constraint on what may live there or on how a hook invokes it.

## Which option follows

**Option A — relocate under `scripts/`.** The only argument for Option B was that the skill
system might require in-directory packaging, and probe 1 removed it. What remains is
lopsided:

- **Option A** — two reference edits, and the whole battery arrives by existing glob:
  `tsc -b`, vitest, coverage, crap4ts at threshold 6, dry4ts, Stryker, and
  `reference-check`'s source surface.
- **Option B** — keeps the paths, but buys only vitest plus a tsconfig include. Parity with
  the tested tier would additionally need crap4ts, dry4ts, Stryker and reference-check scope
  extensions into the skills directory: four-plus config surfaces to reach what Option A
  gets free, plus an unmeasured answer to what else those scopes pull in. Not chosen, and
  its probe was accordingly not run.

## Open question 4 — the harder case

`layer1.ts` is the harder case, and one answer covers both. Both programs relocate the same
way under the same ruling. `layer1.ts` simply carries one more encoded reference, the skill
file's injection line with its substitution floor, plus that file's contract that Layer 1's
output precedes the skill text. `on-edit.ts` is settings-only.

## The enabler-technical candidate, stated rather than filed

Working name `relocate-the-skill-hooks-into-the-tested-tier`, kind `enabler-technical`. It
runs no `product`, its `architect` DESIGN pass is required by the pipelines reference, and
this shape crosses the design triggers anyway — new modules, a config surface, a role-owned
boundary.

1. Move each program into its own directory under `scripts/`, split as the tier's layout
   already demands: a `run.ts` shell holding stdin, stdout, argv and exit, delegating to
   pure modules beside it. The split is forced by the tier's own scoping, since Stryker
   excludes `run.ts` and crap4ts does not, so an unsplit single file would sit in the gates'
   blind spot — and by testability, since both current files execute at import.
2. Behaviour-preserving throughout: same stdin contract, same envelope delivery, same exit-0
   discipline, byte-identical output on the same inputs. The split is structure, not logic.
   **The boundary with `the-board-hook-misfits-per-item-artifacts`, which owns `layer1.ts`'s
   logic, is a sequencing judgement for the seat and the user.**
3. Update the four hook commands and the skill file's injection line to the new paths,
   keeping bare `node` as the runner.
4. Re-measure the runner's zero-stderr property at execution — probe 2's measurement, unrun
   here — on the node the hooks will actually use. That is v24.19.0 here, the exact version
   both headers already name as measured-clean.
5. Add the programs' test files and run the scripts-tier battery. Expect zero config edits,
   since the globs above are the measured basis, and verify rather than assume.
6. Constraint to carry: the hook entry files and everything they import must stay
   erasable-syntax, which the tier's tsconfig now enforces. Both programs import only node
   builtins as of 2026-09-18, so the constraint binds future imports rather than the move.

## Not measured, stated rather than inferred

- **Probe 2's stderr-byte comparison** under bare `node` against `tsx`, both programs — not
  run, per the falsifier's close-without-probing clause. `on-edit.ts`'s header states the
  identical bare-node constraint verbatim as a measured property; that is a reading of its
  header, not a re-measurement. Step 4 above carries the measurement.
- **Probe 3's scoped-project listing** — not run, since Option B was not chosen. If the user
  overrules toward Option B, that probe revives unrun and its question, what else a skills
  scope collects, is open.
- **Runtime hook behaviour after relocation** — nothing was relocated, so nothing was
  observed running from the new path. The documentation's substitution claims were checked
  against the installed version number only, not exercised.
- The claim that the scripts-tier globs need no edits is read from the four config files
  named above, not demonstrated by landing a file. Step 5 verifies it.

## Consequence for the parent

The proposal records that this spike moves none of
`the-board-hook-misfits-per-item-artifacts`'s letters, and it does not. What it does is
remove the objection to signing that slice's spec. The objection was that untested logic
should not be changed before it can be tested; this spike establishes a sanctioned,
near-zero-config path to testedness — conditional on the enabler landing before the parent
touches `layer1.ts`'s logic. Sequencing those two, and ruling where the structure-versus-logic
boundary sits between them, stays with the seat and the user.
