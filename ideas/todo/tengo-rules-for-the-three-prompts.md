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

**All three prompts were examined and measured. Two are mechanised and are this slice's scope. The third, `PassiveVoice`, produced a finding about the existing rule rather than a replacement for it, and was ruled out of scope on 2026-09-12 by demoting it to `suggestion`.**

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

### `ProcedureLength` — works at `scope: raw`. The earlier "blocked" finding was wrong.

**First measured as blocked, then refuted by web research on the user's direction.** At
`scope: list`, Vale strips the marker before the script sees it: `1. Run the thing.` arrives as
`Run the thing.`, identical to a bullet's text. That measurement is correct and the conclusion drawn
from it was not.

**`scope: raw` receives the unprocessed markup**, markers intact — confirmed by printing the scope:

```
RAW=[1. Run the thing.
2. Read the other thing.

- A bullet item here.
]
```

So the rule walks the raw lines, counts words only in a numbered item, and ignores bullets:

```
offset := 0
for line in text.split(scope, "\n") {
  if text.re_match("^[0-9]+\\.\\s", line) {
    words := text.split(text.trim_space(line), " ")
    if len(words) > 20 {
      matches = append(matches, {begin: offset, end: offset + len(line)})
    }
  }
  offset = offset + len(line) + 1
}
```

**Verified on a fixture carrying a long numbered step and an equally long bullet: one finding, on the
step.** Corpus-wide it reports **57 against `STE.ProcedureLength`'s 367** — an 84 percent reduction,
and the sampled findings are genuine numbered steps that run long.

**Why the marker is the only available discriminator.** Both kinds start with imperatives —
numbered items open with `Run` 14 times and `Read` 3, bullets with `Do` 15 and `Run` 6 — so nothing in
the text separates them. The marker does, and only `scope: raw` carries it.

### `PassiveVoice` — a rule exists, and the measurement argues for retiring the `STE` one instead

**Dug into on the user's direction 2026-09-12, and the finding is not the rule. It is the ratio.**

`prose.md` already did this analysis: five exempt classes, and **"one construction accounts for every
act-on finding so far, and it is greppable"** — a permission stated as `is sanctioned`, `is permitted`
or `is allowed`, naming no one who may act.

Measured against the 490 live findings:

| Shape                                               | Count |
| --------------------------------------------------- | ----- |
| Total `STE.PassiveVoice` findings                   | 490   |
| Class 1, a dated record (`was`/`were` + participle) | 80    |
| Class 4, already names its agent (`… -ed by …`)     | 38    |
| **The act-on construction**                         | **9** |

**The defect is rare and the exemptions are common**, which is the inverse of what a useful rule looks
like. A rule matching only the act-on class was prototyped and works:

```
found := text.re_find("(?i)\\b(is|are)\\s+(sanctioned|permitted|allowed)\\b", scope, 1)
```

**5 findings corpus-wide against 490.** It flags `The between-position is sanctioned` and ignores both
`Staleness is not bounded by your own edits` and `Four forms were measured and rejected`.

**But that precision is borrowed, and `prose.md` says so in advance:** "That grep is a shortcut into
the act-on class, not a replacement for the pass. It finds the construction already seen; the pass is
what finds the next one." A rule matching three adjectives is a rule that cannot generalise.

**Two attempts to widen it both failed, and the residual is why.** After removing classes 1 and 4,
**380 findings remain**. Sampling them, every one is class 2 or 3 — descriptive prose (`is invisible
where the member is used`, `are derived from the exact default camera`) or a predicate adjective
(`are inverted`, `is patched`). Narrowing by a directive marker in the same sentence — `must`,
`never`, `always`, `do not` — leaves **73**, and sampling those shows the modal usually governs a
different clause than the passive: `is excluded from that scan`, `can be expressed as pure logic`,
`can never be scored off a previous run`.

**So the honest conclusion is about `STE.PassiveVoice` rather than about a replacement.** At 490
findings for 9 real ones, it is a **1.8 percent** precision rule that every reader is told to triage by
hand. The options are:

- **Replace it with the narrow rule**, accepting that it finds one construction and misses the next.
  `prose.md`'s own sentence is the argument against.
- **Keep it as a prompt and stop pretending a sweep can clear it**, which is what the article already
  says and what the corpus already does.
- **Retire it.** 490 findings nobody acts on is a rule training its readers to skim, and that cost
  falls on every other rule in the same run.

