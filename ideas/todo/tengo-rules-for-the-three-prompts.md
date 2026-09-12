---
name: tengo-rules-for-the-three-prompts
title: Introduce Tengo, and mechanise the rules that currently only prompt
created: 2026-09-12
---

## Situation

**Ruled by the user on 2026-09-12: move forward with introducing Tengo.** Before handing the work to
`architect`, more rules were prototyped to test how far `script` reaches.

`prose.md` classifies the six enabled `STE` rules into three mechanical and three prompts, and states
the test: **a rule is mechanical when its trigger _is_ the defect, and a prompt when it fires on a
proxy.**

| Rule                  | Proxy it fires on    | The real condition                   |
| --------------------- | -------------------- | ------------------------------------ |
| `STE.ProcedureLength` | any list item        | a list item that is a **step**       |
| `STE.OneInstruction`  | a connective         | a connective joining two **actions** |
| `STE.PassiveVoice`    | be-verb + participle | a **rule** whose actor is hidden     |

A `script` rule can test the real condition where a single-predicate rule cannot. That is the whole
opportunity.

## What was prototyped, 2026-09-12

**Two rules work. One is blocked by a scope limitation, and the block is measured rather than assumed.**

### `OneInstruction` — works, and is far more precise

`STE`'s rule matches the connective alone. Read in full, most of its 11 live findings are false:
`modules, then hooks, then components` is a **list**, and `Settle SentenceLength first, then
ParagraphLength` is a **specified order** — which `prose.md` itself says is not two actions.

The discriminator is an imperative verb after the connective. Prototyped:

```
text := import("text")
matches := []
found := text.re_find("(?i)(,\\s+then|and\\s+then)\\s+(run|read|write|report|commit|split|add|remove|fix|check|confirm|use|keep|record|stop|apply|move|delete|revert|rerun)\\b", scope, 1)
if found {
  matches = append(matches, {begin: found[0][0].begin, end: found[0][0].end})
}
```

**2 findings corpus-wide against `STE`'s 11.** It rejects both false-positive shapes above and keeps
the genuine chain.

### `ProcedureLength` — blocked, and the reason is a Vale scope limitation

The real condition needs to know whether a list item is a **numbered step** or a **bullet**. Measured
by printing the scope from a Tengo script: **Vale strips the marker before the script sees it.**
`1. Run the thing.` arrives as `Run the thing.`, identical to a bullet's text.

The corpus does not separate them another way. Numbered items start with imperatives — `Run` 14,
`Read` 3 — but so do bullets: `Do` 15, `Run` 6, `Report` 3. **So this one cannot be mechanised at
`scope: list`**, and the next thing to try is `scope: raw`, which the `script` docs say receives
unparsed text. Not tried.

### `PassiveVoice` — not attempted

Its real condition is "a rule whose actor is hidden", which needs to know that the sentence **is** a
rule. That is the hardest of the three and the least likely to reduce to a regex.

## Tengo facts worth carrying, each of which cost a probe

- **Backslashes are doubled.** A Tengo string literal consumes one level, so `\\s` reaches the regex
  engine as `\s`. A single `\s` silently becomes a literal `s` — the rule then matches nothing and
  reports a clean zero.
- **A nested group inside an alternation errors at runtime.** `(,\\s+then|after\\s+(that|which))`
  raises `slice bounds out of range [:-1]`. The flat form is fine, and a 19-branch alternation is fine,
  so length is not the constraint.
- **`re_find`'s third argument is a count, and `-1` is not accepted** — it raises the same error.
- **Vale reports a Tengo runtime error loudly**, with the rule name and the message, and exits 1. That
  is a real advantage over a silently-inert regex rule.
- **Vale lints its own `StylesPath`.** A finding whose path is the rule file reads exactly like a
  finding on the target.

## Sketch

1. **Land the `Instruction` style's first `script` rule** — `LongSplit`, already prototyped and
   measured at 770 findings against `STE.SentenceLength`'s 1,253, with the fixture pair verified.
2. **Add `OneInstruction`**, and rule on whether `STE.OneInstruction` is then switched off. Two rules
   reporting the same defect at different precisions is the drift shape this repo already avoids
   elsewhere.
3. **Try `scope: raw` for `ProcedureLength`**, or record the refutation with the marker-stripping
   measurement.
4. **Leave `PassiveVoice` alone** until the first two have landed and the maintenance cost is real
   rather than projected.

## Touches

`vale-styles/Instruction/`, a new `vale-styles/config/scripts/` directory, `vale-styles/fixtures/` for
each rule's pair, `.vale.ini`, and `prose.md`'s mechanical-versus-prompt table — which is the artifact
this slice actually changes.

`reference-check`'s `SOURCE_EXTENSIONS` needs `.tengo` added, or a citation inside a script file goes
stale silently. `.prettierignore` or a prettier plugin decision for the same extension.

## Open questions

- **Does a `script` rule stay `architect`'s alone?** `vale-styles/**` is, and a Tengo file is a rule
  rather than a program. But it is a second language, and nothing in `architect.md` says how to author
  or review one.
- **Is `STE.OneInstruction` retired when ours lands?** Keeping both means one prompt and one mechanical
  rule for one defect.
- **The security note.** `script` is an arbitrary-code-execution surface: Tengo is sandboxed to `text`,
  `fmt` and `math`, but `text.re_find` reads and `fmt.println` emits. The vector is running Vale over
  an **untrusted** repo, which is a CI question rather than an authoring one — but it should be ruled
  before any workflow runs `prose-lint` over a fork.
