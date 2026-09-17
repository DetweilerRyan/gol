---
name: design
title: Design — staff the enabler process pipeline
created: 2026-09-17
---

# Design: staff-the-enabler-process-pipeline

Architect DESIGN pass, 2026-09-17. Enabler, so this pass is the slice's only
pre-implementation gate. The user's dated 2026-09-17 rulings in `proposal.md` bind; this
design executes them, settles the seven slice-decided items, and refines the proposal's
ordering. No product code was written in this pass. Every measurement below was taken today
in this worktree.

Two measured facts the pass rests on, both taken before any ruling:

- **`agent-doc-check`'s model list is `opus`, `sonnet`, `haiku`, `fable`** —
  `scripts/agent-doc-check/checks.ts`'s `KNOWN_MODELS`, read directly. CLAUDE.md's check-2
  bullet still says "opus/sonnet/haiku" and is stale independently of this slice; commit B
  fixes it as truth-maintenance.
- **The Vale `Instruction` style does not misfire on the JTBD job-statement form** — probed,
  not predicted. A throwaway agent file carrying all three drafted job statements under the
  live `[.claude/agents/**/*.md]` section reported **zero findings at warning level and zero
  at suggestion level**, and the run was sentinel-verified live: appending a
  35-word sentence with `used to` and `previously` produced one `STE.SentenceLength` and two
  `Instruction.HistoricalNarration` findings. Probe deleted in the same pass. No
  `vale-styles/` rule or fixture change is needed, and that ruling is mine to make.

## Ruling 1 — the reference pair is `role-file-shape`

**`.claude/references/role-file-shape.md` + `role-file-shape.meta.md`.**

- The repo names reference files by subject, not method: `definition-of-ready`, `pipelines`.
  `jtbd-troop.md` names the method and would read as opaque to anyone who has not met the
  acronym; `role-authoring.md` collides with the no-role-edits vocabulary. The subject is
  the shape a role file takes.
- Routing passes the tier's own test: the seat names it as a read trigger when authoring a
  role file, `coach` when a spec touches a role file, `writer` when executing such a spec.
  Consumers span the seat and roles, which is exactly what keeps it out of `articles/`.
- The instruction half uses the `pipelines.md` header form (`**Audience:** … **Read
when:** …`), deliberately not the sentence form `Claim.AudienceRoster` fingerprints — the
  Claim rules are ON for `.claude/references/**`.
- **CLAUDE.md documentation-map entry** (the tier list; also flip "Two entries today" to
  "Three entries today"):

  > - **`.claude/references/role-file-shape.md`** — the shape a role file takes: the
  >   two-line JTBD job statement that opens every new role file, and the TROOP completeness
  >   checklist (Task, Role, Output, Objective, Perspective) mapped over the role-file
  >   anatomy. Its sidecar carries the provenance, the 2026-09-17 rulings including
  >   no-retrofit, and the Vale probe. The audience is the orchestrating seat and the
  >   process roles. Read before authoring or restructuring a role file.

- **Section structure of `role-file-shape.md`:** the Audience/Read-when header; "The job
  statement" (the form, two lines, kind-neutral — it names the spec the invoking prompt
  carries, never any one pipeline's artifact; the authored constraints: sentences within
  STE's 25-word cap, no contractions, no narration tokens, its own two-sentence paragraph);
  "TROOP over the anatomy" (a five-row table: Objective = the job statement, Role = the
  identity opener, Task = Owns + the mode/workflow sections, Output = Handoff,
  Perspective = Boundaries + the read list — with `product.md` cited as the worked anatomy
  example, since it exists at commit A and the three new files do not); "What this shape
  does not do" (no retrofit of the five existing roles, ruled 2026-09-17; no consumer-JTBD
  emotional/social dimensions).
- **`role-file-shape.meta.md`:** provenance (Olander's JTBD+TROOP article; Medeiros's
  intention-mapping corroboration, as recorded in the proposal), the user's incorporation
  ruling, the probe measurement above, and the rejected retrofit alternative. Exempt from
  Vale by the `[**/*.meta.md]` section, scanned by `reference-check` and `agent-doc-check`
  like any `.claude/**` markdown.

**One trap this ordering avoids:** `reference-check` resolves filename tokens against the
live tree, and commit A precedes the role files. So `role-file-shape.md` **must not name**
`coach.md`, `writer.md`, or `editor.md` — it describes the shape and cites `product.md`.
The three files may cite the reference from their side at commit B, when it exists.

