---
name: record-two-rules-the-amendment-cycle-surfaced
title: Record the block-disclosure rule and the absolute-path confident zero
created: 2026-09-18
kind: enabler-process
---

Two rules `slice/name-the-spec-amendment-and-the-in-cycle-fix-rule` surfaced and did not
land. Both were ruled inside that cycle — `coach` recommended the first and explicitly
declined to fold it in, `editor` measured the second and `coach` routed it — so neither is a
new idea. **This item skipped `/idea-assess` on that ground**, by the seat's judgement on
2026-09-18; the user may send it back.

## Situation

`.claude/references/pipelines.md` carries the amendment mechanism. An amendment names the
spec items it supersedes, and supersedes nothing it does not name.

`.claude/agents/articles/prose.md` carries the list of ways a prose check reports a
confident zero — a clean reading that means nothing was checked.

## Complication

**The supersession record discloses at block granularity.** Amendment 1 of that cycle
replaced two paragraphs verbatim and its table said so. An obligation inside one of those
paragraphs — the floor stopping a role escalating a finding it could have resolved — went
missing, and no file stated it afterwards. Three review passes read the amendment against
the corpus before `editor` caught it against the signed spec. Naming the block is true and
too coarse to see a sentence leave.

**`vale` given an absolute path lints nothing and exits 0.** `.vale.ini`'s section globs do
not match an absolute path, so the run applies no style and reports `0 errors, 0 warnings
and 0 suggestions in 0 files`. `coach` hit it on this cycle's first probe, got zero findings
in zero files, and switched to relative paths before any reading was taken — which is why no
reading in four amendments rests on it. `prose.md` documents the other ways to reach a
confident zero and not this one.

## Question

What does an amendment owe a reader about what a block replacement drops, and where does
the path hazard sit beside the confident zeros already recorded?

## Answer

Shaped, per `coach` and `editor`:

- **`pipelines.md`**, in `### Amending a signed spec`, after the supersession paragraph: an
  amendment replacing a block names any obligation the block carried that the replacement
  does not.
- **`prose.md`**, as one more entry in the confident-zero list: run `vale` with a
  repo-relative path and read the file count.
- **`prose.meta.md`**: the glob mechanism and the exit code, per branch 5.

## No-gos

- **Do not fix `prose.md`'s census while you are in the file.** Four measured divergences
  between that article and `.vale.ini` are filed as
  `prose-md-has-drifted-from-vale-ini`, and that item owns them. Add the entry; leave the
  rest.
- **Do not fold `prose-lint --scope <file>` into the confident-zero entry.** `editor`
  measured it: it exits 1 and says "That is not a clean run, it is an empty one." It is a
  usage trap, not a silent zero, and `prose.md` already documents it. Merging the two would
  teach a reader that a scoped file path reports zero silently, which is false.
- No new rule, script, or config.

## Open questions

- Does the block-disclosure rule bind the amendment's author only, or does `editor` CLEAN
  owe the same check against the signed text? `editor` performed it unprompted on the cycle
  that produced the rule.
- The confident-zero list's own count, if it states one, moves when this entry lands. Check
  whether the list is numbered before adding to it.
