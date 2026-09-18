# Spec — record-two-rules-the-amendment-cycle-surfaced

`coach` SPEC, 2026-09-18, against tip `bfabbb5`. **This spec needs the user's sign-off before
`writer` runs.**

Four items across three files. Two rules, one heading count that moves with one of them, and the
evidence half of the second rule.

**Every verbatim block below is fenced as `text`, not as `markdown`, and that is load-bearing.**
Prettier formats embedded code inside a `markdown` fence. The first draft of this spec was written
that way, and `prettier --write` dedented item B2's list continuations inside the fence — the exact
list-structure damage `prose.md` records under "How a pass damages the file it cleans". Copy each
block byte for byte, including every leading space.

**Each Find block starts and ends on a whole line of the target file.** Where that leaves a
sentence cut off mid-clause, the cut is the file's own line break rather than a truncation. Every
block below was applied to the tree and reverted, so each anchor is known to match exactly once.

## What this spec settles, before the items

**The open question about `editor`, ruled: the block-disclosure rule binds `coach` alone.**
`editor` CLEAN's prompt carries `writer`'s manifest and the mode, per `pipelines.md`'s step-3 row
— not the signed spec. So `editor` cannot perform the check as a duty without a change to the
invocation contract, and its own boundary is to preserve meaning rather than to rule on it.
`editor` performing it unprompted on `name-the-spec-amendment-and-the-in-cycle-fix-rule` was a role
exceeding its contract usefully, which is not the same as owing it. Item A1 therefore names `coach`
as the actor in the rule text, which settles the question in the corpus and adds no fourth file.
Making it a second pair of eyes would mean carrying the signed spec into every step-3 prompt, and
that is a `pipelines.md` contract change this slice does not buy.

**The proposal's other flag, checked: the confident-zero list does state its own count.** The
heading reads `## Eleven ways a run reports a confident zero`. Item B1 moves it to `Twelve`, in the
same edit that lands item B2. A count standing beside its own complete enumeration is the form
`claim-discipline.md` keeps, so the numeral stays and moves rather than being dropped.

**The new entry is appended as 12 rather than inserted beside item 4, and the reason is
citations.** `prose.md` itself cites items by number four times, `prose.meta.md` cites `item 4` and
`confident-zero item 9`, and `testing-layers.meta.md` cites the section by name precisely because
it has grown twice. Appending leaves every existing number stable. Inserting would silently
invalidate six citations across three files.

**What counts as an obligation is not re-defined here.** `prose.md` already names four shapes under
"How a pass damages the file it cleans", and A1 points at them rather than restating them —
`prose.md`'s own rule against a restatement beside a pointer.

## Obligations disclosure, applied to this spec

The rule A1 lands, applied to the spec that lands it. **One item replaces a block: B1, a single
heading line.** The obligation that line carries is its count, and the replacement carries the same
count, corrected. Nothing else is in it. **A1, B2 and C1 are insertions and replace nothing**, so
no obligation can leave through them.

## Part A — `.claude/references/pipelines.md`

### A1 — the block-disclosure rule

**Find**, in `### Amending a signed spec`:

```text
the next amendment lands.

**Every amendment needs the user's re-sign-off.** An amendment changes something only the
```

**Replace with:**

```text
the next amendment lands.

**An amendment that replaces a block names every obligation the block carried that the
replacement does not.** A supersession row is true at block granularity and cannot show a
sentence leaving inside the block. So `coach` reads the replaced text against the replacement,
and records each dropped obligation as restored or as ruled out. The shapes to look for are the
four in `prose.md`, under "How a pass damages the file it cleans".

**Every amendment needs the user's re-sign-off.** An amendment changes something only the
```

Change nothing else in the section. The placement is deliberate: after the supersession paragraph,
because it qualifies that paragraph's disclosure, and before the re-sign-off paragraph, because the
disclosure is what the user signs against.

## Part B — `.claude/agents/articles/prose.md`

### B1 — the list's own count

**Find:**

```text
## Eleven ways a run reports a confident zero
```

**Replace with:**

```text
## Twelve ways a run reports a confident zero
```

### B2 — the twelfth entry

**Find**, the tail of item 11 and the comment below it. The four leading spaces on the first line
are part of the anchor:

```text
    header.

<!-- reference-check: allow text.comment.documentation.ts -- a Vale scope selector that does not exist, named here as the measured example; not a path -->
```

**Replace with:**

```text
    header.
12. **The path was absolute, so it matched no section glob.** `.vale.ini`'s globs are
    repo-relative, so Vale applies no style, reports `in 0 files` and exits 0. That is number 4
    reached through the path you typed rather than through where the file sits. Run `vale` from
    the repo root, name a repo-relative path, and read the file count.

<!-- reference-check: allow text.comment.documentation.ts -- a Vale scope selector that does not exist, named here as the measured example; not a path -->
```

There is no blank line between `header.` and `12.`, and the continuation lines carry a four-space
indent, matching items 10 and 11. Both are load-bearing for the list structure, and
`prettier --check` stays green over a list this edit breaks. The marker line is 14 words, under
`Procedure.ProcedureLength`'s cap of 20.

## Part C — `.claude/agents/articles/prose.meta.md`

### C1 — the evidence half

**Append** to the end of the file, after the section headed "Why `Procedure.ProcedureLength` was
left measuring the marker line alone (2026-09-18)", separated by one blank line:

