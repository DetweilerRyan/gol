---
name: design
title: Design — declare the role cycles in config
created: 2026-09-17
---

# Design: declare-the-role-cycles-in-config

Architect DESIGN pass, 2026-09-17. Enabler, so this pass is the slice's only
pre-implementation gate. The ruled Answer in `proposal.md` binds; this design executes it and
settles its open questions. No product code was written in this pass.

## Ruling 1 — home and name

**Root: `role-cycles.config.json`, beside `mutation-invariance.config.json`. Schema:
`schemas/role-cycles.schema.json`.**

- A `.claude/**` home was weighed and rejected. `.claude/**` is already blanket-allowlisted
  under the `vitest-exclude` tier, so the user's ruled allowlist entry — with the
  config-invariance principle as its argument — would have nowhere to exist. The ruling says
  the config _joins_ the allowlist; a home that makes the entry vacuous does not execute the
  ruling, and the principle's argument would be recorded nowhere.
- Root is `writer`-legal (outside `scripts/`), and it is the established home for a
  real-world config a gate reads. The `$schema` key points at `./schemas/role-cycles.schema.json`,
  mirroring `mutation-invariance.config.json`.
- Ownership going forward: the seat (or a future doc/process role), never `coder`. In this
  slice the **seat writes it** — commit A below also carries two seat-only surfaces, and
  splitting one commit's authorship is noise.

## Ruling 2 — schema

```json
{
  "$schema": "./schemas/role-cycles.schema.json",
  "cycles": [
    {
      "pipeline": "story",
      "roles": ["product", "coder", "cleaner", "architect", "hardener", "product"]
    }
  ]
}
```

- **The config carries role arrays, not arrow strings.** The checker renders the canonical
  form itself (`roles.join(' → ')`), so the glyph and spacing have exactly one author and the
  config cannot smuggle a variant arrow or spacing.
- **The initial config declares only the story cycle**, because only it has bare mentions
  today (three: two in CLAUDE.md, one in `handoffs.md`). Guard 4 below fails a declared cycle
  with zero bare mentions, so declaring the enabler chain now — which appears only decorated —
  would red the gate. The process-pipeline sibling adds its entry the day its bare chain
  lands in prose, which is exactly the config-not-code workflow this slice buys.
- **JSON schema is load-bearing, not decorative**: validated at runtime with ajv, mirroring
  `scripts/mutation-invariance/config-file.ts`'s `parseConfig(configText, schemaText,
