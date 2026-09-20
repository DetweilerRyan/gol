# Amendment 5 — assessment-records-die-with-the-conversation

`coach` SPEC, 2026-09-20, against tip `b1a8b68`. **This amendment needs the user's signature
before `writer` runs.** It carries one item, numbered **9**, continuing the sequence.

**`spec.md` and amendments 1 to 4 are all signed and immutable.** Nothing in any of them is
reworded, renumbered or reordered. The live instruction set is six files read in number order.

## The trigger — a red gate, not a divergence

Step 4 landed at `b1a8b68`. Every Vale reading held. **`npm run reference-check` is red**, and it
is a genuine failure rather than a prediction that missed. Reproduced in this worktree at the tip:

```text
reference-check -- 538 file(s) scanned, 3218 reference(s) found, 1 failure(s):

[file-reference-resolves] .claude/references/definition-of-ready.meta.md
  line 286 references `assessment.md`, which does not resolve to any file in the repo
```

**This blocks the slice rather than marking it.** `reference-check` is `hardener`'s stage 2 and a
merge-protocol gate, so the slice cannot land until item 9 does.

**The cause is in D1's own signed wording**, which spells both forms of the name. The placeholder
form passes exactly as D1 predicts — stripping `<name>` leaves a basename starting with a dot,
which the extractor discards. The bare form does not, and no file of that name is tracked yet.

**D1's next sentence names the mechanism and undercounts it.** It says four files carry an
allow-marker for this token, and those four do carry one: `CLAUDE.md`,
`.claude/references/definition-of-ready.md`, `.claude/references/pipelines.md` and
`.claude/skills/idea-promote/SKILL.md`. **The sidecar is a fifth file naming the token, with no
marker.** So the clause describing the mechanism is the same clause the mechanism now falsifies.

**`writer` was right twice over.** It added no marker no signed item grants, and it did not reword
signed text to dodge a gate.

### Is the token anywhere else the slice landed it? No.

Measured 2026-09-20 at tip `b1a8b68`, by grepping every `.md` in the repo outside `backlog/` and
`.claude/worktrees/`. **The bare token appears in five corpus files and only one lacks a marker.**
The four marked files are named above. The sidecar's three other mentions — at its `.vale.ini`
glob, its two-segment classifier paragraph and its `Write` grant paragraph — all carry a
placeholder or a wildcard, and `reference-check` reports none of them. **There is no sixth place.**

## Item 9 — the clause states the rule instead of the token and the count

**Supersedes D1 in part**, and only the paragraph quoted below. Every other paragraph of D1, and
all of D2, D3 and D4, stand as landed.

### The disposition, and the one declined

**Ruled: reword so the bare token never appears, and drop the count in the same edit.** One edit
closes the gate and a census claim together.

**A fifth allow-marker in the sidecar was considered and declined.** Three reasons:

1. **It fixes one defect and keeps another.** The numeral would move from four to five and stay a
   census of files on disk, which `claim-discipline.md` rules should be dropped rather than
   corrected. The next file to name the token breaks it again.
2. **It puts a marker in the evidence half, where the token is illustrative rather than a live
   reference.** The sidecar records _why_ the name was chosen. The instruction half beside it,
   `definition-of-ready.md`, states the name outright and already carries its marker. That is the
   right home for the precise token.
3. **It adds a fifth marker to retire later.** Every marker is a deletion someone must remember
   when the first item carries a record.

**What the reword costs, stated plainly.** The sidecar no longer spells the bare basename. A
reader derives it from the ideas-lane form in the same sentence, and `definition-of-ready.md` —
the file this sidecar sits beside — states it outright.

### The replacement states a rule, which is the form that cannot rot

**The count and the roster were two spellings of the same rotting claim.** What the record needs
is the contract: the folder form needs an allow-marker wherever an instruction file names it,
until the first item carries a record. That sentence is true whatever the file count becomes.

**And the mechanism is self-policing, which the replacement says.** Each marker carries its own
reason, and `reference-check`'s stale-marker check fails the moment a marker's token starts
resolving. So nothing has to remember the roster.

### The edit

**Find** (one whole paragraph, unique in the file, hand-wrapped as shown):

```text
**The name, ruled by `coach` at SPEC and confirmed by the user 2026-09-20.**
`backlog/ideas/<name>.assessment.md` in the ideas lane, `assessment.md` in the item's folder. The
second form is a bare filename token `npm run reference-check` resolves by basename, so four files
carry an allow-marker of the shape the board's other unlanded artifact name already carries — the
multi-unit task list, named in CLAUDE.md and in the pipelines reference with exactly that marker.
The first form costs nothing: the
extractor discards a token whose basename starts with a dot, which is what the placeholder form
reduces to.
```

**Replace with:**