```text
## `vale` given an absolute path lints nothing (2026-09-18)

Measured on vale 3.20.0 in the `record-two-rules-the-amendment-cycle-surfaced` worktree, with
`.vale/` synced and the cwd at the repo root:

| command                                              | summary line                                         | exit |
| ---------------------------------------------------- | ---------------------------------------------------- | ---- |
| `vale .claude/agents/articles/prose.md`              | `0 errors, 5 warnings and 0 suggestions in 1 file.`  | 0    |
| `vale "$PWD/.claude/agents/articles/prose.md"`       | `0 errors, 0 warnings and 0 suggestions in 0 files.` | 0    |
| `vale perf/README.md`, relative and out of scope     | `0 errors, 0 warnings and 0 suggestions in 0 files.` | 0    |
| `vale .claude/agents/articles/prose.meta.md`, exempt | `0 errors, 0 warnings and 0 suggestions in 1 file.`  | 0    |

Rows 2 and 3 read identically, which is the whole finding: an absolute path is confident-zero
item 4 reached through the path rather than through where the file sits. Row 2 also carries the
clean tick glyph rather than the cross, so the line reads as a pass.

Row 4 is the discriminator that makes the file count worth reading. An exempt file is still
counted as linted, so `in 1 file` separates a file Vale styled with nothing from a file no
section reached at all.

`coach` hit row 2 on the first probe of `name-the-spec-amendment-and-the-in-cycle-fix-rule` and
switched to relative paths before taking a reading. No reading in that slice's four amendments
rests on it.

**A relative path from a subdirectory fails loudly instead.** Run from `.claude/agents/`, Vale
resolves `StylesPath` against the cwd, prints `E201 Invalid value` naming `.vale`, and exits 2 —
the same reading "What a missing `.vale/` actually reports" records. So the instruction names the
repo root for one command's sake, not against a second silent failure.
```

**The last paragraph is a ruling the user may strike.** The subdirectory case is one measurement
wider than the proposal's "the glob mechanism and the exit code". It is in because it is the
evidence behind the word `repo-relative` in B2 — without it a reader cannot tell whether a
subdirectory run is a second silent hazard. Striking it costs the reader that, and nothing else.

## Expected readings, measured rather than predicted

Measured on 2026-09-18 by applying A1, B1, B2 and C1 to the working tree at tip `bfabbb5`, taking
the readings, and reverting. Every Vale reading was taken with a repo-relative path from the repo
root, per B2.

| Check                                        | At tip `bfabbb5`                   | Measured with the four items applied   |
| -------------------------------------------- | ---------------------------------- | -------------------------------------- |
| `npm run reference-check`                    | 524 files, 3,151 refs, no failures | 524 files, **3,156** refs, no failures |
| `npm run agent-doc-check`                    | 54 docs, 8 agents, 31 rules, clean | unchanged, clean                       |
| `npm run prose-lint`, total findings         | 165                                | **165** — the items add none           |
| `vale .claude/references/pipelines.md`       | 0 warnings in 1 file               | 0 warnings in 1 file                   |
| `vale .claude/agents/articles/prose.md`      | 5 warnings in 1 file               | the same 5, shifted 4 lines            |
| `vale .claude/agents/articles/prose.meta.md` | 0 in 1 file, by exemption          | 0 in 1 file, by exemption              |
| `npx prettier --check` on the three files    | clean                              | clean, with no reflow                  |

**Read the `prose.meta.md` row as a confident zero, not as a pass.** `.vale.ini`'s final
`[**/*.meta.md]` section switches every rule off by name, so no sentence in C1 is linted. The
`in 1 file` count is what separates that exemption from a run that reached no file at all, which is
the distinction C1 itself records.

**`prose.md`'s five residual warnings are pre-existing and out of scope.** Four are
`STE.Contractions` on documented exempt classes — two mentions of `Don't` and two bare possessives.
One is a `Procedure.OneInstruction` in the "Instruction stays" section, on `, then apply a floor`.
It is not this slice's doing and not this slice's to fix. Do not report it as introduced, and do
not clear it.

## Out of scope, and each is a refusal rather than an omission

- **`prose.md`'s census divergences from `.vale.ini`.** Filed as
  `prose-md-has-drifted-from-vale-ini`, which owns them. `writer` adds B2 and corrects B1's numeral,
  and touches no other count in the file.
- **`prose-lint -- --scope <file>`.** It exits 1 and refuses, so it is a usage trap rather than a
  silent zero, and `prose.md` already documents it under Setup. Folding it into item 12 would teach
  a reader that a scoped path reports zero silently, which is false.
- **A mechanical guard that refuses an absolute path.** `scripts/prose-lint/` could reject one, and
  that is an `enabler-technical` recommendation this slice carries out through the handoff rather
  than building. No script, rule or config changes here.
- **`editor.md`.** No new duty lands on it — see the ruling above.
- **Renumbering the confident-zero list.** See the citation argument above.

## The amendment path

The amendment mechanism is live in the corpus. If this spec needs changing after sign-off, it
changes through `amendment-1.md` in this item's folder, authored by `coach` in either mode, and
never by editing this file. A `writer` that cannot execute an item returns it and stops; that
return is a trigger for an amendment, not an amendment.

**If a first amendment is needed, A1's own rule binds it.** Name every obligation any replaced
block carried that the replacement does not.

## Sign-off

The user signs this spec before `writer` runs. The cycle then runs step 2 scoped to
`.claude/references/pipelines.md`, `.claude/agents/articles/prose.md` and
`.claude/agents/articles/prose.meta.md`, and nothing else.
