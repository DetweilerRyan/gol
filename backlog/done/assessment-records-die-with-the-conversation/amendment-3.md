# Amendment 3 — assessment-records-die-with-the-conversation

`coach` SPEC, 2026-09-20, against tip `1a61fe4`. **This amendment needs the user's signature
before `writer` runs.** It carries one item, numbered **7** to continue amendment 2's sequence.

**Why a third file rather than a seventh item inside amendment 2.** `amendment-2.md` was signed at
`1a61fe4`, and a signed amendment is immutable exactly as the spec is — the signed bytes stay the
signed bytes. The user ruled item 7 into amendment 2's **scope** after that signature, which the
numbering carries; the numbering cannot reach into the file. **Nothing in `spec.md`,
`amendment-1.md` or `amendment-2.md` is reworded, renumbered or reordered.** The live instruction
set is now four files read in number order.

**This item supersedes nothing.** It is additive. Read that literally: no earlier item's Find
block, Replace block, ordering or ruling changes.

## The trigger — a ruling of mine, overturned

I ruled `editor`'s empty-CLEAN-diff question out of this slice and into its own
`enabler-process`, on the line that this amendment fixes what this slice broke while a
pre-existing general gap gets its own signature. **The user ruled it belongs in this work.**

**The substance of my ruling stands and is not reopened. No licence.** The user signed those
bytes; "changes no instruction" is a judgement, and the signature exists to keep that judgement
with the user through `coach`. CLEAN's deliverable in a verbatim slice is its findings rather than
its diff.

**What was missing is that nothing told `editor` any of it.** Four consecutive empty diffs read to
the role as a shortfall rather than as the success mode they were.

## Item 7 — `.claude/agents/editor.md` learns what CLEAN does not touch

**Supersedes nothing.** **This widens the signed file set a second time, to
`.claude/agents/editor.md`** — amendment 2 widened it once, to `.claude/agents/coach.md`. The set
is now the seven files `spec.md` names plus those two.

### The adjacency check, run before writing

`editor.md` already carries a rule of this family, in two places. Its `description` says "A
substantive contradiction it finds is reported to coach, never fixed in place", and its Boundaries
list opens with "Never change what an instruction says. A substantive contradiction is reported to
`coach`, never fixed in place."

**The addition narrows a different grant, so it is not the restatement shape.** The existing rule
covers **meaning**. The CLEAN mode bullet grants "Register, duplication, and cross-reference
consistency are yours; meaning is not" — so a reader of that grant alone concludes that register
inside spec-verbatim text is theirs to fix. The addition says register is not theirs **either**,
inside that one class of text. That is a carve-out from the grant, not a second copy of the
contradiction rule.

### Placement — Boundaries, immediately after the existing narrowing

**Ruled: the file's own convention decides it.** The grant lives in the CLEAN mode bullet and the
narrowing of that grant already lives in Boundaries. A second narrowing belongs where the first
one sits, in broad-then-narrow order.

**The mode bullet was considered and declined on a measurement.** It already carries three
sentences, which is `Instruction.ListItemSentences`'s cap, so narrowing the grant in place would
have meant packing a clause into the grant sentence or splitting the item. Both are the shapes
`prose.md` names rather than remedies.

### Sentence count — three, and each of the two facts keeps its own

The first fact takes two sentences: the prohibition, then where the register defect goes instead.
The second takes one. Three is the cap rather than over it, and the reading below is measured
rather than predicted from that cap.

### The edit

**Find** (one list item in the Boundaries section, hand-wrapped across two lines, unique in the
file):

```text
- Never change what an instruction says. A substantive contradiction is reported to `coach`,
  never fixed in place.
```

**Replace with:**

```text
- Never change what an instruction says. A substantive contradiction is reported to `coach`,
  never fixed in place.
- Never edit text a signed spec or amendment supplied verbatim, in a whole-file block or a
  find-and-replace block alike. A register defect there is a finding for your handoff, never an
  edit. An empty diff is then a success mode rather than a shortfall, and your findings are the
  deliverable.
```