```text
**The name, ruled by `coach` at SPEC and confirmed by the user 2026-09-20.**
`backlog/ideas/<name>.assessment.md` in the ideas lane, and the same basename without the
placeholder in the item's folder. The folder form is a bare filename token
`npm run reference-check` resolves by basename, so it needs an allow-marker wherever an
instruction file names it, until the first item carries one. That is the shape the board's other
unlanded artifact name already carries — the multi-unit task list. Each marker carries its own
reason, and the checker's own stale-marker check is what retires it. The first form costs nothing:
the extractor discards a token whose basename starts with a dot, which is what the placeholder
form reduces to.
```

**Take the line wrapping as written.** `npx prettier --check` reports the candidate clean, so it
survives `npm run format`.

### What the replaced block carried, clause by clause

| Clause in the replaced text                                      | In the replacement                             |
| ---------------------------------------------------------------- | ---------------------------------------------- |
| The name ruling and its 2026-09-20 attribution                   | Verbatim                                       |
| The ideas-lane form, `backlog/ideas/<name>.assessment.md`        | Verbatim                                       |
| The folder form, spelled as a bare token                         | Described rather than spelled — the fix        |
| "a bare filename token … resolves by basename"                   | Verbatim                                       |
| "four files carry an allow-marker"                               | **Dropped.** Replaced by the rule              |
| "named in CLAUDE.md and in the pipelines reference"              | **Dropped.** A roster of the same rotting kind |
| The comparison to the board's other unlanded artifact name       | Kept                                           |
| "The first form costs nothing … the placeholder form reduces to" | Verbatim                                       |
| —                                                                | **Added:** the stale-marker sentence           |

**Both drops are ruled out rather than restored.** The count is a census of files on disk and the
roster is its enumerated twin; `claim-discipline.md` calls for the contract in place of either.
The added sentence carries what they were actually for — that the markers are reasoned and that
the checker retires them.

## Which pass item 9 runs in

**Its own pass, because nothing is left to ride with.** Step 4 has landed and no signed item is
outstanding. One file, `.claude/references/definition-of-ready.meta.md`, already in the set. One
commit, `editor` CLEAN after it.

## Expected readings — measured, not predicted

**Measured 2026-09-20 in this worktree at tip `b1a8b68`.** The candidate was applied to the file
in place, the gate was run, and the file was restored from a copy taken before the edit in the
same command. `git status --porcelain` and `git diff --stat` both reported empty afterwards, so
the corpus is byte-identical to the tip.

**This one could not be probed on a copy.** `reference-check` scans the whole tree rather than a
named file, so a probe copy would have been scanned as a sixth file and carried its own tokens
into the count. The measurement had to happen in place.

| Check                                 | At tip `b1a8b68`                     | With item 9 applied                    |
| ------------------------------------- | ------------------------------------ | -------------------------------------- |
| `npm run reference-check`             | 538 files, 3,218 refs, **1 failure** | 538 files, 3,216 refs, **no failures** |
| `npx prettier --check` on the sidecar | clean                                | clean                                  |
| `vale` on the sidecar                 | 0 in 1 file, by exemption            | 0 in 1 file, by exemption              |

**The reference count drops by two, and both are accounted.** One is the bare `assessment.md`
token this item removes. The other is `CLAUDE.md`, which the dropped roster clause named.

**The reading discriminates without a second probe.** The same command reports 1 failure before
the edit and 0 after, on the same file count, so the gate moved on this edit alone.

**The four existing markers did not go stale.** A stale marker is its own failure under
`reference-check`'s stale-marker check, and the clean exit covers all four.

**No other reading moves.** Item 9 touches one file, and that file is exempt from every Vale rule,
so CLAUDE.md's 19, `coach.md`'s 0, `editor.md`'s 0, `idea-promote`'s 0 and `idea-approve`'s
sanctioned 1 all stand as landed.

## A second recommendation, for the seat

**The seat reported truncating amendment 4's item 8 when assembling step 4's prompt.** The
trailing rationale was cut, two paragraphs from a Replace block. `writer` checked and confirmed no
Find or Replace block was lost, so nothing landed wrong.

**Assessed as an impediment rather than a one-off, and it is the same class as item 8 one layer
up.** Item 8 rules how `coach` specifies an edit so the target cannot be misread. This is how the
specification itself reaches the executor. **`pipelines.md`'s step 2 says the prompt must carry
"The signed spec as prompt content" and does not say whole.** An excerpt satisfies that sentence
as written.

**Recommended as an `enabler-process`, not folded in here**, since no corpus file is presently
wrong and this amendment's job is a red gate. Two halves for that slice's `coach` pass to rule:

1. A signed spec or amendment reaches `writer` whole, and an excerpt is never the authority.
2. An amendment declares its item numbers in its opening, and `writer` reports the numbers it
   received against them. That makes a truncation visible at the receiving end rather than
   invisible at both.

**Amendment 4's recommendation still stands and is not restated here** — the `prose.md` rule that
a predicted Vale reading is probed rather than counted by hand.

## Sign-off

The user signs this amendment before `writer` runs. **The file set does not widen.**
`.claude/references/definition-of-ready.meta.md` has been in it since the spec, and nothing here
reaches `scripts/`, `src/`, `vale-styles/` or `.vale.ini`.
