# Amendment 8 — assessment-records-die-with-the-conversation

`coach` SPEC, 2026-09-20, against tip `56103ca`. **This amendment needs the user's signature
before `writer` runs.** It carries two items, numbered **24 and 25**, continuing the sequence.

**`spec.md` and amendments 1 to 7 are all signed and immutable.** Nothing in any of them is
reworded, renumbered or reordered. The live instruction set is nine files read in number order.

## The trigger, and it clears the stopping condition on its own terms

Amendment 7 landed whole at `4adf105`. `editor` CLEAN binned its findings under the stopping
condition, and **one is blocking**: two landed instructions disagree on whether one act is
permitted.

**CLAUDE.md line 313** — "A role never derives a board path." Unscoped.

**`pipelines.md` line 292, the bullet my own item 18a added** — "`coach` SPEC builds
`backlog/ready/<slice>/spec.md` from the slice name, because its own file names that deliverable."

**`coach` SPEC is handed the mode, the proposal's content and the slice name — no path — and must
produce `spec.md` in the item's folder. It can only do that by deriving the path.**

**It is worse than the `pipelines.md` version item 18 fixed.** CLAUDE.md is the auto-loaded
surface and `pipelines.md` is read on a trigger, so the role meets the prohibition first and the
licence second, if at all. It is also the exact wrong action amendment 7's scope table named for
finding 1.

## The convergence ruling, tested and refined rather than defended

**`editor` is right, and its reading does not overturn amendment 7's ruling. It names a rule I
should have applied and did not.**

### What closed, and what did not

| Class                                | Status                                                                             |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| The retired-universal **phrase**     | **Closed.** `editor` re-ran item 19's recorded command and found no further anchor |
| The read/write **distinction**       | **Open, one item wide.** Item 24 closes it                                         |
| New defects in the assessment record | **Zero, for the second consecutive round**                                         |

### The precise mistake, stated so it generalises

**A census closes the class it censused.** Item 19 censused a phrase. **Item 18, in the same
amendment, introduced a distinction** — read against write — and taught it to one home of four. A
distinction needs its own census across the same homes. I ran one census and let it stand for two
classes.

**So the generalisable rule is: when an amendment teaches one home a new distinction, census the
other homes for that distinction in the same amendment.**

### That lesson goes to the retrospective, and that is the point of having a stopping condition

**It is a lesson, not a contradiction, and it reaches no gate.** Landing it would be the second
time in two rounds that the rule's own author suspended it on contact, and a rule suspended by its
author on first contact is not a rule. It is recorded in `retro.md` alongside R1, R2 and R4's
reasoning.

### The falsifiable form of the ruling

**After item 24, the census covers both classes across all four homes, and `editor` has
independently re-verified the first.** So: **if an amendment 9 is needed, it will be because item
24 or item 25 introduced something, not because a home was missed.** That is checkable, and it is
the claim to hold me to.

## Rulings on the four binned findings

| Finding | Ruling                                                            |
| ------- | ----------------------------------------------------------------- |
| R1      | **Correctly binned.** See the discriminator below                 |
| R2      | **Correctly binned**                                              |
| R3      | **Folded into item 24, and fixed rather than stated as harmless** |
| R4      | **Misbinned. It becomes item 25**                                 |

**R1 and R2 share a discriminator with the blocking finding, and it is what makes the two bins
principled rather than convenient.** All three are a lead that overclaims what its body narrows.
**The question is whether the overclaim forbids a licensed act or merely oversells a
convenience.** CLAUDE.md's blanket sentence forbids `coach` its own deliverable — a wrong action.
R1's "no gate reaches it" oversells; a reader who believes it runs a gate, sees a finding, and is
corrected on first contact. R2's missing antecedent is rescued by the next sentence in the same
bullet.

**They also sit in the bullet I wrote at item 23a, which is exactly why they stay binned.** Two
lines would fix both. Bending the stopping condition for my own prose, on its first test, would
cost more than the two lines buy.

**`orchestration.md`'s "`backlog/` is a duty no role can perform" is correctly recorded too.** It
is a topic sentence followed immediately by the pointer to the canonical rule, so the scope
arrives before a reader can act on it.

## R4 is misbinned, and item 25 is why

`editor` binned it and then argued against itself. **I take its self-argument.**

**`/idea-assess` reads "The judging pass rules the disposition and nothing else."** The judging
pass also rules the `kind` label — mandated in three places including the skill's own step 3. So
the clause is **literally false about the file it sits in**.

**What `editor` offered in mitigation is the reading item 18 rejected.** It said the next sentence
names the two excluded acts, so the scope arrives in the same bullet. That is true, and it is the
same charitable reading of a trailing clause that item 18 refused for `pipelines.md`. **Applying
it here and refusing it there would make the rule a matter of who is reading.**

**The clause is also mine, from item 21b, and it overreached.** Its job was to carry the
prohibition "never rules the human ruling" that the old wording carried. "And nothing else" says
far more than that job needs.

## What this supersedes

| Item | Supersedes                                                       | Files                                 |
| ---- | ---------------------------------------------------------------- | ------------------------------------- |
| 24   | Amendment 6's item 17d, in part; amendment 7's item 20b, in part | CLAUDE.md, `.claude/agents/writer.md` |
| 25   | Amendment 7's item 21b, in part                                  | `.claude/skills/idea-assess/SKILL.md` |

**The file set does not widen.** All three files entered it at the spec or at amendment 6.

## Item 24 — the read/write census, and the two homes that failed it

### The census, by recorded method

