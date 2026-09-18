# Amendment 1 — 2026-09-18, after `coach` REVIEW round 1

`coach`, slice `name-the-spec-amendment-and-the-in-cycle-fix-rule`, against tip `6f8ecbf`.
**This amendment needs the user's re-sign-off before `writer` runs again.**

This is the first use of the mechanism this slice is landing. Per R4 of the signed spec, the
mechanism binds this slice from the moment of the signature, so the vehicle is this file rather
than an edit to `spec.md`. The spec's bytes are untouched.

## What this supersedes, and nothing else

| Spec item                                    | Disposition                                                   |
| -------------------------------------------- | ------------------------------------------------------------- |
| Part 3, the `handoffs.md` block              | Two paragraphs replaced verbatim by item A1 below             |
| Part 1b, the `pipelines.md` block            | One sentence added by item A2 below                           |
| Part 1a, the mermaid edges                   | One edge label changed by item A4 below                       |
| Part 4, the bullet declining the lane census | Superseded by item A3 below; the census is edited after all   |
| R7                                           | Narrowed by the correction below; its conclusion still stands |

Everything else in the signed spec stands unchanged: R1 through R6, Part 2's three `coach.md`
items, Part 5's readings, and Part 6's recommendations. No other spec item is touched, and this
amendment supersedes nothing it has not named here.

## The diagnosis, because it decides whether a second round is worth running

**Thirteen findings. Six of them are one defect, and I authored it.**

The `handoffs.md` section I specified is a **third routing table** in a corpus that already has
two. `Defect adjudication` routes an outside-manifest finding, `workflow.md`'s failure conditions
route the same case, and my section routed it a third way — while also granting roles a board
write no role holds, and omitting the `coach` route this same slice was landing. Findings A, B,
C and F are four readings of that one mistake.

Findings D and G are a second, smaller class: two halves of one rule written in two files without
being checked against each other, and a count I explicitly declined to touch that my own text
made incomplete.

The remaining seven are pre-existing corpus conditions my new vocabulary made visible. They are
disposed of below and none is fixed here.

### The stopping condition

My landed rule triggers this at the **second** amendment. `editor` asked for it at the first, and
that is the right call — this corpus has one worked case of a loop that ran three rounds before
anybody wrote a stopping rule down, and I am the one who wrote that lesson. Four properties, all
checkable by reading rather than by re-measuring. After Amendment 1 the slice should satisfy all
four.

1. No line in the slice's manifest tells a role to write the board. A1 is what makes this true.
2. Every disposition for an outside-scope finding reads the same in `handoffs.md`, in its own
   `Defect adjudication` table, and in `workflow.md`. A1 is what makes this true.
3. Every count in `pipelines.md`'s escalation section stands beside a complete, adjacent
   enumeration in the same section. A3 is what makes this true.
4. Every rule this slice lands that binds a role by name is reachable from that role's own
   reading path. B1 is what makes this true, and it is the only scope expansion here.

### The falsifier

**If `editor` finds, in Amendment 1's own text, either a fourth disposition for the
outside-scope case or a second instruction granting a role a board write, do not write Amendment 2.** That would be the second attempt to keep three routing tables in agreement by wording, and
the evidence would then say the shape is wrong rather than the wording.

### The fallback, decided now rather than under pressure

Cut the `handoffs.md` section to its first and last paragraphs — the in-cycle preference and the
pre-existing-finding default — and delete the disposition paragraphs outright. `Defect
adjudication` and `workflow.md` then stay the single source for where a finding goes, and the
section keeps only what no other file says. That removes the third table instead of maintaining
it. Record the deletion as a board recommendation for a later slice that reconciles routing in
one place.

---

## Part A — in-cycle items, inside the signed manifest

Four edits across two files already in the slice's manifest. No file is added.

### A1 — `.claude/agents/articles/handoffs.md`, replace two paragraphs

**Find,** in `## Resolve a finding in the cycle that made it`:

```markdown
**File a candidate only for a finding the slice cannot resolve.** Two cases qualify: the fix
reaches outside the slice's write boundary, or it needs a ruling the slice has no authority
to make. A finding that is merely inconvenient is neither.

**Recommend the expansion with its cost. Never grant it.** Scope belongs to the user. Name
the files the fix adds, what re-runs because of them, and what the slice carries if the
expansion is declined.
```

**Replace with:**

```markdown
**Report a finding the slice cannot resolve. Never file it yourself.** No role reads or
writes the board, so a candidate is the seat's act on your recommendation. Report and stop,
which is the disposition Defect adjudication and `workflow.md` already give this case.

**Name the route with the finding.** A finding that needs a ruling you cannot make goes to
the role that can rule it. A process-corpus contradiction goes to `coach`, which can amend a
signed spec and re-enter the cycle. Recommend the board only where no open route resolves
it.

**Recommend the expansion with its cost. Never grant it.** Scope belongs to the user. Name
the files the fix adds, what re-runs because of them, and what the slice carries if the
expansion is declined.
```