## Ruling 2 — frontmatter for the three agent files

All three: `tools: Read, Write, Edit, Bash, Grep, Glob` — **no LSP**. The process corpus is
Markdown and JSON; the LSP surface is TypeScript; and ADR 0002's out-of-band-write hazard
scales with the number of LSP-bearing roles, so withholding it is strictly safer and costs
nothing. This falsifies CLAUDE.md's "All five roles carry the `LSP` tool… Every role writes
TypeScript" paragraph at commit B, which that commit rewrites (see ordering).

Models, on the existing spread's own logic (verified against `KNOWN_MODELS`, which accepts
all four values):

| Role     | model    | Precedent and reason                                                                                                                                                                                                                                                                |
| -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `coach`  | `opus`   | The `product` precedent: a head role whose deliverable always gates to the user. The `fable` tier stays `architect`'s alone — `architect`'s rulings are the repo's only ungated adjudication; `coach`'s spec is user-ratified and its REVIEW compares landed text to a signed spec. |
| `writer` | `sonnet` | The `coder` precedent: executes a signed spec against mechanical craft rules.                                                                                                                                                                                                       |
| `editor` | `opus`   | The `hardener` precedent: it holds the pipeline's closing gate, and the audit's judged half (claim soundness) is not mechanical.                                                                                                                                                    |

Each is a one-line frontmatter edit to revisit; none is load-bearing on the design.

**Descriptions** (single-line, per the line-anchored frontmatter parser; every `npm run`
token below names a real script, since check 1 has no notion of "just an example"):

- `coach`: "Use this agent to open and close a process-enabler slice. It has two invocation
  modes. SPEC — diagnoses an impediment in how the repo's process works, translates product
  and software-development methodology into a concrete, file-by-file edit spec over the
  process corpus (.claude/\*\*, CLAUDE.md, references, ADRs, board docs), and stops for
  explicit user sign-off; it writes the spec artifact, never the corpus edits themselves.
  REVIEW — reads the landed corpus against the signed spec and rules the cycle closed, or
  reports what diverged. It also assesses other roles' process observations to identify
  impediments, recommends enabler-technical or spike backlog items rather than making
  cross-pipeline edits, and owns the retro intake (reserved, not built). The invoking prompt
  must say which mode; coach refuses to guess. It never edits src/, scripts/, or the corpus
  itself in either mode."
- `writer`: "Use this agent to execute a ruled, user-signed process spec from coach —
  editing exactly the files the spec names under .claude/\*\*, CLAUDE.md,
  .claude/references/, adr/, the board docs, and role-cycles.config.json, never on its own
  initiative. prose.md and claim-discipline.md are its craft rulebooks, and it lints exactly
  its own edits (npm run prose-lint scoped to them; npm run agent-doc-check and npm run
  reference-check when its edits touch what those gates read). A spec it cannot execute as
  written goes back to coach as a finding, not a workaround. It never writes src/, scripts/,
  features/, rules/, or vale-styles/."
- `editor`: "Use this agent after a writer pass or as the process pipeline's closing gate.
  It has two invocation modes. CLEAN — structure-preserving cleanup scoped to the files the
  writer's manifest names: register, duplication, cross-reference consistency, without
  changing what any instruction says. AUDIT — the corpus-wide lint and prose audit (npm run
  prose-lint, npm run agent-doc-check, npm run reference-check, plus the claim-discipline
  forms check), absorbing the prose-audit discipline as a standing duty. The invoking prompt
  must say which mode and, for CLEAN, carry the writer's manifest verbatim. A substantive
  contradiction it finds is reported to coach, never fixed in place. It never writes src/ or
  scripts/, and vale-styles/ findings go to architect."

## Ruling 3 — the job statements, as measured

Each opens its file as the first paragraph after frontmatter — the Objective letter, ahead
of the identity opener. These exact texts are the ones the Vale probe measured clean:

- **coach:** When the process itself impedes the work, the seat hires `coach` to diagnose
  the impediment and spec the change. The user rules on the spec, so process change lands
  ruled rather than accreted.
- **writer:** When a ruled, user-signed spec needs executing, the seat hires `writer` to
  make exactly the edits it names. Nothing in the corpus moves on `writer`'s own initiative.
