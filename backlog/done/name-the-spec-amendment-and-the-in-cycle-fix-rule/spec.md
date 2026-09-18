# Spec — name-the-spec-amendment-and-the-in-cycle-fix-rule

`coach` SPEC, 2026-09-18. Kind `enabler-process`. **Sign-off: pending the user.**

Three files, three registers. `writer` executes the verbatim blocks in Parts 1 to 3 and makes
no judgement call: every anchor below is unique in its file, and every replacement string is
given in full.

---

## The impediment

The enabler-process pipeline gates a spec on the user's signature and `writer` edits under that
signature. Nothing in the corpus says what happens when the spec must change after it is signed.
Two cycles improvised it, and the authority question is the sharp one: an amendment changes what
the user signed, so it needs the user's signature again, and no file says so.

The board side is the same impediment at the other end of the cycle. A reviewing pass routes a
finding to `backlog/ideas/` by default, including a finding for a defect the running slice
authored, whose worktree is open and whose context is loaded. That is deferred rework filed as a
backlog item.

The remedy is prose in three places. No rule, script, or config changes.

---

## Rulings on the open questions

Each of these is my ruling to propose; the user's sign-off is what makes it bind.

### R1 — the amendment file is `amendment-1.md`, `amendment-2.md`, and so on

The board's artifacts are bare nouns — `proposal.md`, `design.md`, `spec.md`, `tasks.md`,
`findings.md`. `amendment-1.md` keeps the bare noun and adds a hyphenated series index, which is
the same token shape every slice name in this repo already uses.

`spec.amendment.1.md` is rejected. This repo has exactly one dotted-suffix filename convention
and it already means something: `<name>.meta.md` is the sidecar tier, and `.vale.ini`'s
`[**/*.meta.md]` section gives that suffix machine-read meaning. A second dotted suffix on the
same tier invites a reader to parse `spec.amendment.1.md` as a sidecar of the spec. Sorting was
the only argument for it, and `ls` places `amendment-1.md` adjacent to nothing rather than
adjacent to the wrong thing.

### R2 — the corpus names the file as `amendment-<n>.md`, and never as a concrete instance

Measured today against this worktree: `scripts/reference-check/references.ts`'s
`FILE_TOKEN_SOURCE` character class excludes `<` and `>`, so the token extracted from
`amendment-<n>.md` is a bare `.md`, which `isDiscardedToken` drops because its basename starts
with a dot. `npm run reference-check` therefore never resolves the placeholder, in this tree or
in any future one. The same form is already how this repo writes a hypothetical script name
(`npm run <script-name>`), and how CLAUDE.md writes `<name>.meta.md`.

A concrete `amendment-1.md` in the corpus would need an allow-marker today, because no instance
exists — and that marker becomes a **failure** the day the first amendment is written, under
`stale-allow-marker`'s "its token now resolves" case. `pipelines.md`'s existing `tasks.md`
marker is that same trap already armed once. The placeholder arms it zero times.

Concrete instance names are free inside `backlog/**`, which `reference-check` excludes from its
scan surface. So an amendment file may cite its siblings by name; the corpus may not.

### R3 — each amendment names what it supersedes; nothing restates the live set

A restatement of the live instruction set is a record that must stay true while the corpus under
it is still being edited. That is the exact defect class that produced fifteen findings on
`slice/split-the-merge-protocol-reasoning-into-its-sidecar`, and the last amendment would carry
the largest instance of it.

Naming supersessions is append-only: no signed file is ever edited, and the live set is computed
by reading the spec and the amendments in number order with later text winning. The cost is that
a reviewer reads N files rather than one. That cost is real and accepted — it buys the
immutability the user ruled for, and N is bounded by the stopping rule in R5.

**Nothing checks this convention**, and no checker can: whether an amendment named everything it
supersedes is a judgement about meaning. It is `coach` REVIEW's reading, stated here as a known
gap rather than as a guard.

### R4 — the mechanism binds this slice from the moment the user signs this spec

The bootstrap objection I raised on the previous slice was narrow: an amendment that creates the
amendment mechanism authorizes itself. That objection does not reach here. The mechanism is in a
spec the user signs directly, so its authority is the signature rather than a corpus line the
spec is trying to land.

