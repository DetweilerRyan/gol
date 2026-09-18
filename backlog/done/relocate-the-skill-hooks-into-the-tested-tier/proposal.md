---
name: relocate-the-skill-hooks-into-the-tested-tier
title: Move the two skill hook programs under scripts/ so the tested tier reaches them
created: 2026-09-18
kind: enabler-technical
---

Shaped by `architect` in `slice/spike-where-a-skill-script-can-live-and-be-tested`, which
landed 2026-09-18.

**This file is self-contained on purpose.** The spike's `findings.md` sits in
`backlog/done/`, a lane whose retrospective deletes the folder, so the durable half is
restated here rather than cited. The tag preserves the full record if a reader wants the
probe narrative and the rejected option.

**Not bound by `effective-prose`.** That epic's Wave 1 was a hold on its later waves, and the
user ruled it moot on 2026-09-15. This item appears in none of its waves and shares no file
with them.

## Situation

Two TypeScript programs fire on every write to `backlog/**` and `.claude/**`, measured
2026-09-18: `.claude/skills/idea-assess/scripts/layer1.ts` at 117 lines, the board-shape
hook, and `.claude/skills/prose-audit/scripts/on-edit.ts` at 91 lines, the write-time Vale
hook.

Neither has a test file. `tsc -b`, every vitest, Stryker, crap4ts and dry4ts config,
`reference-check`'s source surface and `agent-doc-check` all miss them. Only oxlint, Prettier
and `prose-lint` reach them.

**The spike ruled the blocking question:** a skill's script may live outside its skill
directory. Three documented facts settled it, read 2026-09-18 against Claude Code 2.1.236.
The project-directory substitution's own documented purpose is referencing project-local
scripts independent of where a skill is installed, and its example is a script in no skill
directory. The hooks system has no skill-awareness at all — both programs are wired in
`.claude/settings.json` rather than in skill frontmatter, so nothing but the path string ever
coupled them to a skill. And bundled packaging is a portability convention for distributed
skills, which these are not.

So the encoded references are the entire coupling: four hook entries in
`.claude/settings.json` plus one injection line in `idea-assess`'s own skill file.
`prose-audit`'s skill file names no script at all.

**One caveat the spike found, location-neutral and so not an argument either way.** The
project-directory variable stays at the session's starting root when Claude enters a worktree
mid-session, so a hook runs the main checkout's copy. That is equally true at the current
path and at any new one, and moot under one-session-per-worktree. It wants a line wherever
the relocated hooks are documented.

## Complication

208 lines of logic run on every board and corpus write, and no gate can tell when one breaks.
**Neither hook has been observed breaking, and that is the point rather than a weakness in
the argument.** Both are advisory and always exit 0, so a broken one reports nothing and
reads exactly like a clean file — the confident-zero shape, in the two programs that police
the board and the corpus.

The repo has ruled against this shape once already:
`slice/prose-lint-runner-is-shell-not-typescript` moved a runner into the tested tier for the
same reason, and `effective-prose` lists that as foundational.

The argument that kept them where they are does not survive the spike's readings.
`tsconfig.scripts.json` sets `erasableSyntaxOnly`, so the tested tier already enforces the
syntax half of the bare-node runner contract mechanically, tier-wide — relocation gains a
compiler guarantee rather than costing a contract. And the hook command names `node`
explicitly at any path, so the tier being tsx-based is a fact about how npm scripts invoke
its ten programs, not a constraint on what may live there.

## Question

What is the smallest move that brings both programs under every gate the tested tier already
runs, without changing what either one does?

## Answer

Shaped by `architect`, six steps:

1. **Move each program into its own directory under `scripts/`**, split as the tier's layout
   demands: a `run.ts` shell holding stdin, stdout, argv and exit, delegating to pure
   modules beside it. The split is forced twice over — Stryker excludes `run.ts` and crap4ts
   does not, so an unsplit file would sit in the gates' blind spot, and both programs
   currently execute at import, which is untestable.
2. **Behaviour-preserving throughout**: same stdin contract, same envelope delivery, same
   exit-0 discipline, byte-identical output on the same inputs.
3. **Update the four hook commands and the one skill-file injection line** to the new paths,
   keeping bare `node` as the runner. **Ruled by the user 2026-09-18: `coder` makes these
   five edits, granted by name in the invoking prompt.** No role in an enabler-technical
   cycle carries a standing write boundary over `.claude/settings.json` or a `SKILL.md`, and
   the grant is per-slice rather than a widening of `coder`'s boundary. The seat names the
   five paths in the prompt; `coder` writes nothing else under `.claude/`.
4. **Re-measure the zero-stderr property at execution**, on the node the hooks actually use.
   The spike did not run this probe — it closed on its falsifier — so this is a real
   measurement rather than a confirmation.
5. **Add the test files and run the scripts-tier battery.** Expect zero config edits, since
   every relevant config is glob-based over `scripts/**`. **Verify by naming the files, not
   by reading a green result** — a glob that fails to reach the new directory returns a clean
   battery over nothing, which is the same confident zero this item exists to close. Read
   each runner's own file list: `npx vitest list` for the suite, Stryker's dry-run count for
   the mutants, crap4ts's function count.
6. **Carry the erasable-syntax constraint forward.** Both programs import only node builtins
   today, so it binds future imports rather than the move.

## No-gos

- **No logic change to either program.** `the-board-hook-misfits-per-item-artifacts` owns
  `layer1.ts`'s logic and is parked in `ready/` with a written, unsigned `coach` spec. This
  item moves and splits; that one rewrites.
- No new gate, no new config surface. The point is that the existing globs already reach
  `scripts/**`.

## Open questions

- **Settled by the user 2026-09-18: this item lands first.** The parked parent,
  `the-board-hook-misfits-per-item-artifacts`, waits behind it. The accepted cost is that
  the parent's `coach` spec was measured against `layer1.ts` at its current path and shape,
  so its readings go stale when this item moves and splits the file. **That spec is unsigned,
  so `coach` revises it in place.** No amendment is involved — the amendment mechanism exists
  to protect a signature, and an unsigned spec has none.
- Where does the structure-versus-logic boundary sit between the two items? This one moves
  and splits, that one rewrites — but the split decides which module the rewrite lands in,
  so this item's design pass should name the seam the parent will edit.
- Does the `run.ts` and pure-modules split fall out naturally for `on-edit.ts` at 91 lines,
  or is it overhead for the smaller program?
- The worktree caveat in Situation is location-neutral, so it does not bear on the move.
  Does it want a line wherever the relocated hooks end up documented?
- **The per-slice grant in step 3 is a workaround, and the gap it works around is durable.**
  An enabler-technical cycle runs `coder`, `cleaner`, `architect` and `hardener`, none of
  which owns `.claude/**`; `writer` owns it and never writes `scripts/`, so no single cycle
  covers a slice that spans both. Any future slice moving a hook, a skill script or a
  settings entry alongside code hits this. Whether that wants a standing rule is a process
  question this slice does not answer — but run this one first, so the rule is written
  against a worked case rather than a hypothesis.