- **editor:** When a `writer` pass lands, the seat hires `editor` to clean what the manifest
  names and audit the whole corpus. A standing role then finds drift, rather than an audit
  someone remembers to run.

All three are kind-neutral: none names a Story artifact, a `.feature`, or any one pipeline's
deliverable — the authority object is "the spec the invoking prompt carries".

## Ruling 4 — the three role files' skeletons

Shared shape, per `role-file-shape.md`: frontmatter → job statement → identity opener
("You are `<role>` for this Conway's Game of Life project…" plus the house-rules read
trigger — the same four articles every role reads: engineering, workflow, handoffs,
claim-discipline) → the sections below. All sequences of process roles in these files stay
**mode-decorated** until commit C declares the cycle (see Ruling 6).

**`coach.md`** — modes **SPEC** and **REVIEW** (deliberately not SPECIFY/VERIFY, so a grep
for either finds only `product`; the mode-required contract mirrors `product`'s):

- Two invocation modes — the prompt names one; refuse to guess.
- Owns: impediment diagnosis from roles' reported observations; the spec artifact
  (`spec.md` in the item's `backlog/ready/<name>/` folder, on the `design.md` precedent from
  ADR 0001's per-item artifact convention); ruling what is in and out of a process change;
  cross-pipeline recommendations (an enabler-technical for a new mechanical prose guard, a
  spike when uncertain one is possible) delivered as backlog recommendations in its handoff
  — the seat captures them; **the retro reservation line, verbatim:**

  > **Retro intake — reserved.** `coach` owns the process by which roles share process
  > feedback; the intake itself is not built, and building it is a future spec of its own.

- SPEC mode: the deliverable is a file-by-file edit spec, verbatim where wording is
  load-bearing, with the check readings it expects to move; stops for explicit user
  sign-off; writes no corpus edit.
- REVIEW mode: reads the landed corpus against the signed spec; closes the cycle or reports
  divergence. No second user gate — ruled 2026-09-17.
- Boundaries: never edits the corpus, `src/`, or `scripts/`; `vale-styles/` and `rules/`
  stay `architect`'s; does not read the board (recommendations flow out through handoffs,
  items flow in as prompt content).
- Read list: `role-file-shape.md`, `pipelines.md`, `prose.md`, `claim-discipline.md` (the
  last two are already house rules; the first two are named triggers).

**`writer.md`** — no modes:

- Owns: executing the signed spec exactly; a changed-files manifest at handoff, carried to
  `editor` (CLEAN) verbatim — the `coder` → `cleaner` manifest contract.
- Craft: read `prose.md` and `claim-discipline.md` before editing; the instruction register;
  a filename named in prose must resolve (`reference-check` scans what it writes); no bare
  role chain that does not byte-match a declared rendering in `role-cycles.config.json`.
- Verification: `npm run prose-lint -- --scope <path>` over each edited file;
  `npm run agent-doc-check` when its edits touch `.claude/**` or CLAUDE.md;
  `npm run reference-check`; `npm run format`. Never the `src/` gates.
- Boundaries: a silent or contradictory spec goes back to `coach` as a finding — never
  improvise, never workaround; never `src/`, `scripts/`, `features/`, `rules/`,
  `vale-styles/`.

**`editor.md`** — modes **CLEAN** and **AUDIT**:

- CLEAN: manifest-scoped, per `writer` pass, structure-preserving — meaning does not change,
  the `cleaner` analog.
- AUDIT: corpus-wide closing gate — runs `npm run prose-lint`, `npm run agent-doc-check`,
  `npm run reference-check`, and the judged forms check against `claim-discipline.md` and
  `prose.md`'s "Instruction stays. Explanation moves.". This is the absorbed prose-audit
  discipline: the same forms `.claude/skills/prose-audit/SKILL.md` checks, now a standing
  role duty rather than a fork the seat remembers to run. The skill file is untouched this
  slice; whether it retires is a candidate for `coach`'s first assessment.
- Boundaries: never changes what an instruction says (a substantive contradiction goes to
  `coach`); never `src/` or `scripts/`; a `vale-styles/` tension is reported to `architect`,
  matching every other role's relationship to the styles.

## Ruling 5 — the amended Conventions bullet (the seat's residue)

The carve-out is **narrow and enumerated**, not "emergency-only": the seat keeps the two
classes of edit that are records of decisions already made elsewhere, and loses conduct.
Proposed wording for CLAUDE.md's Conventions bullet, replacing the 2026-09-11 bullet:

> - **No role edits a role file, an article, or `CLAUDE.md` on its own initiative.**
>   `writer` edits them only to execute a ruled, user-signed `coach` spec handed as prompt
>   content — the authority `coder` has toward `product`'s approved contract. Every other
>   role, and `writer` outside a spec, reports and hands off, however small the correction
>   looks. The seat retains two residues. It records role-reported staleness — module maps,
>   file lists, counts — each edit with the user's explicit approval as before. It also
>   writes what its own procedures write: promotion records, merge records, and the board.
>   Conduct changes — a rule, a boundary, a mode, a section — go through the process
>   pipeline. This bullet does not reach `rules/*.yml` or `vale-styles/**`, which
>   `architect` owns; authoring a rule never carries an edit to the prose that documents
>   it. Ruled 2026-09-11; amended 2026-09-17.

Every sentence sits under STE's 25-word cap (counted). The staleness residue is what keeps
a technical enabler's split-report loop cheap; the conduct clause is what makes this the
last seat-authored process change.

## Ruling 6 — the process cycle IS declared this slice, atomically with its first bare mention

**Yes — in commit C, in the same commit as CLAUDE.md's bare chain.** The reasoning:

- CLAUDE.md's Subagent pipeline section must present the process pipeline anyway (it is the
  auto-loaded routing index, and its "five-role pipeline" framing dies at commit B
  regardless). The natural presentation parallels the existing story line, which is bare:
  **coach → writer → editor → coach**, with the user sign-off described in the surrounding
  sentence rather than inside the chain.