So if this spec needs an amendment, the amendment is `amendment-1.md` in this item's own folder,
under the rules Part 1 lands. The seat does not wait for the merge. The alternative — run this
slice with no amendment available — would force a re-spec or a second improvisation, which is
the impediment this item exists to remove.

**This ruling appears nowhere in the corpus.** It is a fact about one slice, and a corpus line
saying so would be a record of what a slice changed, which the user ruled against on 2026-09-18.
It lives in this artifact and stops here.

### R5 — the stopping rule lands in `pipelines.md`, in the amendment subsection

The stopping condition, the falsifier and the fallback are three parts of one rule about whether
a further round runs. They bind the seat's control flow, not a sentence's claim form, so they sit
with the mechanism rather than in `claim-discipline.md`. The trigger is the **second** amendment
on one slice, which is where the loop question first becomes real and still one round ahead of
the pressure.

### R6 — `coach.md`'s `description:` widens by one sentence

The seat reads `description:` when it chooses whom to hire. `pipelines.md` tells the seat what
step runs next; the amendment trigger fires **between** steps, at a moment the seat is not
re-reading a pipeline table. A seat that has not opened the role file would see a SPEC mode that
writes specs and a REVIEW mode that reads corpus, and neither reads as amendment authority.

Two measured facts make this safe. Vale reaches the frontmatter for existence-class rules — a
probe that inserted `It's` into the description reported `STE.Contractions` at line 3 — and the
sentence specified in Part 2 measures clean. `agent-doc-check`'s frontmatter reader is
line-anchored and the field stays one double-quoted line with no embedded quote character;
`npm run agent-doc-check` exits 0 on the candidate.

### R7 — `handoffs.md` alone reaches every role that files candidates, so no role file changes

Verified by reading each role file today: `product`, `coder`, `cleaner`, `architect`,
`hardener`, `writer`, `editor` and `coach` each carry the unconditional read of the four
house-rules articles, `handoffs` among them. CLAUDE.md states the orchestrating seat reads the
same four. A matching line in each role file would put one fact in nine homes with nothing
keeping them equal.

---

## Part 1 — `.claude/references/pipelines.md`

### 1a — add two dashed edges to the enabler-process diagram

**Find** this line, which is unique in the file:

```
  R --> G[merge protocol]
```

**Replace** it with:

```
  R --> G[merge protocol]
  W -.->|returned spec point| A
  R -.->|amendment| U
```

Both edges route back through the existing `A --> U` and `U --> W` edges, so the diagram now
shows that every amendment path passes the user gate.

### 1b — add the amendment subsection

**Insert point.** Inside `## Enabler-process`, after the paragraph beginning
`**The user gate sits at step 1's close**` and before the `**Exit:**` paragraph that follows it.
That `**Exit:**` text appears twice in the file; the one in `## Enabler-process` is the second.
Leave one blank line above and one below the inserted block.

**Insert, verbatim:**

```markdown
### Amending a signed spec

A signed spec is the authority `writer` edits under, so changing it after sign-off needs its
own rule.

**Trigger.** `coach` REVIEW finds the landed corpus diverges from what the spec should say,
or the seat finds the spec under-specifies a point `writer` has reached. A `writer` that
cannot execute a spec point returns it and stops; that return is a trigger, never an
amendment.

**`coach` authors every amendment, in either mode. `writer` never does.** An executing role
editing its own authority is the boundary this pipeline holds. Hire `coach` in SPEC mode to
amend ahead of the review pass, and in REVIEW mode when the review itself finds the
divergence.

**An amendment is its own file, `amendment-<n>.md` beside the spec, numbered from 1 in
writing order.** The spec is immutable once the slice starts, so the signed bytes stay the
signed bytes. A reader can then diff what was signed against what was proposed without
untangling appended sections.

**Each amendment names the spec items it supersedes, and supersedes nothing it does not
name.** The live instruction set is `spec.md` plus every amendment, read in number order,
with later text winning. No amendment restates the live set, because a restatement drifts as
the next amendment lands.

**Every amendment needs the user's re-sign-off.** An amendment changes something only the
user signed, so the original signature does not carry across it.

**The cycle then re-enters at step 2**, scoped to the files the amendment names. `editor`
CLEAN runs over `writer`'s new manifest, and `coach` REVIEW closes against the spec and
every amendment together.

**A second amendment on one slice states a stopping condition, a falsifier and a fallback.**
The stopping condition is a set of properties a reader can check without re-measuring. The
falsifier names the observation that means the shape is wrong rather than the wording. The
fallback says what to do instead of a further round. The seat does not run a further round
without all three.
```

