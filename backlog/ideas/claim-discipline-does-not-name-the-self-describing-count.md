---
name: claim-discipline-does-not-name-the-self-describing-count
title: Name the self-describing count as a claim-discipline defect class
created: 2026-09-18
---

Filed by `coach` REVIEW round 2 on `split-the-merge-protocol-reasoning-into-its-sidecar`,
2026-09-18, with the user's approval the same day. `coach` ruled it outside that slice's
authority: it binds every role, not one pair.

## Situation

`.claude/agents/articles/claim-discipline.md` bars an undated present-tense fact about
another file, a caller roster, a `<file>:NN` citation, a quoted test title, a bare count,
and `this slice` in a record. Every role reads it unconditionally.

It does not name the case where a record counts or describes **the diff being written under
it**.

## Complication

That case produced thirteen findings in one slice across two review rounds — measured
2026-09-18 on `split-the-merge-protocol-reasoning-into-its-sidecar`. `coach` ruled them one
defect class rather than thirteen defects: a self-describing record written while the thing
it describes is still changing.

The distribution is the evidence. None was in the instruction half's rules, none in
`writer`'s execution, and none in prose that was moved. Every one was in record prose that
counted or described the slice's own edits. Two survived an amendment written specifically
to repair the class, and were wrong again at the next reading.

`.claude/references/merge-protocol.meta.md` already names the hazard for exactly one row —
the row recording a reference count can falsify itself, because adding a filename-shaped
token to any sibling row moves it. Nobody generalised it, so each recurrence was diagnosed
from scratch.

The failure is invisible to every gate. `reference-check`, `agent-doc-check` and
`prose-lint` all read green while a record described a tree that had moved under it.

## Question

What does `claim-discipline.md` say about a count of your own in-flight diff, and what does
it permit instead?

## Answer

Shaped, from `coach`'s ruling on the same slice. Its stopping condition was three
properties, each checkable by reading rather than by re-measuring:

- No record paragraph states a count of the file's own current state. The check-readings
  table row is that number's only home.
- Every remaining count stands beside a complete, adjacent enumeration. A count over its
  own bullets cannot drift with the tree, and `claim-discipline.md` already permits that
  form.
- Every figure about another file or another landing is dated or slice-attributed.

The second property carries the ruling that matters most: **the numeral is not the defect.**
Twice in that slice an incomplete enumeration was caught precisely because a numeral stood
beside it and disagreed. Stripping the numeral would have hidden the omission instead.

## No-gos

- No new Vale rule. Whether any of this is mechanically checkable is a separate question,
  and `architect` owns the styles.
- No retrofit of the records that produced the evidence. They are records.

## Open questions

- Is any property mechanically checkable, or is this judgment guidance only? Property one
  looks closest, and the answer decides whether an `enabler-technical` follows.
- Does the guidance belong in `claim-discipline.md` alone, or does `prose.md` need a
  matching line where it discusses records?
- `merge-protocol.meta.md`'s single-row warning predates the general rule. Does it stay as
  a worked instance, or collapse into the general form?
