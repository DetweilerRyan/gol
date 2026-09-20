# Amendment 4 — assessment-records-die-with-the-conversation

`coach` SPEC, 2026-09-20, against tip `795a16b`. **This amendment needs the user's signature
before `writer` runs.** It carries one item, numbered **8**, continuing the sequence.

**Why a fourth file.** `spec.md`, `amendment-1.md`, `amendment-2.md` and `amendment-3.md` are all
signed and immutable. Nothing in any of them is reworded, renumbered or reordered. The live
instruction set is five files read in number order, with this text winning where they meet.

## The trigger — item 3's own divergence

Pass D landed at `795a16b`. Nine edits went in verbatim, every predicted reading held, and both
structural checks passed. **One file diverged, and it is the file item 3 added to the set.**
`coach.md` measured 0 before pass D and 1 after:

```text
.claude/agents/coach.md:34:57:Instruction.ListItemSentences:List item has 4 sentences.
```

**The cause is an arithmetic method, not a wording choice.** Amendment 2's item 3 counted the
bullet's sentences by hand and did not count the bolded lead. Vale reads `**The spec artifact.**`
as a sentence in its own right, because the period sits inside the bold. So the bullet stood at
three sentences before item 3 and at four after, and item 3's claim that "three is the cap rather
than over it" was measuring the wrong three.

**`writer` was right to land it and return it.** Clearing the finding needs a split or a routed
sentence, and no signed item named either.

**This is not an exempt class.** Unlike `idea-approve`'s sanctioned `HistoricalNarration`
finding, it is a plain over-length list item, on a file that read 0 before this slice reached it,
on a surface where the three `Instruction` rules are live rather than held off by name.

## What this supersedes — said loudly

**Item 8 supersedes amendment 2's item 3 in part, and the part it supersedes is the `coach.md`
edit.** Item 3 had two halves. Its first half ruled that C2's marker instruction was wrong and the
landed file right, and landed no corpus edit; **that half stands untouched.** Its second half
placed the anchor rule inside the spec-artifact bullet under Owns. **Item 8 replaces that
placement.**

**The rule itself is not reopened.** Place an edit by an anchor, never by a line number, because
Prettier owns blank-line placement. That ruling stands exactly as signed.

**Item 8 also widens the rule's reach, and that widening needs this signature.** Read the next
section before signing; it is a substantive change rather than a lint fix wearing one.

**Nothing else is superseded.** Amendment 1's items 8a and 8b stand and still ride with step 4.
Amendment 2's items 1, 2a, 2b, 4 and 5 stand as landed. Amendment 3's item 7 stands as landed.

## Item 8 — the anchor rule moves to Boundaries

### The shape — a sibling bullet, and the Owns list is the wrong parent

**Ruled: Boundaries, not a sibling under Owns, and not compression in place.**

**Compression in place is not available, and that is measured rather than judged.** The bullet's
second sentence measures 24 words against `STE.SentenceLength`'s cap of 25, with its two code
spans dropped before the count. Folding the anchor clause into it crosses the cap, so compression
trades one finding for another. No other sentence in the bullet can absorb a placement rule
without becoming incoherent.

**A sibling under Owns is a category mismatch.** Every bullet there names something `coach` owns —
a diagnosis, an artifact, an amendment, a scope ruling, a recommendation class, a reserved intake.
A rule about how an edit is written is not a thing owned.

**Boundaries is where this file already puts a rule of this shape.** Its three bullets are each a
prohibition followed by what to do instead, with no bolded lead, and the first of them — "Never
edit the corpus … Your spec names edits; `writer` makes them" — is a Task fact living in
Boundaries because it is phrased as a prohibition. **The file's own convention decides the
placement**, which is the same reasoning amendment 3's item 7 used on `editor.md`.

**Placement within the list: second, directly after the corpus bullet.** That bullet says the spec
names edits. This one says how it names them.

### The reach widens, and this is the substantive half

**Inside the spec-artifact bullet, the rule read as binding `spec.md` alone.** In Boundaries it is
unconditional, so it binds every Find block `coach` writes — in an amendment as much as in a spec.

**That is a correction, not a side effect.** Four amendments in this slice carry Find blocks, and
an amendment can name a line number exactly as C2 did. The narrower placement would have left them
outside the rule that exists because of them.

### The edit

**Find 1** (the tail of the spec-artifact bullet under Owns, unique in the file):

```text
  with the check readings the change is expected to move. Place every edit by an anchor in
  the file's own text, never by a line number, since Prettier owns blank-line placement.
  You stop for explicit user sign-off and write no corpus edit yourself.
```

**Replace with:**

```text
  with the check readings the change is expected to move. You stop for explicit user
  sign-off and write no corpus edit yourself.
```

**Find 2** (the first bullet of the Boundaries list, unique in the file):

```text
- Never edit the corpus, `src/`, or `scripts/`, in either mode. Your spec names edits;
  `writer` makes them.
```

**Replace with:**