**One new filename token, deliberately.** `spec.md` appears once in the block, where the file
itself is the subject of the rule. It resolves today and is on the known list
`artifact-name-tokens-break-when-done-empties` records; `pipelines.md` already cites it in the
step table, so this adds one instance to an exposure the board already holds. Every other
mention in the block says "the spec".

---

## Part 2 — `.claude/agents/coach.md`

Three replacements, each anchor unique in the file.

### 2a — widen the `description:` frontmatter

**Find:**

```
diverged. It also assesses
```

**Replace with:**

```
diverged. In either mode it authors any amendment to a signed spec, as its own numbered file the user re-signs; writer never amends. It also assesses
```

Keep `description:` on one line and add no quote character. The bare `writer` is deliberate: the
field carries no backticks today.

### 2b — give REVIEW mode the `pipelines.md` read trigger

The existing trigger is scoped to SPEC, and an amendment most often originates in REVIEW.

**Find:**

```
- **REVIEW** — you read the landed corpus against the signed spec and close the cycle, or
  report what diverged. No second user gate — the sign-off happened at SPEC.
```

**Replace with:**

```
- **REVIEW** — you read the landed corpus against the signed spec and close the cycle, or
  report what diverged. No second user gate — the sign-off happened at SPEC. Read
  `.claude/references/pipelines.md` before writing an amendment.
```

That takes the list item to three sentences, which is `Instruction.ListItemSentences`'s cap
exactly. Do not add a fourth.

### 2c — add the amendment bullet under `## Owns`

**Insert** immediately above the `- **Ruling scope.**` bullet, so the new bullet sits between
`- **The spec artifact.**` and `- **Ruling scope.**`.

**Insert, verbatim:**

```markdown
- **Spec amendments.** A signed spec changes only through a dated amendment you author as
  its own numbered file, in either mode. `writer` never amends, and the user re-signs
  because an amendment changes what only the user signed.
```

Three sentences including the bolded lead, which is what `Instruction.ListItemSentences` counts.
The `pipelines.md` pointer is absent here on purpose: 2b carries it, and a fourth sentence trips
the rule.

---

## Part 3 — `.claude/agents/articles/handoffs.md`

**Insert point.** Between the end of `## Defect adjudication` and the `## When blocked` heading.
One blank line above the new heading and one below the last line of the block.

That placement is load-bearing. The new rule generalises what `## Defect adjudication` does for
one pipeline's defect loop, and `## When blocked` stays last as the terminal escalation. The
block's own cross-reference points **up** to `## Concurrent slices`, which this placement keeps
above it.

**Insert, verbatim:**

```markdown
## Resolve a finding in the cycle that made it

**Prefer an in-cycle fix to a board candidate whenever the finding is the running slice's own
doing.** The worktree is open and the context is loaded. A candidate for a defect this slice
authored is deferred rework rather than a backlog item. The scope rule under Concurrent
slices still binds, so an in-cycle fix stays inside the slice's approved scope.

**File a candidate only for a finding the slice cannot resolve.** Two cases qualify: the fix
reaches outside the slice's write boundary, or it needs a ruling the slice has no authority
to make. A finding that is merely inconvenient is neither.

**Recommend the expansion with its cost. Never grant it.** Scope belongs to the user. Name
the files the fix adds, what re-runs because of them, and what the slice carries if the
expansion is declined.

**A pre-existing finding the slice did not create is out of scope by default.** Say so, and
say what made it visible.
```

---

## Part 4 — what is deliberately not changed

- **`## Escalation lanes, as pipeline interrupts` in `pipelines.md`.** Its lead sentence counts
  the lanes. An amendment is an enabler-process interrupt rather than one of those four
  seat-terminating lanes, and adding it would force an edit to a count for no gain.