The first and last paragraphs of the section are unchanged. This closes findings A, B, C and F
together: the role's act becomes report-and-recommend, the disposition matches the two tables
that already exist, and the `coach` route the slice landed is named where a role will read it.

### A2 — `.claude/references/pipelines.md`, give the amendment a date slot

`coach.md` requires a **dated** amendment and the `pipelines.md` file-shape rule had no date in
it. Both halves are mine.

**Find:**

```markdown
writing order.** The spec is immutable once the slice starts, so the signed bytes stay the
signed bytes.
```

**Replace with:**

```markdown
writing order.** It opens with its number and the date it was written. The spec is
immutable once the slice starts, so the signed bytes stay the signed bytes.
```

### A3 — `.claude/references/pipelines.md`, add the missing escalation lane

**Find** the sentence `Four lanes terminate at the seat.` and change `Four` to `Five`.

**Then find** the final bullet of that section:

```markdown
- **`hardener`, a gate failure outside the slice manifest** — reports and stops. The failure is
  a pre-existing break on `main` or something a rebase brought in, and both belong to the seat.
```

**Append** this bullet after it:

```markdown
- **`writer`, a spec point it cannot execute** — it returns the point and stops. The seat hires
  `coach` to amend, per Amending a signed spec above.
```

This reverses the spec's Part 4 ruling, and the reversal is the point. The lane pre-dated my
slice, and I declined to touch the census on the ground that editing a count buys nothing. My own
text then put "returns it and stops" into the same file, which is what makes the incompleteness
visible to a reader. The repair is one word and two lines inside a manifest file, and the count
still stands beside a complete, adjacent enumeration, which is the form `claim-discipline.md`
permits.

### A4 — `.claude/references/pipelines.md`, relabel one mermaid edge

**Find** `  W -.->|returned spec point| A` and replace with `  W -.->|spec gap found| A`.

The prose names two ways this edge fires: `writer` returns a point, or the seat finds the spec
under-specifies one. The old label named only the first.

---

## Part B — the one scope expansion, with its cost

### B1 — `.claude/agents/writer.md`, one bullet under `## Boundaries`

**This adds a file the signed spec did not name.** Per the rule this slice is landing, I
recommend it with its cost and do not grant it. The user's signature on this amendment is the
grant.

**Find:**

```markdown
- Never write `src/`, `scripts/`, `features/`, `rules/`, or `vale-styles/`.
```

**Replace with:**

```markdown
- Never edit a signed spec or an amendment, even though the board docs sit in your write
  surface. `coach` authors every amendment, and a spec point you cannot execute goes back as
  a finding.
- Never write `src/`, `scripts/`, `features/`, `rules/`, or `vale-styles/`.
```

**Why it is worth the expansion.** `pipelines.md` and `coach.md` both say `writer` never amends,
and `writer.md` names neither file as a read trigger. Meanwhile `writer.md`'s own description
lists "the board docs" in its write surface, and a signed spec is a board doc in the folder
`writer` works out of. So the corpus currently grants in the role file what it forbids in two
files the role never opens. That is the one failure mode a rule of this kind has.

**The cost, named.** One file added to `writer`'s manifest and to `editor` CLEAN's scope. One
more `prose-lint` subject, on a surface where `Instruction.*` is enabled — measured on a probe
copy today at 0 findings, with the new bullet at three sentences against the rule's cap of three.
`agent-doc-check` re-runs and reported no failure on the probe.

**If you decline it**, the slice carries a role file that permits what two other files forbid.
The mitigation is weak but real: `writer.md` already says it edits only the files the spec names,
and a spec never names its own amendment. The recommended alternative is then a board item, and
the finding stays open for however long that takes.

**Not proposed: narrowing the `description:` frontmatter.** The body bullet is what binds a
running `writer`, and the description is a routing blurb the seat reads. Changing both doubles
the edit for one fact.

---

## Part C — disposition of all thirteen findings

`editor` routed thirteen to me and the in-scope split was mine to rule. Six are fixed here, none
is deferred to the board as rework, and seven are ruled out of scope as pre-existing with the
reason stated.

