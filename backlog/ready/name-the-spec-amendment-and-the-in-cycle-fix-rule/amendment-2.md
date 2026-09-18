# Amendment 2 — 2026-09-18, the single-source ruling

`coach`, slice `name-the-spec-amendment-and-the-in-cycle-fix-rule`, against tip `6f8ecbf`.
**This amendment needs the user's re-sign-off before `writer` runs.**

## Why this is a second file rather than an edit to Amendment 1

Amendment 1 is signed. The principle it carries is that signed bytes stay signed, and that
principle cannot exempt the file that states it. So the ruling lands here.

**The landed rule does not actually say this, and that is a hole first use found.**
`pipelines.md` says "The spec is immutable once the slice starts" and says nothing about an
amendment. Item C2 closes it.

## What this supersedes, and nothing else

| Item                                  | Disposition                                                      |
| ------------------------------------- | ---------------------------------------------------------------- |
| Spec Part 2, item 2c (`coach.md`)     | Replaced verbatim by C1 below                                    |
| Amendment 1, item A2 (`pipelines.md`) | Replaced verbatim by C2, which also closes the immutability hole |
| Amendment 1, item B1 (`writer.md`)    | Replaced verbatim by C3 below                                    |
| Amendment 1, Part C recommendation 1  | Its vocabulary half is withdrawn; its substantive half stands    |

Everything else stands: R1 through R6, spec items 1a, 1b, 2a, 2b, 3, and Amendment 1's items
A1, A3, A4 and the rest of Part C. Nothing else is touched.

**No file is added.** `coach.md`, `pipelines.md` and `writer.md` are all already in the
manifest, `writer.md` by the user's grant of B1. This ruling therefore sits inside what
Amendment 1's stopping condition permits, and does not widen the slice.

## The diagnosis

**With B1 granted, one fact was about to sit in three files.** "The signed spec is never edited
and `writer` never authors an amendment" would have been in `pipelines.md`, `coach.md` and
`writer.md` at once. My own placement argument was that two files cost less than one fact in the
wrong register. A third copy is where that argument stops being free, and the user is right that
this repo has already paid that bill once: the mutation-invariance allowlist lived in three files,
drifted, and was cured by one home plus an explicit "not restated here".

**The discriminator already exists and I did not apply it.** `pipelines.md`'s own header rules
the split: it is the single source for **between-invocation** facts, and a role file is the
single source for its own **within-invocation** facts, which is why its gates column cites a role
file rather than restating one. The symmetric obligation runs the other way and nothing was
enforcing it: a role file states its own act and must not restate the mechanism.

**Measured against that discriminator, three signed texts fail it.** Each carries mechanism
detail that belongs to `pipelines.md`, and one carries a clause its own file already states in
the bullet directly above the insertion point.

## The register ruling, rule by rule

For each rule: which file is the source, and what shape every other file takes.

| Rule                                                      | Source         | Every other file                                                                                                                                     |
| --------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| The signed spec is never edited after sign-off            | `pipelines.md` | `writer.md` a bare prohibition on its own act; `coach.md` nothing                                                                                    |
| An amendment is numbered, dated, names what it supersedes | `pipelines.md` | Nothing anywhere. This is artifact shape, and no role acts on it without reading the source                                                          |
| `coach` authors; `writer` never does                      | `pipelines.md` | Split by half: `coach.md` states its own duty positively and never names `writer`; `writer.md` states its own prohibition and never names authorship |
| Re-entry at step 2 after re-sign-off                      | `pipelines.md` | Nothing. Pure control flow between invocations                                                                                                       |
| The stopping rule at a second amendment                   | `pipelines.md` | Nothing. `coach.md`'s two mode bullets already carry the read trigger that reaches it                                                                |
| Resolve a finding in the cycle that made it               | `handoffs.md`  | Nothing new. Item A1 already made it cite `Defect adjudication` and `workflow.md` instead of restating them                                          |

**The pairing stays with `pipelines.md` deliberately.** A boundary between two roles is
between-invocation by definition — neither role file can own half a pairing without the other
half drifting out of view. What each role file keeps is its own side of it, in its own voice.

**Why `coach.md` keeps a bullet at all.** A role must know it may amend before it goes looking
for how. That is a duty, not a mechanism, and it is the one thing the source file cannot supply
to a role that has not yet been told to open it.

**Why `writer.md` keeps a prohibition rather than a pointer.** A pointer would need a read
trigger `writer.md` does not have, which is exactly the hole finding E named. A boundary a role
can act on without leaving its own file is the only shape that closes it.

**No "not restated here" note is added to `pipelines.md`.** The merge-protocol precedent used one
because nothing else said it. Here the file's own header already states the split, so a
per-section note would be a fourth copy of the rule against copies.

## Part C — the three items

### C1 — `.claude/agents/coach.md`, narrow the amendment bullet

**Find:**

```markdown
- **Spec amendments.** A signed spec changes only through a dated amendment you author as
  its own numbered file, in either mode. `writer` never amends, and the user re-signs
  because an amendment changes what only the user signed.
```

**Replace with:**

```markdown
- **Spec amendments.** A signed spec changes only through an amendment you author, in either
  mode. Stop for the user's signature on it, exactly as you do on the spec.
```