**RULED 2026-09-12 by the user: demote to `suggestion`.** `STE.PassiveVoice` now sits below
`MinAlertLevel` and does not appear in a default run, stays named in `.vale.ini` rather than disabled,
and is reachable with `vale --minAlertLevel=suggestion`. The narrow Tengo rule below was **not**
adopted. An authoring instruction in `prose.md`'s "Standing instructions" replaces the sweep.
Measured after landing: the corpus run went from 968 findings to 478. `prose.meta.md` carries the
argument. **Nothing remains for this slice to do on `PassiveVoice`** — it covers `ProcedureLength`
and `OneInstruction` only.

### What the web research added, 2026-09-12

**A fourth option, and it is the cheapest.** Demote `STE.PassiveVoice` to `severity: suggestion`.
`.vale.ini` sets `MinAlertLevel = warning`, so a suggestion is filtered out of the sweep entirely
while the rule stays named in the config and reachable with `vale --minAlertLevel=suggestion`. That
is [GitLab's own practice](https://docs.gitlab.com/development/documentation/testing/vale/) for a
rule needing refactoring rather than a fix: "set it to suggestion-level so it displays in local
editors only."

Read the difference from retiring honestly. GitLab's version rests on an editor integration that
surfaces suggestions to an author mid-edit. This repo has no editor tier -- `npm run prose-lint` is
the only runner, and it is a sweep. So here the option is "off in the sweep, available on demand",
which is weaker than GitLab's but still not the same as `= NO`.

Note `.vale.ini` already carries the **reverse** move as precedent: "ProcedureLength is re-levelled
from its shipped `suggestion`, which MinAlertLevel would otherwise filter into silence."

**GitLab's criteria corroborate the measurement, and reach further than option 3.** Their test for
whether a rule is worth keeping is "how often an author might ignore it because it's acceptable in
the context. If the rule is too subjective, it cannot be adequately enforced and creates unnecessary
additional warnings." Their own configuration runs no passive-voice rule at all.

**One caveat that cuts the other way, and it narrows the claim rather than the finding.** The
research on passive detection notes that a tool's measured accuracy is "germane to the texts
analyzed, not all possible texts and topics". So **1.8 percent is a fact about this corpus**, not a
general indictment of `STE.PassiveVoice`. The corpus is unusually heavy in exactly the two classes
`prose.md` exempts -- dated records and agent-naming prose. The ruling should rest on the local
number, and should not be written up as a finding about the rule in general.

**What no source offers is a better mechanism at this tier.** The accurate tools
([PassivePy](https://myscp.onlinelibrary.wiley.com/doi/10.1002/jcpy.1377) and its peers) use
part-of-speech tagging and dependency parsing. Tengo is sandboxed to `text`, `fmt` and `math`, so
none of that is reachable from a Vale `script` check. The choice is between a regex and no rule --
which is what makes the narrow-rule option genuinely limited rather than merely imperfect.

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

## The method finding, and it fired twice in one session

**Both times a rule was called impossible, the claim came from testing the shapes this repo already
uses and generalising to the tool.**

- "Vale cannot express a count joined to a pattern" — reached by testing `existence`, `occurrence` and
  `sequence`, which are the three extension points in use here. Vale has **twelve**, and `script`
  expresses it.
- "`ProcedureLength` cannot be mechanised" — reached by testing `scope: list`, which is the scope
  `STE.ProcedureLength` uses. `scope: raw` carries the marker.

Each was a correct measurement with an unearned generalisation attached, and
`.claude/agents/articles/claim-discipline.md` already names the shape: **the scope of a claim is the
scope of the command that produced it.** Both would have stood unchallenged without the user asking
for a web search.

**So the operative rule for this slice: before recording that Vale cannot do something, name the
extension points and scopes tried, and check that list against the documentation.** A negative result
about a tool needs the tool's own surface enumerated; a negative result about three of its twelve
surfaces is a different and much smaller claim.

## Sketch

1. **Land the `Instruction` style's first `script` rule** — `LongSplit`, already prototyped and
   measured at 770 findings against `STE.SentenceLength`'s 1,253, with the fixture pair verified.
2. **Add `OneInstruction`**, and rule on whether `STE.OneInstruction` is then switched off. Two rules
   reporting the same defect at different precisions is the drift shape this repo already avoids
   elsewhere.
3. **Land `ProcedureLength` on `scope: raw`**, already prototyped at 57 findings against `STE`'s 367.
   Note it is the only one of the three that needs `raw`, so it reads the whole file rather than one
   block — worth confirming the cost on the full corpus before enabling.
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
