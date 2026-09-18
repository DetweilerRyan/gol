# Amendment 3 — 2026-09-18, the frontmatter residue

`coach`, slice `name-the-spec-amendment-and-the-in-cycle-fix-rule`, against tip `aa9cde2`.
**This amendment needs the user's re-sign-off before `writer` runs.**

One item, one clause, one file already in the manifest.

## Ruled first: is a third round permitted at all

Two tests, and they answer differently. Both are reported, because collapsing them is how a loop
gets one more round on a technicality.

**The falsifier has not fired.** Amendment 2's falsifier is a **third file** stating any one of
the six mechanisms after that amendment lands. This is not a third file. It is a second location
inside a file the ruling already reached, carrying the **pre-ruling** wording that C1's
body-scoped find and replace could not touch. Nothing generated a new instance under the ruling.
The register split is holding; its application was incomplete.

**Amendment 2's stopping condition is violated, and that is the decisive reading.** Property 1
reads "Each of the six rules has exactly one file stating its mechanism." `coach.md`'s
`description` states the artifact shape and the role pairing, so two files state them. The
condition says the work is not finished.

**An unmet stopping condition with an unfired falsifier is the case the two-part structure exists
for.** One says keep going; the other says stop and change shape. Only the second is a stop.

**The convergence check, because the letter of a rule is not evidence.** Round 1 found a routing
defect, a different class. Round 2 found the duplication and ruled it. Round 3 finds a single
residue of round 2's own edit, in the one location a body-scoped replacement cannot reach. A
literal search of `.claude/**` and CLAUDE.md today for every phrase the amendments removed —
`never amends`, `numbered file`, `dated amendment`, `re-signs`, `re-sign-off` — returns exactly
two hits: `pipelines.md`'s own source line, which is correct, and `coach.md`'s `description`,
which is the finding. The class is converging on zero rather than reproducing.

## Why not the two alternatives

**Not the pre-decided fallback.** Amendment 2's fallback deletes `coach.md`'s amendment **bullet**
and leaves two files carrying the rule. Applied here it would remove the body text that already
complies and leave the frontmatter clause that does not — backwards. The fallback answers a
failure of the register split, and the split has not failed. Item D2 corrects the fallback so it
cannot be applied that way later.

**Not accept-and-name, and the reason is not tidiness.** C1 left this file **disagreeing with
itself**. The frontmatter says `writer` never amends and names the numbered-file shape; the body
deliberately says neither, because both belong elsewhere. A reader comparing the two cannot tell
which is current, and the frontmatter is the copy no Vale rule and no checker reads for content.
Shipping a role file authored by this slice that contradicts itself is a worse residue than one
more single-clause round. **This slice created the contradiction at item 2a, so it is this
slice's to close.**

**The register argument for keeping a clause there still stands**, which is why this is a
narrowing and not a deletion. The seat reads `description` when it chooses whom to hire, and the
amendment trigger fires between steps when no pipeline table is open. You approved that reasoning
at 2a and nothing since has weakened it.

## What this supersedes, and nothing else

| Item                                          | Disposition                                  |
| --------------------------------------------- | -------------------------------------------- |
| Spec Part 2, item 2a (`coach.md` description) | Its amendment clause is replaced by D1 below |
| Amendment 2, Part E fallback                  | Extended by D2 below, not reversed           |

Everything else stands. No file is added: `coach.md` is already in the manifest.

## Part D — the items

### D1 — `.claude/agents/coach.md`, narrow the description's amendment clause

**Find,** inside the `description:` line:

```
In either mode it authors any amendment to a signed spec, as its own numbered file the user re-signs; writer never amends.
```

**Replace with:**

```
In either mode it authors any amendment to a signed spec and stops for the user's signature on it.
```

Keep `description:` on one line, add no quote character, and change nothing else in the field.

The same three things leave that C1 removed from the body, for the same reasons. **Its own
numbered file** is artifact shape and belongs to `pipelines.md`. **`writer` never amends** is the
other half of a pairing, and `writer.md` now carries its own side. **The user re-signs** becomes
`coach`'s own duty to stop, which is what a role file states. What survives is the routing fact
the seat needs at hire time: this role authors amendments.

### D2 — a correction to Amendment 2's fallback, for the record

Amendment 2's fallback names `coach.md`'s amendment **bullet** only. It was written before this
residue was known and would leave the frontmatter clause standing. **Read it as: delete the
bullet and the description's amendment clause together.** This is a correction to a pre-decided
plan, not a corpus edit, and it changes nothing `writer` executes.

## Part E — stopping condition, falsifier, fallback

**The stopping condition is now a literal search rather than a reading**, which is strictly
stronger than what Amendments 1 and 2 could state. The residue class is a fixed set of phrases
this slice removed, so it is mechanically checkable within the slice even though no gate checks
it.

**Stopping condition.** After D1, a search of `.claude/**` and CLAUDE.md for `never amends`,
`numbered file`, `dated amendment`, `re-signs` and `re-sign-off` returns exactly one hit:
`pipelines.md`'s own source line. No other file or field, prose or YAML, states any of the six
mechanisms.

**Falsifier.** If any further instance turns up after D1 lands — in any file, in any field — the
split is not carrying the load and the defect is the shape. **Do not write Amendment 4.** Apply
the fallback instead.

**Fallback, carried forward and corrected by D2.** Delete `coach.md`'s amendment bullet and its
description clause together, leaving `pipelines.md` and `writer.md` as the only two files. The
cost is accepted and unchanged: a `coach` invocation would learn it may amend only by opening
`pipelines.md`, which both of its mode bullets already require, and the seat would lose the
hire-time routing fact. Two files cannot disagree about a fact only one of them states.

## Part F — expected readings

Measured today on a probe copy carrying D1 exactly, then deleted.

| Check                          | At tip `aa9cde2`                 | Expected after D1                 |
| ------------------------------ | -------------------------------- | --------------------------------- |
| `vale .claude/agents/coach.md` | 0                                | 0                                 |
| `npm run agent-doc-check`      | exit 0, 54 doc, 8 agent, 31 rule | exit 0, same counts               |
| `npm run reference-check`      | exit 0, 524 files, 3,151 refs    | exit 0, 524 files, refs unchanged |

**`agent-doc-check` matters more here than anywhere else in this slice.** A frontmatter edit is
the one edit that can break the field's parse, and this checker reads that field with a bespoke
line-anchored reader rather than a YAML parser. Exit 0 on the probe is what makes D1 safe to
execute.

**Vale reaches this field.** A probe earlier in this slice put a contraction into the same line
and `STE.Contractions` reported it, so the 0 above is a real reading of the replacement text
rather than an unlinted surface.

`vale sync` remains the precondition for every Vale reading.

## Re-sign-off

The user signs this amendment before `writer` runs. The cycle then re-enters at step 2, scoped to
`coach.md` alone.