Three things leave. **Dated** and **its own numbered file** are artifact shape, owned by
`pipelines.md` and reachable from both of this file's mode bullets. **`writer` never amends** is
the other role's half of a pairing, and C3 gives `writer` its own. The gate becomes a duty in
`coach`'s own voice — stop for the signature — rather than a restatement of the gate itself, and
it points at the rule this file already carries for the spec.

### C2 — `.claude/references/pipelines.md`, supersede A2 and close the immutability hole

This replaces Amendment 1's item A2. Execute this one instead; do not execute A2.

**Find:**

```markdown
writing order.** The spec is immutable once the slice starts, so the signed bytes stay the
signed bytes.
```

**Replace with:**

```markdown
writing order.** It opens with its number and the date it was written. The spec and every
signed amendment are immutable once the slice starts, so the signed bytes stay the signed
bytes.
```

A2's date sentence survives unchanged. What is added is the three words that make the rule cover
its own instances — the hole this cycle walked into when the ruling arrived after Amendment 1 was
signed.

### C3 — `.claude/agents/writer.md`, narrow the granted bullet

This replaces Amendment 1's item B1. The user granted `writer.md` into the manifest; this changes
only the text that lands there.

**Find:**

```markdown
- Never write `src/`, `scripts/`, `features/`, `rules/`, or `vale-styles/`.
```

**Replace with:**

```markdown
- Never edit a signed spec or an amendment, even though the board docs sit in your write
  surface. Both are `coach`'s artifacts, not yours.
- Never write `src/`, `scripts/`, `features/`, `rules/`, or `vale-styles/`.
```

Two clauses leave B1's text. **"`coach` authors every amendment"** was the third copy of the
pairing; what remains is an ownership clause, which is the one-clause why the house style allows
beside a rule. **"a spec point you cannot execute goes back as a finding"** was already in this
file as the first bullet of the same section, directly above the insertion point: "A spec that is
silent or contradictory on a point goes back to `coach` as a finding." That is the duplication
`prose.md` bars, inside one file and one section, and I wrote it.

## Part D — the corpus check the user asked for

**Searched the whole instruction corpus for a pre-existing statement of any of the six rules:**
`.claude/agents/`, `.claude/references/`, `.claude/skills/` and CLAUDE.md, for "signed spec",
"re-sign" and "amend", sidecars excluded. **None of the six is stated anywhere this slice did not
touch.** The nearest neighbour is CLAUDE.md's no-role-edits bullet, which says `writer` edits the
corpus only to execute a signed `coach` spec. That is about corpus authority, not about the spec
artifact's lifecycle, and it neither states nor contradicts any rule here.

**One correction to Amendment 1, from the same search.** I recommended a board item partly on a
vocabulary collision: `orchestration.md` uses "amend" for a different act. The search found four
pre-existing uses of the word — `orchestration.md`, `workflow.md`, `coder.md` for a `.feature`,
and `architect.md` for a tag table. **"Amend" is ordinary English in this corpus, not a contested
term of art**, so the collision half of that recommendation is withdrawn. Its substantive half is
untouched and still stands: `orchestration.md` instructs the seat to edit a role file directly,
against CLAUDE.md's 2026-09-17 ruling, and that is a conduct ruling for its own slice.

## Part E — stopping condition, falsifier, fallback

**This is the second amendment on this slice, so the rule this slice landed fires on itself.**
First live test of it.

**Stopping condition.** Three properties, checkable by reading:

1. Each of the six rules has exactly one file stating its mechanism, as the table above assigns
   it.
2. Every other file that mentions a rule states only its own role's act, and states no part of
   the artifact's shape or of the pipeline's control flow.
3. No file is added to the manifest beyond the three already in it.

**Falsifier.** If `editor` finds a third file stating any one of the six mechanisms after this
amendment lands, the register split is not carrying the load, and the defect is the shape rather
than the wording. **Do not write Amendment 3.**

**Fallback, decided now.** Delete `coach.md`'s amendment bullet outright and let `pipelines.md`
and `writer.md` be the only two files. The cost is real and accepted: a `coach` invocation would
then learn it may amend at all only by opening `pipelines.md`, which both of its mode bullets
already require it to do. Two files cannot disagree about a fact only one of them states.

## Part F — expected readings

Measured today on probe copies carrying C1 and C3 exactly, then deleted. C2 is one sentence into a
file measured at 0 findings both before and after A2.

| Check                                  | At tip `6f8ecbf` | Expected after C1 to C3 |
| -------------------------------------- | ---------------- | ----------------------- |
| `vale .claude/agents/coach.md`         | 0                | 0                       |
| `vale .claude/agents/writer.md`        | 0                | 0                       |
| `vale .claude/references/pipelines.md` | 0                | 0                       |
| `npm run agent-doc-check`              | exit 0           | exit 0                  |
| `npm run reference-check`              | exit 0           | exit 0                  |

`vale sync` remains the precondition. **These bound the work and do not decide it** — no enabled
rule can see a duplicated fact across two files, which is why this ruling is a reading and why
the stopping condition above is phrased for a reader rather than for a checker.

**A mechanical guard is not recommended.** Detecting that two files state one rule needs a
judgement about meaning, and a checker guessing at it would report a confident pass. The gap is
recorded rather than papered over.

## Re-sign-off

The user signs this amendment before `writer` runs. The cycle then re-enters at step 2, scoped to
`coach.md`, `pipelines.md` and `writer.md`. `writer` executes Amendment 1's items A1, A3 and A4
together with C1, C2 and C3, and does **not** execute the superseded A2 or B1.