- Guards 4 and 5 make the bare mention and the config entry **atomic in one commit, both
  directions**: a declared cycle with zero byte-identical mentions reds guard 4, and a bare
  mention matching no declared rendering reds guard 5 (both read directly in
  `scripts/agent-doc-check/checks.ts` today). So "step 3 only when a bare chain first lands"
  resolves to: the chain first lands in commit C, therefore the declaration lands in
  commit C. The proposal's steps 3 and 4 merge.
- Config entry: `{ "pipeline": "process", "roles": ["coach", "writer", "editor", "coach"] }`
  — four items, over the schema's `minItems: 3`; renders to the exact CLAUDE.md string;
  unique pipeline name and rendering, so the duplicate guards stay green.

**Two writing constraints this creates, binding on commits B and C and on `writer`
thereafter:**

1. Between B and C the roster already contains the three names, so **no bare chain of three
   or more process roles may appear anywhere** in `.claude/**` or CLAUDE.md — decorated
   forms only (`coach (SPEC) → writer → editor (CLEAN)` is exempt by the matcher's
   parenthetical rule). Guard 5 enforces this rather than trusting it.
2. From C onward, a bare mention must byte-equal the **full** rendering
   `coach → writer → editor → coach` — guard 5 is byte-identity against whole renderings,
   so a bare fragment like `writer → editor → coach` reds the gate. Write fragments
   decorated or in prose.

## Ruling 7 — commit ordering, contents, and executor

No `coder` or `cleaner` invocation exists in this slice: there is no `src/`, `scripts/`,
config-code, or `rules/` surface. Every commit below is **seat-executed** except this
design and the later REVIEW, which are mine. Recorded honestly: this is the last
seat-authored process slice by design, executed under the 2026-09-11 rule it amends — the
roles that would own these edits are the ones being created.

**Commit 0 (architect, this pass):** this `design.md`. Green: `backlog/**` is outside
`reference-check`, `agent-doc-check`, and all Vale sections except `Board.NoStatusField`
(frontmatter carries no `status:` key).

**Commit A (seat): the reference pair.** `role-file-shape.md` + `role-file-shape.meta.md`
per Ruling 1, plus the CLAUDE.md tier-list entry and the "Two entries today" → "Three"
count. Constraint: the pair names no unbuilt file (cite `product.md` as the anatomy
example). Green: `npm run prose-lint`, `npm run reference-check`, `npm run agent-doc-check`
(the pair joins docFiles; no `npm run` typos, no bare chains, no retired-role tokens).

