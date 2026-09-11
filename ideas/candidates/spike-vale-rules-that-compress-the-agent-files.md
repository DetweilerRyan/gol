---
name: spike-vale-rules-that-compress-the-agent-files
title: Spike Vale rules until they mechanically produce instruction-only agent files, using swarm-forge's originals as the density target
created: 2026-09-11
---

## Situation

The five role files hold **15,007 words**. `architect.md` alone is 4,917. The articles behind them hold
**93,541**, and `CLAUDE.md` another 11,577. Every one of those words is loaded into a session or a
subagent that reads the file.

They began as an adaptation of `unclebob/swarm-forge`'s six-pack branch, and `CLAUDE.md` says so. The
roles have genuinely grown since — modes, write boundaries, escalation lanes the originals never had.
**The growth in scope is not the complaint. The growth in prose per unit of instruction is.**

Vale already runs over these files. Six `STE` rules are enabled and the pass is report-only.

## Complication

**The enabled six find 195 findings on the agent files. The full `STE` + `Slop` set finds 582.** Probed
2026-09-11 against the live tree with a scratch config enabling everything:

| Rule                  | Findings on `.claude/agents/*.md` | Enabled today            |
| --------------------- | --------------------------------- | ------------------------ |
| `STE.Gerunds`         | 264                               | **no** — `= NO`          |
| `STE.ProcedureLength` | 122                               | yes                      |
| `STE.PassiveVoice`    | 73                                | yes                      |
| `STE.Dictionary`      | 56                                | **no** — `= NO`          |
| `STE.Modals`          | 31                                | **no** — `= NO`          |
| `STE.NounClusters`    | 16                                | **no** — `= NO`          |
| `STE.Ambiguity`       | 10                                | **no** — `= NO`          |
| `Slop.*` (five rules) | 10                                | **no** — whole style off |

**Two thirds of the available signal is switched off**, and the four largest disabled rules were
disabled without a per-rule measurement — `.vale.ini` turns them off as a group.

**Neither Microsoft nor Google is installed.** `.vale.ini`'s `Packages` names only
`vale-llm-slop`. So the two style packages most likely to carry concision and instruction-form rules
have never been measured against this corpus at all.

**A finding count is not the goal and must not become the metric.** 582 findings on files that are
substantively correct would mostly be noise. The question is narrower: **which rules, applied to these
files, force a rewrite that is shorter and says the same thing?** A rule that produces churn without
compression is a failed candidate, and proving that is as valuable as finding a good one.

## Question

Which Vale rules — from `STE`, `Slop`, `Microsoft`, `Google`, or written here — mechanically drive an
agent file toward instruction-only prose without losing substance?

## Sketch — this is a spike, and its output is rules rather than a rewrite

**Do not rewrite the agent files as the deliverable.** Rewriting is how you find out whether a rule
works; the rewrite is the experiment's apparatus, not its product. A spike that lands a 40 percent
cut and no rules has produced something nobody can maintain.

**The deliverable is three things:** a set of rules worth enabling with the measurement behind each, a
set measured and rejected with the reason, and the amendments to `prose-linting.md` those two imply.

### 1. Establish the density target from the originals

Fetch `unclebob/swarm-forge`'s six-pack role files and measure them: words per role, and — more
usefully — **instructions per hundred words**. The originals are the reference point the user named,
not a ceiling to hit. This repo's roles legitimately carry more scope.

What that comparison is actually for is separating **scope growth** from **prose growth**. If a role
here has three times the words and three times the instructions, it grew correctly. If it has three
times the words and the same instructions, the rules have something to bite on.

### 2. Apply rules one at a time, and measure the rewrite rather than the finding count

For each candidate rule, in isolation:

- Enable it alone against `.claude/agents/*.md`.
- Rewrite the findings it produces in a scratch copy.
- Record: findings, words before and after, and — the judgement that matters — **did any instruction
  disappear?**

A rule earns a place when the rewrite is shorter and an author reading the after-version would do the
same thing. It fails when the rewrite is the same length in different words, or when a reader loses a
constraint.

**The `= NO` four are the first cohort**, because they are the largest measured signal and because
their disabling was never per-rule. `Gerunds` at 264 is the single biggest lever and also the most
likely to be noise; measure it first and be willing to reject it loudly.

### 3. Install and measure Microsoft and Google

Add each to `Packages`, enable per rule, same protocol. Expect overlap with `STE` and expect most
rules to be irrelevant to this corpus — both packages target end-user documentation, not agent
instructions. **A per-rule verdict list is the output**, including the rejections, because the next
person to ask this question should not have to re-measure.

`mechanise-prose-soundness-with-a-style-package` is the Wave 1 row that already names this survey.
**This spike subsumes its `Microsoft` and `Google` half.** Reconcile the two entries rather than
running both.

### 4. Route what is explanation, not instruction

The user's suspicion, worth testing rather than assuming: some of what is in the role files and
articles is explanation that belongs in a sidecar — and specifically, some belongs beside the
`scripts/` programs it describes rather than in an agent file at all.

`prose-linting.md` already owns the instruction-versus-explanation split. **This spike tests whether
that split is mechanically detectable**, or whether it stays a judgement. Either answer is useful; the
second one should be written down as a refutation so nobody re-opens it on a hunch.

Note the routing question is already settled per branch — `CLAUDE.md`'s branches 4 and 5 say where a
sidecar lives. What is unsettled is which sentences move, and that is `prose-linting.md`'s question.

## Touches

- `.vale.ini` — `Packages`, and the per-rule enable lines in all four sections
- `vale-styles/JsDoc/` — any new rule written here, plus its fixture. `architect` alone authors these
- `.claude/agents/articles/prose-linting.md` — the amendments, which are half the deliverable
- `.claude/agents/*.md` — rewritten only if a rule earns it, and that is a separate slice

**A rule added to `.vale.ini`'s `[*.{ts,tsx}]` section must be added by name to all three exemption
sections below it, and nothing checks that.** Read `prose-linting.md` before touching the config.

## Open questions

- **Where is the floor?** An instruction file compressed until every sentence is an imperative may
  read as a checklist and lose the _why_ that stops a role doing the right thing for the wrong reason.
  This repo's conventions deliberately keep reasoning next to rules. Name the floor before cutting to
  it, or the spike will find one by overshooting.
- **Does a shorter file actually change behaviour?** The premise is that verbose instructions are read
  worse. Nothing here has measured that, and it would be expensive to. Worth saying plainly that the
  benefit is assumed, so a later reader does not inherit it as established.
- **Which corpus does a rule get judged against?** A rule enabled for the agent files also fires on the
  articles, `CLAUDE.md` and the JSDoc blocks, which have different registers and different audiences.
  `.vale.ini` already sections by glob; decide per rule which sections it belongs to, and record it.
- **Should the spike touch `architect.md` at all?** It is the largest file at 4,917 words and the most
  obvious target. It is also the file whose reasoning most directly produces the repo's design calls.
  Consider spiking on `coder.md` at 1,857 words first, where a lost constraint is cheaper to notice.
- **Is `Gerunds` at 264 a real finding or a register mismatch?** STE was written for aircraft
  maintenance procedures. An agent file is closer to a specification than to a procedure, and 264 may
  be the rule objecting to a legitimate register rather than to bad prose.