configPath)` shape — including its named-`Ajv`-export and draft-07 notes. ajv is already a
  dependency; no `package.json` change.
- Schema shape: `cycles` — array of `{ pipeline: string, roles: string[] }`, both required,
  `additionalProperties: false`, `roles` items non-empty strings, `minItems: 3` on `roles`
  (the matcher only finds chains of three or more, so a shorter declared cycle could never be
  mentioned and would be born inert). Keep the schema generic so adding a pipeline is a
  config-only diff — that keeps the common future edit inside the allowlisted file.
- `schemas/**` stays on the invariance absent list. Adding the schema file re-arms the gate
  for this slice, which is already non-invariant (it touches `scripts/`). The absent entry's
  `reason` currently says "this gate's own config validation"; the seat widens that sentence
  to cover both gates' schemas when it edits the config (commit A).

## Ruling 3 — canonical semantics: the config is the authority

**The declared form becomes the canonical outright. Most-common-found is removed.**

- Voting is unstable at n=3: editing two of three mentions flips the canonical and reports
  the _unedited_ one as the deviant. Authority makes drift reporting directional.
- With more than one declared cycle, "most common" is incoherent — a mention has to be
  attributed to some cycle. Attribution is byte-identity against a declared rendering; a
  bare cycle-shaped mention matching no rendering is a failure.
- `findCycleMentions` (`cycle-string.ts`) is **untouched**, including the decorated-chain
  exemption (a no-go) and the ≥3-link floor. The roster stays derived from the agent files
  (the other no-go); the config's roles are validated _against_ that roster, never replacing
  it.

## Ruling 4 — the guards, each with its failure direction

Order matters: on a config-level failure (guards 1–3 and validation), report and skip the
mention pass, so one bad config does not cascade into a page of misattributed drift findings.

1. **Config or schema file missing** → `run.ts` throws by name, mirroring
   `readRuleDocFile`'s `existsSync` guard. Fail-closed: a missing config must never read as
   "no cycles to verify, pass".
2. **Config declares zero cycles** (`cycles: []`) → check-4 failure. Without it an empty
   declaration is byte-for-byte identical in output to a clean tree — the vacuous-pass
   direction.
3. **A declared cycle names a role not in the derived roster** (roster drift after a
   retirement or rename) → failure naming the cycle, the unknown role, and the roster. This
   guard is the load-bearing one: the matcher builds its alternation from the roster, so a
   chain containing a retired role is invisible to the scan — the declared cycle stops
   checking anything _and_ stale doc mentions of the old chain vanish simultaneously.
   Double-silent without this guard.
4. **A declared cycle has zero byte-identical bare mentions anywhere** → failure: the entry
   is inert, same class as a `files:` glob matching nothing (`checkAnyRulesFound`'s reason).
   Fail-safe — delete the entry or the prose genuinely carries the chain. This subsumes the
   old global "no cycle mention found anywhere" guard, per-cycle and strictly sharper, and
   it still catches the arrow-glyph drift the old message named (drifted glyph → mentions
   vanish → guard 4 fires).
5. **A bare mention matching no declared rendering** → failure naming the mention, its
   file/line, and the declared rendering(s). This is the drift check proper. Message keeps
   the current form's helpfulness; no fuzzy "nearest cycle" matching — byte-identity or
   failure.
6. **Config-validation failures beyond the schema's reach**: duplicate `pipeline` names, and
   two cycles rendering to the same string (one fact, one home). Reported as check-4
   failures, not throws, so the gate lists everything at once.

## Ruling 5 — the allowlist entry and its C4 paragraph

**Tier: `written-argument`**, fixed root filename, same as `CLAUDE.md`'s entry. The seat
writes both the entry and the paragraph in
`.claude/agents/articles/mutation-testing.meta.md`; the paragraph's claims are:

- Never mutated: `stryker.config.json`'s `mutate` is `src/**`.
- Consulted by no `src/` test, build, or lint config — verified by the same grep recipe as
  the `CLAUDE.md` entry (vite.config.ts, the vitest configs, `src/test-setup.ts`,
  `fast-check-stryker-seed.ts`, both Stryker configs).
- Read in production by `scripts/agent-doc-check/run.ts`; **its tests build temp-repo
  fixtures per case and never read the real root config** — the same clause the `CLAUDE.md`
  argument carries. This is a claim about the tests, so it is a binding constraint on
  `coder` (see Interfaces). Do not recreate the `features/**`-from-the-live-tree coupling
  that keeps `scripts/**` on the absent list.
- The user's config-invariance principle as the framing, with the honest scope note: the
  predicate quantifies over the `src/` run per the config's own `scope` field.
- A `verifiedOn` date.

## Ruling 6 — commit ordering, each green

**Commit A (seat):** `role-cycles.config.json` + `schemas/role-cycles.schema.json` + the
`written-argument` entry in `mutation-invariance.config.json` + the C4 paragraph in
`mutation-testing.meta.md` (+ the `schemas/**` reason widening). Pre-arm pattern from
`backlog-board-migration`: the argument lands in the same commit as the config it argues
for. Green trivially — nothing consumes the new config yet; `npm run mutation-invariance`
validates because the config is tracked in the same commit.

**Commit B (`coder`, then `cleaner`):** the checker change, one coder invocation. New
`scripts/agent-doc-check/cycle-config.ts`, check-4 rework in `checks.ts`, `run.ts` wiring,
tests. Green: `npm run test:scripts` and `npm run agent-doc-check` against the live tree —
the three bare mentions byte-match the story rendering, guard 4 is satisfied, guard 3 is
satisfied by the five-role roster. Full `scripts/` freight per the role files.

**Commit C (seat):** the doc updates named under Staleness below. Green: `npm run
agent-doc-check`, `npm run reference-check`.

Checker-before-config was rejected: `run.ts`'s fail-closed guard (ruling 4.1) would throw on
the missing config and red commit B's own gate.

## File set and interfaces

New: `role-cycles.config.json` (root), `schemas/role-cycles.schema.json`,
`scripts/agent-doc-check/cycle-config.ts` + `cycle-config.test.ts`.
Changed: `scripts/agent-doc-check/checks.ts`, `checks.test.ts`, `run.ts`, `run.test.ts`,
`mutation-invariance.config.json`, `.claude/agents/articles/mutation-testing.meta.md`.
Untouched by design: `cycle-string.ts` and its tests, `roles.ts`, `decide.ts` (summary-line
count tweak is `coder`'s call).

`cycle-config.ts`:

```ts
export interface DeclaredCycle {
  pipeline: string
  roles: string[]
}
export interface RoleCyclesConfig {
  cycles: DeclaredCycle[]
}
export type ParseRoleCyclesResult = { ok: true; config: RoleCyclesConfig } | { ok: false; errors: string[] }
export function parseRoleCyclesConfig(configText: string, schemaText: string, configPath: string): ParseRoleCyclesResult
export function renderCycle(roles: readonly string[]): string // roles.join(' → ')
```

`checks.ts`: `CheckInput` gains `cycleConfigFile: RawFile` and `cycleSchemaFile: RawFile`;
`checkCycleStringConsistent(docFiles, knownRoles, cycleConfigFile, cycleSchemaFile)` runs
guards 2–6 (guard 1 lives in `run.ts`). Check id stays `cycle-string-consistent` — the
output vocabulary is referenced in prose and nothing is bought by renaming it. Semantic
validation (roster membership, duplicate pipelines, duplicate renderings) lives in
`checks.ts` where the roster is known; shape validation lives in `cycle-config.ts` behind
ajv. All config problems surface as `Failure` objects so `decide()` stays pure and the gate
reports everything at once.

`run.ts`: reads both files through by-name `existsSync` throws (the `readRuleDocFile`
pattern, same rationale comment shape), passes them into `gatherCheckInput`.

Tests: `checks.test.ts`/`cycle-config.test.ts` are pure (RawFile/string fixtures);
`run.test.ts`'s temp repos gain the two new files in their fixture builders. **No test reads
the real root config or tree** — binding, per ruling 5.

**One property test, in the scripts property style** (`path-forms.property.test.ts`
precedent): for a roster of distinct slug-shaped role names with no prefix pairs and a
declared chain of ≥3 of them, `findCycleMentions(renderCycle(roles), roster)` yields exactly
one mention byte-equal to the rendering. This pins the renderer/matcher agreement — the one
coupling that would otherwise break silently (a variant arrow or spacing in the renderer
makes every declared cycle inert, and guard 4's failure would then misdirect at the docs).
Show it failing once against a deliberately wrong renderer (e.g. `' -> '`) before keeping
it. The prefix-pair case (`coder`/`coder2`) is a real matcher hazard — the alternation plus
`\b` can decline the longer name — so the arbitrary excludes prefix pairs deliberately, and
a deterministic unit test pins the actual prefix-pair behavior with a comment saying it
documents, not contracts.

## Rules and styles

No new `rules/*.yml` and no `vale-styles/` change: the invariants this slice adds are
value-level facts about a JSON config, which ast-grep (a structural matcher) cannot see, and
the checker itself is the mechanical guard. Nothing under `.claude/` changes in commits A/B
except the meta sidecar, which `agent-doc-check` and Vale both exempt.

## Touches

New: `role-cycles.config.json`, `schemas/role-cycles.schema.json`,
`scripts/agent-doc-check/cycle-config.ts`, `scripts/agent-doc-check/cycle-config.test.ts`.
Changed: `scripts/agent-doc-check/checks.ts`, `scripts/agent-doc-check/checks.test.ts`,
`scripts/agent-doc-check/run.ts`, `scripts/agent-doc-check/run.test.ts`,
`mutation-invariance.config.json`, `.claude/agents/articles/mutation-testing.meta.md`, and
the doc surfaces in the Staleness report below.

## Open questions

- Whether `decide.ts`'s summary line gains a declared-cycle count — `coder`'s call, either
  way is fine.
- Whether the prefix-pair matcher behavior (see the property-test note) deserves its own
  future guard. Documented, not contracted, in this slice.

## Staleness report (seat edits, commit C)

- `CLAUDE.md` "Custom quality tooling", check 4's bullet: "built from whichever roles
  currently exist rather than a hardcoded chain" → the declared cycles now live in
  `role-cycles.config.json` per pipeline; the roster stays derived. Name the config file.
- `CLAUDE.md` command-list line for `npm run agent-doc-check`: "the cycle string matches
  everywhere" → per-pipeline declared cycles.
- `.claude/references/pipelines.md`, Story section: "The bare role roster this decorates is
  CLAUDE.md's canonical cycle string, pinned by `agent-doc-check`'s check 4" → pinned by the
  story entry in `role-cycles.config.json`.
- The two bare cycle mentions in `CLAUDE.md` and the one in `handoffs.md` are unchanged —
  they byte-match the story rendering by construction.