**Commit B (seat): the three role files, plus truth-maintenance on claims they falsify.**
`.claude/agents/coach.md`, `writer.md`, `editor.md` per Rulings 2–4. In the same commit,
because each claim goes false the moment the files exist:

- CLAUDE.md "five-role pipeline" → the two-pipeline framing (counts stated once, or
  count-free).
- CLAUDE.md "All five roles carry the `LSP` tool… Every role writes TypeScript" → the five
  story-pipeline roles carry LSP; the three process roles do not, and why (Ruling 2).
- CLAUDE.md's agent-doc-check check-2 bullet "opus/sonnet/haiku" → the four-value list the
  checker actually holds (pre-existing staleness, measured today).
- `orchestration.md` line "The five roles have files." → count-free ("The roles have
  files.").
- `.vale.ini` comments "the five role files" / "all five role files are stripped" →
  count-free wording. Comment-only; the sections' globs already reach the new files, which
  is the point of the reach reading below.

Green: `npm run agent-doc-check` (**5 → 8 agent files**, check 2 validating all three; no
bare process chain exists, so check 4 is undisturbed), `npm run prose-lint` (Instruction
reach now covers 8 role files; the job statements are measured clean), `npm run
reference-check`.

**Commit C (seat): governance, and the cycle declaration.** One commit, because the bare
chain and the config entry are atomic (Ruling 6):

- `role-cycles.config.json`: the process entry (**1 → 2 declared cycles**).
- CLAUDE.md Subagent pipeline: the process cycle line with the bare chain; the pointer to
  `pipelines.md`'s enabler-process section.
- CLAUDE.md Conventions: the amended no-role-edits bullet, verbatim from Ruling 5.
- CLAUDE.md board section (`kind` line) and `backlog/TEMPLATE.md`: kind vocabulary becomes
  `story | enabler-technical | enabler-process | spike | epic`. Existing board files keep
  their historical `enabler` labels — they are records.
- `definition-of-ready.md`: the kind check's checker-bearing entry grows the sub-kind
  discriminator — does the diff land in the tree the gates measure (`src/`, `scripts/`,
  configs, `rules/`) or in the instructions that run the gates (`.claude/**`, CLAUDE.md,
  `.claude/references/`, `adr/`, the board docs)? V and T still score against the
  checker-bearing column either way.
- `pipelines.md`: the Enabler section splits into **enabler-technical** (current cycle,
  unchanged roles; the "surfaces no role may edit fall to the seat" bullet replaced — those
  surfaces now route per the amended Conventions: staleness recording stays seat-retained,
  a substantive corpus change inside a technical enabler is a split signal) and
  **enabler-process** (decorated cycle
  `coach (SPEC) → user sign-off → writer → editor (CLEAN, per writer pass) → editor (AUDIT)
→ coach (REVIEW)`; a step table on the story table's pattern; the bare roster cited from
  the config's process entry, mirroring the story section's citation; `hardener` appears at
  the merge protocol, not as a pipeline step). The invocation contracts section gains:
  `coach` requires a mode (SPEC/REVIEW); `editor` requires a mode, and CLEAN carries
  `writer`'s manifest verbatim; `writer` receives the signed spec as prompt content plus
  the slice name. "Sequencing the seat owns" gains: `editor` CLEAN after every `writer`
  pass. The header's audience line and CLAUDE.md's matching entry widen to include the
  process roles (`coach` reads this file). A `reference-check` allow marker for `spec.md`
  on the `tasks.md`/`findings.md` precedent, deleted when the first one exists.

Green: `npm run agent-doc-check` (two declared cycles, each with ≥1 byte-identical bare
mention — the three story mentions are untouched; the process mention lands in CLAUDE.md),
`npm run prose-lint`, `npm run reference-check`. `npm run mutation-invariance` with no
argument stays green: `role-cycles.config.json` is already an allowlist entry and the
allowlist itself is untouched, so nothing re-arms.

**Then:** architect REVIEW (the landed corpus against this design), `hardener` (slice
scope), merge protocol. `product` VERIFY does not run — walk every path: `backlog/**`,
`.claude/**`, `CLAUDE.md`, `.vale.ini` comments, `role-cycles.config.json`,
`backlog/TEMPLATE.md`; none reaches behavior. Record the moot step 8 per
`orchestration.md`. At merge, compute `npm run mutation-invariance -- --diff main...HEAD`
in step 3's worktree — every touched path is on the allowlist, so exit 0 is expected, but
the predicate is computed, never recalled. The item folder moves `ready/` → `done/` at
merge step 1 per `pipelines.md`'s exit note.

## Rules and styles — my remit, nothing to add

- **No `vale-styles/` change.** The `[.claude/agents/**/*.md]` section reaches the new
  files by glob with no config edit, and the probe shows the job-statement form clean under
  Instruction, STE, and Claim at both alert levels. No new rule, so no new fixture; `npm run
vale-fixture-check` has nothing new to gate.
- **No `rules/*.yml` change.** ast-grep sees code; every invariant this slice adds is prose
  or JSON that `agent-doc-check` already guards (roster, frontmatter, cycle byte-identity).
- The one mechanical guard the design leans on — declared-cycle/bare-mention atomicity —
  already exists as check 4's guards 4 and 5, landed by `declare-the-role-cycles-in-config`.
  This slice is that checker's first consumer, which is the sequencing the board promised.

## What the checks read, before → after

- `agent-doc-check` agent files: **5 → 8** (commit B), every new file's frontmatter
  validated the day it lands.
- Vale `Instruction` reach inside `[.claude/agents/**/*.md]`: **5 role files → 8**
  (commit B), measured clean on the job statements.
- `role-cycles.config.json`: **1 → 2 declared cycles** (commit C, atomically with the first
  bare mention — not before, per guard 4).
- `reference-check` / `prose-lint` scanned-file counts: **+2** at commit A, **+3** at
  commit B; green at every step.
- The substantive finished state — a working coach → writer → editor pipeline — is accepted
  by two recorded user sign-offs (the first `coach` spec, its closing REVIEW), per the
  proposal; no checker anchors it, and that residual gap is already routed to
  `definition-of-ready.meta.md`.

## Touches

New: `.claude/references/role-file-shape.md`, `.claude/references/role-file-shape.meta.md`,
`.claude/agents/coach.md`, `.claude/agents/writer.md`, `.claude/agents/editor.md`.
Changed: `CLAUDE.md` (tier list, Subagent pipeline, Conventions, board kind line,
check-2 model list), `role-cycles.config.json`, `.claude/references/pipelines.md`,
`.claude/references/definition-of-ready.md`, `backlog/TEMPLATE.md`,
`.claude/agents/articles/orchestration.md` (one count-free sentence), `.vale.ini`
(comment wording only). Untouched by design: `.claude/agents/articles/handoffs.md`,
`.claude/skills/prose-audit/`, every existing role file, everything under `src/`,
`scripts/`, `rules/`, `vale-styles/`, `schemas/`.

## What the ruled design missed, now settled or deferred

- **Settled here:** the KNOWN_MODELS staleness (commit B); the guard-5 sub-chain constraint
  (Ruling 6); the reference pair's no-unbuilt-names constraint (Ruling 1); the audience-line
  widening in `pipelines.md` (commit C); `spec.md`'s allow marker; the merged steps 3+4.
- **Deferred, named:** the fate of `.claude/skills/prose-audit/` once `editor` AUDIT stands
  — `coach`'s first assessment. `handoffs.md` is untouched this slice: the writer→editor
  manifest contract lives in the role files and `pipelines.md`'s table, per that file's
  between-invocation charter; if REVIEW finds `handoffs.md` contradicted by the landed
  files, it reports then. Whether the five existing role files ever gain job statements is
  the audit sibling's question, explicitly not reopened here (no-retrofit, ruled
  2026-09-17). New sidecars for the three roles: none — a sidecar exists when evidence
  overflows, and there is none yet; CLAUDE.md's sidecar index needs no edit since it lists
  files that have one.

## Open questions

- Whether `coach`'s SPEC deliverable wants a fixed section shape inside `spec.md` (a
  manifest table, expected check readings) — `coach`'s own first spec decides; nothing here
  constrains it beyond "file-by-file, verbatim where load-bearing".
- Whether the seat's staleness residue eventually routes through `writer` too — a `coach`
  candidate once the pipeline has run at least once, not this slice's call.
- Where the audit sibling (`role-files-assume-the-story-pipeline`) lands relative to this —
  the proposal left it open, and nothing in this design blocks either ordering; the
  reference pair gives its rewrite the organizing principle either way.