```bash
grep -rn -iE "deriv|board path|read carve-out|nothing else under|never glob|directory listing|write grant|separate grant" .claude CLAUDE.md --include="*.md"
```

**Every hit was read rather than filtered.** The four carve-out homes, and what each said before
this item:

| Home                               | Carried the split?                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| `pipelines.md` lines 288 to 294    | **Yes** — item 18a taught it                                                     |
| `.claude/agents/coach.md` line 54  | **Yes** — "Read only the board paths your prompt names" was read-scoped already  |
| CLAUDE.md line 313                 | **No** — blanket, and it reaches the one role with a derive-to-write deliverable |
| `.claude/agents/writer.md` line 45 | **No** — blanket, harmless today                                                 |

**`orchestration.md` is no longer a home**, since item 21a replaced its restatement with a
pointer. The home cut held.

**The census also found one hit outside the rule, and ruling it out is the method working.**
`.claude/skills/idea-capture/SKILL.md` line 13 reads "Derive `<name>`: kebab-case, short, naming
the problem." **A skill is the seat's own tooling rather than a role**, and the carve-out binds
roles. No change, and the reading is recorded so the next census does not re-litigate it.

### 24a — CLAUDE.md, the blocking anchor

**Find** (a whole sentence; one occurrence):

```text
A role never derives a board path.
```

**Replace with:**

```text
A role never derives a board path to read one, and writing is a separate grant only a role's own file gives.
```

**The prohibition survives and gains the scope the canonical rule already has.** "Never derives a
board path" becomes "never derives a board path **to read one**", and the write grant is named in
the same sentence rather than left to a file read on a trigger.

### 24b — `.claude/agents/writer.md`, R3, fixed rather than recorded

**Ruled: fix it now.** `writer` has no derive-to-write deliverable today, so the blanket form is
true. **But "harmless today" is exactly what item 17d's blanket sentence was, and it was never
harmless — `coach` had that deliverable the whole time and I did not check.** Having censused and
found `writer` genuinely clear, the choice is between one clause and a fourth home that disagrees
in form with the canonical rule for no saving.

**Find** (one list item; unique in the file):

```text
- Never derive a board path. Read the ones your prompt names, and nothing else under
  `backlog/`.
```

**Replace with:**

```text
- Read only the board paths your prompt names, and never derive one. Nothing else under
  `backlog/` is yours.
```

**Nothing is dropped and the scope arrives in the first three words.** "Read only" carries the
split that "Never derive a board path" left open, and the prohibition on deriving survives in the
same sentence.

## Item 25 — `/idea-assess` stops claiming it rules nothing else

**Supersedes amendment 7's item 21b, in part.**

**Find** (a whole line; unique in the file):

```text
- The judging pass rules the disposition and nothing else. The human ruling and the promotion are separate human-invoked commands.
```

**Replace with:**

```text
- The judging pass rules the disposition. The human ruling and the promotion are separate human-invoked commands, and neither is yours.
```

**Both prohibitions survive and the false universal goes.** "And nothing else" is dropped, because
the same file mandates the kind check at step 3 and the record's shape carries the kind. **"And
neither is yours" replaces the work that clause was doing** — it names the two acts the judging
pass may not perform, which is all item 21b ever needed.

## Which pass the items run in

**One pass, three files, one commit**, with `editor` CLEAN after it. No item depends on another,
and no file is touched by both.

## Measured readings — baseline first, then candidate, then discriminator

**Measured 2026-09-20 in this worktree at tip `56103ca`**, in place, restored with
`git checkout` afterwards. `git status --porcelain` reported empty.

**The pre-edit baseline was taken at every path before any candidate was applied.** CLAUDE.md is
non-zero at baseline, and without that reading its post-edit 19 would read as a regression.

| Path                                  | Baseline                     | With items 24 and 25             |
| ------------------------------------- | ---------------------------- | -------------------------------- |
| `CLAUDE.md`                           | **19 warnings**              | **19**                           |
| `.claude/agents/writer.md`            | 0 in 1 file                  | **0**                            |
| `.claude/skills/idea-assess/SKILL.md` | 0 in 1 file                  | **0**                            |
| `npm run reference-check`             | 538 files, 3,226 refs, clean | **538 files, 3,226 refs, clean** |
| `npm run agent-doc-check`             | 55 / 8 / 32, clean           | **unchanged, clean**             |
| `npx prettier --check` on the three   | clean                        | **clean**                        |

**The reference count does not move.** No item adds or removes a filename token.

**Three discriminators, each reporting, each run against the whole enabled rule set for its
path:**

| Probe                                               | Reported                                     |
| --------------------------------------------------- | -------------------------------------------- |
| Item 24a's replacement written past the 25-word cap | `STE.SentenceLength`, 32 words               |
| Item 24b's bullet written in four sentences         | `Instruction.ListItemSentences`, 4 sentences |
| Item 25's replacement written past the 25-word cap  | `STE.SentenceLength`, 26 words               |

**Item 24a's own replacement measures 22 words against the 25-word cap**, which is close enough
that the probe rather than a count is what settles it. The discriminator above is the same
sentence written to 32.

## Sign-off

The user signs this amendment before `writer` runs. **The file set does not widen**, and nothing
here reaches `scripts/`, `src/`, `vale-styles/` or `.vale.ini`.

**Two things to weigh beyond the items.** R4 moves from the retrospective into the amendment, so
one of `editor`'s bins is overturned. And the convergence ruling now carries a falsifiable claim
rather than a confidence: **if an amendment 9 is needed, it will be because item 24 or 25
introduced something, not because a home was missed.**
