---
name: relocate-the-skill-hooks-into-the-tested-tier
title: Move the two skill hook programs under scripts/ so the tested tier reaches them
created: 2026-09-18
---

Shaped by `architect` in `slice/spike-where-a-skill-script-can-live-and-be-tested`, which
landed 2026-09-18. That spike's `findings.md` carries the ruling, the readings behind it, and
the six steps this file restates in brief. Read it before specifying this item.

## Situation

Two TypeScript programs fire on every write to `backlog/**` and `.claude/**`, measured
2026-09-18: `.claude/skills/idea-assess/scripts/layer1.ts` at 117 lines, the board-shape
hook, and `.claude/skills/prose-audit/scripts/on-edit.ts` at 91 lines, the write-time Vale
hook.

Neither has a test file. `tsc -b`, every vitest, Stryker, crap4ts and dry4ts config,
`reference-check`'s source surface and `agent-doc-check` all miss them. Only oxlint, Prettier
and `prose-lint` reach them.

**The spike ruled the blocking question:** a skill's script may live outside its skill
directory. The skill system resolves nothing by location, both invocation surfaces are plain
text substitution, and the encoded references are the entire coupling — four hook entries in
`.claude/settings.json` plus one injection line in `idea-assess`'s own skill file.

## Complication

208 lines of logic run on every board and corpus write, and no gate can tell when one breaks.
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
   keeping bare `node` as the runner.
4. **Re-measure the zero-stderr property at execution**, on the node the hooks actually use.
   The spike did not run this probe — it closed on its falsifier — so this is a real
   measurement rather than a confirmation.
5. **Add the test files and run the scripts-tier battery.** Expect zero config edits, since
   every relevant config is glob-based over `scripts/**`, and verify rather than assume.
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
- The spike found that `${CLAUDE_PROJECT_DIR}` stays at the session's starting root when
  Claude enters a worktree mid-session, so a hook runs the main checkout's copy. It is
  location-neutral, so it does not bear on the move — does it want a line wherever the
  relocated hooks are documented?
- Does this item inherit `effective-prose`'s ordering, given that epic lists the
  same-shaped runner slice as foundational?