```text
- Never edit the corpus, `src/`, or `scripts/`, in either mode. Your spec names edits;
  `writer` makes them.
- Never place an edit by a line number. Anchor it in the target file's own text, since
  Prettier owns blank-line placement.
```

**Take the line wrapping as written.** `npx prettier --check` reports the probed candidate clean,
so both rewraps survive `npm run format`.

### Nothing is dropped, and one ambiguity is closed

Every clause of the removed sentence reappears. `every edit` becomes an unqualified prohibition
covering all of them. `by an anchor in the file's own text` becomes `Anchor it in the target
file's own text`. `never by a line number` becomes the prohibition itself. `since Prettier owns
blank-line placement` is verbatim.

**`the file's own text` said whose file only by context.** `the target file's own text` says it
outright, which matters in a rule that now sits beside three bullets about other people's files.

## Which pass item 8 runs in

**Step 4, alongside amendment 1's items 8a and 8b, amendment 2's item 4d, and the spec's D1 to
D4.** Step 4 has not run.

**`coach.md` is a third file in that pass, and it does not matter.** The pass already spans
`definition-of-ready.md` and `definition-of-ready.meta.md`. Item 8 depends on nothing in step 4
and step 4 depends on nothing in item 8, so the pass has no ordering hazard.

**A returned step-4 item would not block item 8.** `writer` executes items independently, which
pass D demonstrated: item 3 landed and its finding returned separately, while eight other edits
went in unaffected.

**The alternative, if the seat wants a single-subject commit:** item 8 stands alone as its own
pass before step 4. That buys subject coherence in `git log` and costs one extra `editor` CLEAN
pass. I rule for riding; the seat may split it without an amendment, since the pass boundary is
sequencing rather than instruction.

## Expected readings — measured, not predicted

**Probed 2026-09-20 in this worktree at tip `795a16b`**, by applying both Replace blocks to a copy
of `coach.md` placed in a subdirectory of `.claude/agents/`, running `vale` over it, and deleting
the copy. The subdirectory is load-bearing: `scripts/agent-doc-check`'s roster scan filters on
`entry.isFile()` and never descends, so the copy could not enrol as an agent while it existed.
`git status` reported a clean tree after.

| Check                                | At tip `795a16b`                  | With item 8 applied        |
| ------------------------------------ | --------------------------------- | -------------------------- |
| `vale .claude/agents/coach.md`       | 1 `Instruction.ListItemSentences` | **0 in 1 file** — measured |
| `npx prettier --check` on `coach.md` | clean                             | **clean** — measured       |
| `npm run agent-doc-check`            | clean                             | unchanged, clean           |
| `npm run reference-check`            | no failures                       | unchanged, clean           |

**The probe discriminates.** The same candidate with the new Boundaries bullet written in four
sentences rather than two — no other change — reports **1 warning,
`Instruction.ListItemSentences`**, on that bullet. So the clean reading is the rule reaching the
Boundaries list and passing, rather than the rule stopping at the Owns list.

**No other file's reading moves.** Item 8 touches one file, so CLAUDE.md's 19, `idea-promote`'s 0,
`idea-approve`'s sanctioned 1 and `editor.md`'s 0 all stand as landed.

## The lesson, and where it does not go

**Every predicted Vale reading in this slice that was probed held. The one counted by hand was
wrong.** Amendment 2's items 1, 2a and 2b carried `editor`'s probes, amendment 3's item 7 carried
mine, and all four held through pass D. Amendment 2's item 3 was hand-counted and is why this
amendment exists.

**Two mechanisms defeat a hand count, and they push in opposite directions.** A bolded lead ending
in a period counts as a sentence, so a hand count runs **low** and a bullet ships over the cap.
Code spans are dropped before the word count, so a hand count runs **high** and a sentence gets
rewritten that never needed it. Both were live in this one bullet.

**This is the confident-zero lesson reached from the other side — a confident pass.** `prose.md`
already carries twelve ways a run reports a confident zero. A prediction that a run _will_ be
clean is the same failure with the sign flipped, and nothing in the corpus says to probe it.

**Ruled: the lesson stays in this amendment, and the durable home is a recommendation rather than
an item here.** Three reasons:

1. **No widening is forced.** The rule's audience is every role that writes a predicted-reading
   table, not `coach` alone, so its home is `prose.md` — a file outside this slice's signed set.
2. **`coach.md` cannot take it.** After item 8 the spec-artifact bullet stands at three sentences,
   which is the cap. A fourth would recreate this amendment's own defect.
3. **A rule binding every role deserves its own signature**, not a clause riding a defect fix.

**Recommended to the seat as an `enabler-process` over `prose.md`:** a predicted Vale reading is
probed rather than counted by hand, with the two mechanisms above named and the probe's
discriminating half required. That slice's `coach` pass rules the placement; naming it here would
be specifying someone else's spec.

## Sign-off

The user signs this amendment before `writer` runs step 4. **The file set does not widen.**
`.claude/agents/coach.md` entered it at amendment 2, and nothing here reaches `scripts/`, `src/`,
`vale-styles/` or `.vale.ini`.
