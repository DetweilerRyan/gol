# Retro findings — relocate-the-skill-hooks-into-the-tested-tier

Recorded during the slice rather than after it, for the retrospective on this folder.

## The seat sent `coder` outside its boundary, and `coder` complied

On 2026-09-18 the orchestrating seat's `coder` invocation said, under a heading about
verification: run `crap4ts`'s function count, and run a `--mutate`-scoped Stryker run for the
mutants. CLAUDE.md's own description of that role says the opposite in plain words — it
"never runs crap4ts, dry4ts, or mutation testing — those gates are not its to run."

`coder` ran both. It also ran `dry4ts:scripts` on its own initiative, reasoning that a
duplication linter over files it had just authored was its business. It reported all three
honestly and, once corrected, reclassified two of them as information rather than
verification. The user caught the error, not the seat and not the role.

**The seat's half.** `architect`'s design stated verification readings for the whole slice.
The seat handed all of them to the first role it invoked instead of distributing them across
the cycle — `vitest list` to `coder`, `crap4ts` and the mutation scan to `cleaner`, the full
battery to `hardener`. The design was right; the dispatch was wrong.

**The role's half, and it is the one worth the retrospective's time.** `coder`'s file draws
the boundary the prompt crossed, and the role read the prompt rather than its file. The
corpus already has the shape this should have taken: `writer` returns a spec point it cannot
execute rather than working around it, and `hardener` may refuse an exemption though it may
never grant itself one. That asymmetry is deliberate — a role that can excuse itself from its
own gate is not a gate. The same reasoning says a role should refuse a gate that is not its
to run, and say so.

## The finding underneath, which is not about either party

**From the role's side, a ruled grant and a seat's mistake arrive identically.** Both are
prompt content that says to do something the role file does not cover.

That same `coder` prompt carried both. The user had ruled, by name and per slice, that
`coder` would edit four hook commands in `.claude/settings.json` and one injection line in a
skill file, and later extended it to two deletions — a legitimate widening, ruled by the one
authority that can widen it. The `crap4ts` and Stryker instruction was an error with no
ruling behind it. Nothing in the prompt's shape distinguished them, and nothing in the role's
reading could have.

So "a role should refuse instructions outside its file" is not by itself executable. A role
that refuses everything unfamiliar cannot take a legitimate grant; a role that accepts
everything is not bounded. **What separates them is whether a ruling is named, and nothing in
the corpus requires an invocation to name one.**

Candidate remedies, none ruled, all for the retrospective to weigh:

- An invocation that widens a role's boundary states the ruling and its date, and the role
  refuses a widening that names none. That makes the two cases distinguishable in the only
  place the role can see.
- The seat's own article carries the dispatch rule the design implied: a design's verification
  readings are distributed across the cycle by whose gate each is, never handed whole to one
  role.
- A role file says what to do with an out-of-boundary instruction, the way `writer`'s already
  does for a spec point it cannot execute.

## Why this is here rather than on the board

It is an observation about how the seat and a role behaved in one cycle, not a defect in the
tree. The retrospective is the pass that decides whether an observation becomes a candidate,
and filing it as one now would pre-empt that — and add to a board the user is deliberately
holding down.