**Nothing is dropped.** The existing bullet is reproduced byte-for-byte and the new one follows
it.

**The phrase "never fixed in place" is deliberately not echoed** in the new bullet. Two adjacent
bullets ending on the same clause read as one rule copied, and "a finding for your handoff" says
where the defect goes rather than only where it does not go.

### What deliberately does not change

- **The `description` frontmatter.** `prose.md` rules that a `description:` states the precondition
  that makes this agent the right one. This is a boundary inside the invocation, not a selection
  precondition, and the field is already long.
- **`.claude/references/pipelines.md`.** Its step 3 Handoff cell already reads "What changed or
  that nothing did", so the seat's side of the empty diff is sanctioned there today. Only the
  role's side was missing, which is why this item reaches one file.

## Which pass item 7 runs in

**Pass D, alongside amendment 2's eight edits.** Pass D becomes nine edits over seven files.

**`editor.md` is cleanly separable**, which is the argument for riding rather than standing alone:
no other item in any amendment touches it, the edit depends on nothing else landing, and backing
item 7 out later is a one-bullet revert. A second commit would buy a second `editor` CLEAN pass
over the same cycle re-entry and nothing else.

**Note what the pass makes possible.** `editor` CLEAN's manifest for pass D will contain
`editor.md` itself, carrying this bullet, all of it spec-verbatim. The first text item 7 governs
is `editor`'s own pass over item 7. An edit there is the loudest possible falsifier.

## Expected readings — measured, not predicted

**`editor.md` at tip `1a61fe4`: `vale` reports 0 errors, 0 warnings, 0 suggestions in 1 file.**
The file is on `.vale.ini`'s `[.claude/agents/**/*.md]` glob, so all three `Instruction` rules are
live on it rather than held off by name the way they are on the articles and references tiers.

**The addition measures clean.** Probed 2026-09-20 in this worktree at tip `1a61fe4`, by applying
the Replace block above to a copy of `editor.md` placed at a path on the same glob, running
`vale` over it, and deleting the copy. **0 errors, 0 warnings, 0 suggestions in 1 file**, and
`npx prettier --check` reports the copy clean, so the hand-wrapping survives `npm run format`.

**The probe discriminates, which is what makes the clean reading worth anything.** The same probe
re-run with the third sentence split in two — four sentences rather than three, and no other
change — reports **1 warning, `Instruction.ListItemSentences`**, naming the three-sentence cap. So
the clean reading is the rule passing rather than the rule being absent.

**The copy was placed in a subdirectory of `.claude/agents/`, and that choice is load-bearing.**
`scripts/agent-doc-check`'s roster scan filters on `entry.isFile()` and never descends, so the
copy could not enrol as an agent and could not red the frontmatter check while it existed. The
directory was removed in the same command, and `git status` reported a clean tree after.

| Check                                 | At tip `1a61fe4` | Predicted after pass D |
| ------------------------------------- | ---------------- | ---------------------- |
| `vale .claude/agents/editor.md`       | 0 in 1 file      | 0 in 1 file            |
| `npx prettier --check` on `editor.md` | clean            | clean                  |
| `npm run agent-doc-check`             | clean            | unchanged, clean       |
| `npm run reference-check`             | no failures      | unchanged, clean       |

**Amendment 2's reading table is unaffected.** Item 7 touches no file it names, so the predicted
`CLAUDE.md` count of 19 and the sanctioned `idea-approve` finding both stand as signed.

## Sign-off

The user signs this amendment before `writer` runs pass D. The file set is the seven files
`spec.md` names, plus `.claude/agents/coach.md` from amendment 2 and `.claude/agents/editor.md`
from this one. Nothing here reaches `scripts/`, `src/`, `vale-styles/` or `.vale.ini`.