- **CLAUDE.md.** Its `pipelines.md` pointer already reads "before composing any role
  invocation", which covers hiring `coach` to amend. No new routing fact exists.
- **The other eight role files.** R7 measured that the `handoffs.md` read reaches all of them.
- **`role-cycles.config.json`.** The declared roster is the bare cycle; an amendment adds no
  role and re-enters an existing step. `agent-doc-check`'s check 4 is unaffected.
- **Any retrofit of the two cycles that improvised the mechanism.** They are records.
- **`vale-styles/**` and `rules/*.yml`.** `architect`'s, and this spec recommends nothing there.

---

## Part 5 — execution and expected readings

`writer` runs these after the edits. Every "before" figure below was measured in this worktree on
2026-09-18, and every "after" figure was measured on a probe copy carrying the exact blocks in
Parts 1 to 3.

| Check                                      | Before                                     | Expected after                        |
| ------------------------------------------ | ------------------------------------------ | ------------------------------------- |
| `vale .claude/references/pipelines.md`     | 0 findings                                 | 0 findings                            |
| `vale .claude/agents/coach.md`             | 0 findings                                 | 0 findings                            |
| `vale .claude/agents/articles/handoffs.md` | 23 warnings                                | 23 warnings, the same lines           |
| `npm run agent-doc-check`                  | exit 0, 54 doc files, 8 agent files        | exit 0, same counts                   |
| `npm run reference-check`                  | exit 0, 524 files scanned, 3148 references | exit 0, 524 files, references only up |

**`vale sync` is the precondition for every Vale reading.** Without `.vale/` the run reports zero
findings through `prose-lint`'s `grep -c` pipeline exactly as a clean file does, so an unsynced
worktree turns a clean reading into a confident zero. This worktree is synced, which is why the
23 above is a real number rather than a zero.

**Read the three Vale readings as bounds, not as verdicts.** `Instruction.*` is off for both
`pipelines.md` and `handoffs.md` per `.vale.ini`, so neither file's register is machine-checked
at all; only `coach.md` carries the regrowth guard. Whether the prose says the right thing is
`editor` AUDIT's reading and mine at REVIEW.

**The 23 on `handoffs.md` is pre-existing and stays.** All 23 sit in text this slice does not
touch. Three of them move line number, on the article's last two finding-bearing lines, which
shift down by the block's height. The rule, the message and the column stay unchanged in all
three. A 24th finding is a failure of this spec; a 22nd means something was deleted.

**`agent-doc-check` and `reference-check` bound the edit rather than confirming it.**
`agent-doc-check` validates `coach.md`'s frontmatter whether or not 2a lands, and
`reference-check` resolves tokens whether or not the prose around them is right. Their value here
is narrow and real: 2a is the one edit that can break a frontmatter parse, and R2 rests on
`reference-check` never seeing the placeholder.

**Read `reference-check` directly, never through a pipe.** A pipeline replaces the program's exit
status with the pipe's own.

**Nothing in this slice can move a `src/` or `scripts/` gate.** The diff is three Markdown files
under `.claude/`. Do not run the mutation, coverage, or e2e suites for it.

---

## Part 6 — recommendations that flow out, for the seat to capture

None of these is an edit this spec authorizes. They are backlog recommendations.

1. **`the-board-hook-misfits-per-item-artifacts` gains a second instance.** The board hook
   applies the idea-file shape to every `backlog/**` write, and `amendment-<n>.md` is a new
   artifact kind that will misfit it exactly as the other per-item artifacts do. The existing
   item covers it; this adds a case rather than a new item.
2. **`artifact-name-tokens-break-when-done-empties` has a candidate general remedy.** R2's
   placeholder form is immune to the whole failure by construction. Whether `pipelines.md`'s
   existing `tasks.md` citation and its allow-marker should move to the same form is that item's
   call, and it is an `enabler-process` change to prose rather than a checker change.
3. **No new mechanical guard is recommended.** The one convention that could use a checker — that
   an amendment names everything it supersedes — turns on meaning, and a checker that guesses at
   it would report a confident pass. R3 records the gap instead.

---

## Sign-off

The user signs this spec before `writer` runs. Per R4, the mechanism in Part 1 binds this slice
from the moment of that signature.