| Finding | Ruling                                                                                                                                    |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| A       | **In-cycle, A1.** I created it. Two dispositions for one case, fifteen lines apart in one article                                         |
| B       | **In-cycle, A1, without editing `workflow.md`.** A1 makes the new section agree with it, so the third disposition disappears              |
| C       | **In-cycle, A1.** The sharpest of the thirteen: I granted an act no role holds, in the file every role reads                              |
| D       | **In-cycle, A2.** Both halves are in my signed spec, so this is not a `writer` deviation                                                  |
| E       | **In-cycle by expansion, B1.** The only file added, and the user's re-sign-off is the grant                                               |
| F       | **In-cycle, A1.** The section routed to the board the exact class this slice built the amendment to resolve                               |
| G       | **In-cycle, A3**, reversing the spec's Part 4. The lane pre-dated the slice; my text is what made the census visibly incomplete           |
| H       | **Out of scope, pre-existing.** `orchestration.md` and CLAUDE.md disagree about who edits a role file, and that is a conduct ruling       |
| I       | **Out of scope, pre-existing.** `workflow.md` carries the same pre-process-pipeline model and is the authority H cites                    |
| J       | **Out of scope, pre-existing.** `definition-of-ready.md`'s slice check is a board-intake predicate, outside this manifest                 |
| K       | **Out of scope, pre-existing.** The `idea-capture` skill is board intake, same subject as J                                               |
| L       | **In-cycle, A4.** One edge label, one token, already in the manifest                                                                      |
| M       | **Ruled out, not a defect.** Two artifacts with different supersession protocols is not a contradiction while nothing cites them together |

**H and I are the case my own new rule describes exactly.** The vocabulary collision is cosmetic
and could be fixed cheaply. The substantive half cannot: whether the seat may edit a role file
directly, against CLAUDE.md's 2026-09-17 ruling, is a conduct ruling this slice has no authority
to make. That is the second qualifying case, so it is recommended rather than taken, and the
route is `coach` in a slice of its own rather than the board's general queue.

**Recommendations that flow out of this amendment**, for the seat to capture, each with its cost:

1. **One `enabler-process` item covering H and I.** `orchestration.md`'s guardrail section and
   `workflow.md`'s role-file model both pre-date the process pipeline, and `orchestration.md`
   uses "amend" for a different act than this slice's term of art. Cost: two heavily-read files,
   and a user ruling on seat authority before any wording can be drafted.
2. **One item covering J and K.** Neither `definition-of-ready.md`'s slice check nor
   `idea-capture` asks whether the running slice could have fixed the finding, so the in-cycle
   rule has no counterpart at intake. Cost: one reference file and one skill, plus a new
   predicate that has to be anchored rather than asserted.
3. **M needs nothing** unless a future file cites `adr/README.md`'s correction path and the
   amendment rule together. Recorded so the next reader does not rediscover it.

---

## Part D — a correction to my own record

`editor` asked whether R7 reached the user with the `writer` half of finding E visible. **It did
not, and the fault is mine.**

R7 asked one question: does `handoffs.md` reach every role that files candidates. I read the
eight role files for the four-article read trigger, found it in all eight, and reported "no role
file changes". That answer was true for the question I asked. I then let it stand as though it
answered a wider one — is every rule this slice lands reachable by the role it binds — which it
never tested. The amendment rule binds `writer` by name, in two files `writer.md` does not name,
and nothing in R7 looked for that.

The conclusion of R7 survives: `handoffs.md` does reach every role, and the candidate rule needs
no per-role line. Its scope is what was overstated. B1 is the repair for what it missed.

---

## Part E — expected readings

Measured today on probe copies carrying the exact blocks in Parts A and B, then deleted.

| Check                                      | At tip `6f8ecbf` | Expected after this amendment |
| ------------------------------------------ | ---------------- | ----------------------------- |
| `vale .claude/agents/articles/handoffs.md` | 23 warnings      | 23 warnings, all pre-existing |
| `vale .claude/references/pipelines.md`     | 0                | 0                             |
| `vale .claude/agents/writer.md`            | 0                | 0                             |
| `vale .claude/agents/coach.md`             | 0                | 0, untouched                  |
| `npm run agent-doc-check`                  | exit 0           | exit 0                        |
| `npm run reference-check`                  | exit 0           | exit 0                        |

`vale sync` remains the precondition for every Vale reading. An unsynced worktree reports zero
through `prose-lint`'s `grep -c` pipeline exactly as a clean file does.

**A first draft of A1 measured 24.** One replacement sentence ran to 33 words; splitting it in
two returned the file to 23. The figure above is the split version.

**These readings bound the work; they do not decide it.** `Instruction.*` is off for both
`handoffs.md` and `pipelines.md`, so neither file's register is machine-checked. Whether the
routing now agrees across three files is a reading, and it is the stopping condition's job.

---

## Re-sign-off

The user signs this amendment before `writer` runs again. The cycle then re-enters at step 2,
scoped to `handoffs.md`, `pipelines.md`, and — if B1 is granted — `writer.md`.
