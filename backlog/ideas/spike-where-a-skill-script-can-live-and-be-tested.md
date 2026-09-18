---
name: spike-where-a-skill-script-can-live-and-be-tested
title: Learn whether a skill's script may live outside its skill directory
created: 2026-09-18
kind: spike
---

Recommended by `coach` SPEC on `the-board-hook-misfits-per-item-artifacts`, 2026-09-18. The
user ruled the same day that this spike runs **before** that slice, and before the
`enabler-technical` it feeds.

## Situation

Two programs live under `.claude/skills/*/scripts/`, measured 2026-09-18:

| Program                                         | Lines | Role                     |
| ----------------------------------------------- | ----- | ------------------------ |
| `.claude/skills/idea-assess/scripts/layer1.ts`  | 117   | the board-shape hook     |
| `.claude/skills/prose-audit/scripts/on-edit.ts` | 91    | the write-time Vale hook |

Both are TypeScript. Both are invoked by `.claude/settings.json` as
`node "$CLAUDE_PROJECT_DIR/.claude/skills/<skill>/scripts/<file>.ts"`, and
`.claude/skills/idea-assess/SKILL.md` also names its script through `CLAUDE_SKILL_DIR`. So
two separate surfaces encode the current path.

`coach` measured what reaches `layer1.ts`. **Not reached by** `tsc -b`, any vitest, Stryker,
crap4ts or dry4ts config, `reference-check`'s source surface, or `agent-doc-check`. **Reached
by** oxlint, Prettier and `prose-lint` — the oxlint delta is the proof: a bare run covers 365
files, and 363 with `--ignore-pattern '.claude/**'`.

## Complication

Neither program has a test file. Together they are 208 lines of logic that fire on every
write to `backlog/**` and `.claude/**`, and no gate can tell when one breaks. The repo has
already ruled once against this shape: `slice/prose-lint-runner-is-shell-not-typescript`
moved a runner into the tested tier for the same reason, and `effective-prose` lists that as
foundational because the runner "carries 0 test files where the other eight programs carry 1
to 13".

The obvious remedy is not obviously available. `scripts/` is the tested tier, but a skill is
supposed to package its own supporting files, and `layer1.ts`'s own header rules its runner
deliberately: "Runner: bare node. Requires a node whose flag-free `.ts` run writes zero
stderr bytes." `scripts/` is `tsx`-based, so a relocation changes that contract as well as
the path.

Nothing in the corpus or the tooling's own documentation settles whether a skill's script
may live outside its skill directory. That is the unknown, and it is why this is a spike
rather than the `enabler-technical` it feeds.

**The falsifier, so the spike can end early rather than run out of momentum: if the skill
system's own documentation answers the out-of-directory question outright, this is a reading
task and not a spike.** Record the answer, shape the `enabler-technical`, and close without
probing. The first probe below is ordered first for that reason.

## Question

May a skill's script live outside its skill directory — and if not, what brings these two
programs into a tested scope where they are?

## Answer

The two options `coach` named, neither yet chosen:

- **Relocate under `scripts/`.** Inherits vitest, crap4ts, dry4ts, mutation and the CRAP
  threshold for free. Costs the skill-packaging property and the bare-node runner contract,
  and both encoded paths change.
- **Add a scoped vitest project plus a tsconfig include** that reaches
  `.claude/skills/*/scripts/`. Keeps both programs where they are and both contracts intact.
  Costs a new project in the vitest config and an answer to what else that scope pulls in.

## No-gos

- The spike authors no relocation and no config change. Its output is a recorded answer in
  `findings.md`, and an `enabler-technical` candidate shaped by that answer.
- No edit to either program's logic. `the-board-hook-misfits-per-item-artifacts` owns
  `layer1.ts`'s logic and is parked behind this spike.

## Open questions

Each carries the probe that answers it, ordered. The first can close the spike on its own.

1. **Does the skill system resolve a script path relative to the skill, or only through the
   two encoded references?** Probe: read the skill system's own documentation first, since
   that is the falsifier above. If it is silent, inspect how the hook resolves its path at
   invocation — the hook receives a payload on stdin and `layer1.ts` already reads a
   `file_path` from it, so the resolution is observable. If only the encoded references
   matter, relocation is a two-file edit rather than a contract change.
2. **Does `on-edit.ts` share `layer1.ts`'s bare-node constraint, or was that written for one
   program?** Probe: read `on-edit.ts`'s header, then run each program under bare `node` and
   under `tsx`, and compare stderr bytes. `layer1.ts`'s header states the constraint as a
   measured property, so the same measurement settles it for its sibling.
3. **Does a scoped vitest project pull in anything else under `.claude/**` that should not
   be collected?** Probe: add the project to a scratch config and run `npx vitest list`
   against it. The list is the answer; do not infer it from the glob.
4. **Which of the two programs is the harder case, and does one answer cover both?** Falls
   out of 1 to 3 rather than needing its own probe. Report it rather than deriving it twice.

**Take no reading through a pipe**, and read the file count on any Vale run — the two
confident-zero forms this corpus has already recorded.

## Exit

The recorded answer in `findings.md`: whether a skill script may live outside its skill
directory, which option follows, and the `enabler-technical` shaped for it.

**Parent, and the letters it moves:** `the-board-hook-misfits-per-item-artifacts`, which the
user parked behind this spike on 2026-09-18 with `coach`'s spec written and unsigned. The
spike does not move that item's letters — it removes the objection to signing its spec, which
was that untested logic should not be changed before it can be tested.
