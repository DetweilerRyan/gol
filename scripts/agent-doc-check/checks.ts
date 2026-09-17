// The five checks over `.claude/**` + CLAUDE.md described in CLAUDE.md's
// "Custom quality tooling" section: mechanical facts about the pipeline's
// own documentation, mirroring ast-grep-rule-check's checks.ts in shape --
// every check here is a binary fact, so this program (like that one) is a
// gate, not advisory. Parsing/extraction for each check lives in its own
// file (npm-run-refs.ts, agent-frontmatter.ts, roles.ts, cycle-string.ts,
// cycle-config.ts, rule-mentions.ts); this file is just the five checks plus checkAll, which
// runs them all -- the surrounding orchestration (reading files off disk,
// formatting the exit code/output lines) lives in run.ts/decide.ts instead.

import { filenameStemOf, parseAgentFrontmatter, type AgentFrontmatter } from './agent-frontmatter.ts'
import { parseRoleCyclesConfig, renderCycle, type DeclaredCycle } from './cycle-config.ts'
import { findCycleMentions } from './cycle-string.ts'
import { extractNpmRunReferences } from './npm-run-refs.ts'
import { findStaleRoleReferences } from './roles.ts'
import { extractMentionedRuleIds, extractRulePathMentions } from './rule-mentions.ts'

export interface RawFile {
  path: string
  text: string
}

export interface Failure {
  check: string
  file: string
  message: string
}

const KNOWN_TOOLS = ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob', 'LSP']
const KNOWN_MODELS = ['opus', 'sonnet', 'haiku', 'fable']

/**
 * Check 1: every `npm run <script>` reference in the docs names a real
 * package.json script. One failure per distinct (file, script) pair, not
 * one per occurrence.
 */
// A script mentioned wrong three times in the same file is one typo to
// fix, not three failures to wade through.
export function checkNpmRunReferencesResolve(docFiles: RawFile[], packageScripts: ReadonlySet<string>): Failure[] {
  const failures: Failure[] = []
  for (const file of docFiles) {
    const distinctRefs = new Set(extractNpmRunReferences(file.text))
    for (const script of distinctRefs) {
      if (packageScripts.has(script)) continue
      failures.push({
        check: 'npm-run-references-resolve',
        file: file.path,
        message: `references \`npm run ${script}\`, which is not a script in package.json`,
      })
    }
  }
  return failures
}

function frontmatterFailure(file: RawFile, message: string): Failure {
  return { check: 'agent-frontmatter-valid', file: file.path, message }
}

// One field's contribution to checkOneAgentFrontmatter below, split out
// per field (name/description/tools/model) rather than one long function
// with four sequential ifs -- mirrors ast-grep-rule-check's checks.ts,
// where each field/rule of a check gets its own small function and the
// check itself is the flatMap/concat over them. Each of these carries its
// own field's complexity instead of all four compounding into one number.
function checkFrontmatterName(file: RawFile, parsed: AgentFrontmatter): Failure[] {
  if (parsed.name === parsed.filenameStem) return []
  return [
    frontmatterFailure(
      file,
      `frontmatter name \`${parsed.name ?? '(missing)'}\` does not match filename stem \`${parsed.filenameStem}\``,
    ),
  ]
}

function checkFrontmatterDescription(file: RawFile, parsed: AgentFrontmatter): Failure[] {
  if (parsed.description && parsed.description.trim().length > 0) return []
  return [frontmatterFailure(file, 'frontmatter has no non-empty `description`')]
}

function checkFrontmatterTools(file: RawFile, parsed: AgentFrontmatter): Failure[] {
  if (!parsed.tools || parsed.tools.length === 0) {
    return [frontmatterFailure(file, 'frontmatter has no `tools` list')]
  }
  const unknown = parsed.tools.filter((tool) => !KNOWN_TOOLS.includes(tool))
  if (unknown.length === 0) return []
  return [
    frontmatterFailure(
      file,
      `\`tools\` includes unknown tool(s): ${unknown.join(', ')} -- known tools are ${KNOWN_TOOLS.join(', ')}`,
    ),
  ]
}

function checkFrontmatterModel(file: RawFile, parsed: AgentFrontmatter): Failure[] {
  if (parsed.model && KNOWN_MODELS.includes(parsed.model)) return []
  return [
    frontmatterFailure(file, `\`model\` \`${parsed.model ?? '(missing)'}\` is not one of: ${KNOWN_MODELS.join(', ')}`),
  ]
}

// One agent file's contribution to check 2, kept separate from the loop in
// checkAgentFrontmatterValid below -- mirrors ast-grep-rule-check's
// per-rule-then-flatMap split.
function checkOneAgentFrontmatter(file: RawFile): Failure[] {
  const parsed = parseAgentFrontmatter(file.path, file.text)
  if (!parsed.hasFrontmatter) {
    return [frontmatterFailure(file, 'no frontmatter block found (expected a leading `---`-delimited block)')]
  }
  return [
    ...checkFrontmatterName(file, parsed),
    ...checkFrontmatterDescription(file, parsed),
    ...checkFrontmatterTools(file, parsed),
    ...checkFrontmatterModel(file, parsed),
  ]
}

/**
 * Check 2: every .claude/agents/*.md file's frontmatter validates -- name
 * matches the filename, description is present, tools is a subset of the
 * known tool set, model is a known model.
 */
export function checkAgentFrontmatterValid(agentFiles: RawFile[]): Failure[] {
  return agentFiles.flatMap(checkOneAgentFrontmatter)
}

/**
 * Check 3: no backticked mention of a retired role (`qa`, `refactorer`,
 * `specifier`) without a historical qualifier nearby -- see roles.ts for
 * why the check is scoped to this short, git-verified list rather than a
 * generic "role-shaped token" scan.
 */
export function checkNoStaleRoleReferences(docFiles: RawFile[]): Failure[] {
  const failures: Failure[] = []
  for (const file of docFiles) {
    for (const reference of findStaleRoleReferences(file.text)) {
      failures.push({
        check: 'no-stale-role-references',
        file: file.path,
        message: `line ${reference.line} references retired role \`${reference.role}\` with no historical qualifier (old/former/then/merge/...) on the same line: "${reference.lineText}"`,
      })
    }
  }
  return failures
}

function cycleFailure(file: string, message: string): Failure {
  return { check: 'cycle-string-consistent', file, message }
}

// Guard 6: duplicate `pipeline` names, and two cycles rendering identically
// -- reported, not thrown, since neither prevents the mention pass below
// from running against whichever renderings the config does declare.
function checkDuplicateCycles(cycleConfigFile: RawFile, cycles: DeclaredCycle[]): Failure[] {
  const failures: Failure[] = []
  const seenPipelines = new Set<string>()
  for (const cycle of cycles) {
    if (seenPipelines.has(cycle.pipeline)) {
      failures.push(cycleFailure(cycleConfigFile.path, `pipeline "${cycle.pipeline}" is declared more than once`))
    }
    seenPipelines.add(cycle.pipeline)
  }
  const renderingOwners = new Map<string, string>()
  for (const cycle of cycles) {
    const rendering = renderCycle(cycle.roles)
    const owner = renderingOwners.get(rendering)
    if (owner !== undefined) {
      failures.push(
        cycleFailure(
          cycleConfigFile.path,
          `pipeline "${cycle.pipeline}" renders identically to pipeline "${owner}": "${rendering}"`,
        ),
      )
    } else {
      renderingOwners.set(rendering, cycle.pipeline)
    }
  }
  return failures
}

// Guards 4 and 5, the "mention pass": run only once the config itself is
// known-good (guards 2/3 and schema validation have already passed), so a
// bad config never cascades into a wall of mention-pass noise.
function checkCycleMentions(
  docFiles: RawFile[],
  knownRoles: ReadonlySet<string>,
  cycleConfigFile: RawFile,
  cycles: DeclaredCycle[],
): Failure[] {
  const renderings = cycles.map((cycle) => renderCycle(cycle.roles))
  const allMentions = docFiles.flatMap((file) =>
    findCycleMentions(file.text, knownRoles).map((mention) => ({ file: file.path, ...mention })),
  )

  // Guard 4: an inert declared cycle -- zero byte-identical mentions of it
  // anywhere -- subsumes the old global no-mention guard (still catching
  // arrow-glyph drift, since a wrong glyph produces zero mentions of every
  // declared rendering at once) and additionally catches a single stale or
  // unreferenced pipeline entry.
  const inertFailures = cycles
    .filter((cycle) => !allMentions.some((mention) => mention.text === renderCycle(cycle.roles)))
    .map((cycle) =>
      cycleFailure(
        cycleConfigFile.path,
        `pipeline "${cycle.pipeline}" (${renderCycle(cycle.roles)}) has zero byte-identical mentions anywhere in the docs`,
      ),
    )

  // Guard 5: a bare mention matching no declared rendering, byte-identity
  // only -- no fuzzy nearest-cycle matching.
  const renderingSet = new Set(renderings)
  const driftFailures = allMentions
    .filter((mention) => !renderingSet.has(mention.text))
    .map((mention) =>
      cycleFailure(
        mention.file,
        `line ${mention.line} has cycle string "${mention.text}", which matches none of the declared cycle rendering(s): ${renderings.map((rendering) => `"${rendering}"`).join(', ')}`,
      ),
    )

  return [...inertFailures, ...driftFailures]
}

/**
 * Check 4: every cycle-shaped string (role → role → ... → role) across the
 * docs matches a cycle declared in role-cycles.config.json -- that config is
 * the canonical rendering authority outright, not a vote among the mentions
 * found. Guards, in order: the config must itself parse and schema-validate;
 * it must declare at least one cycle; every declared role must be in the
 * derived roster (`knownRoles`) -- the load-bearing guard, since roster
 * drift would otherwise make both the declared cycle and stale mentions of
 * it vanish from the scan simultaneously; no duplicate `pipeline` name or
 * identically-rendering cycle; every declared cycle has at least one
 * byte-identical mention somewhere; and every mention matches some declared
 * rendering. A config-level failure (parse/schema, zero cycles, or an
 * unknown role) is reported and skips the mention pass entirely, so one bad
 * config does not cascade into unrelated mention-pass noise.
 */
export function checkCycleStringConsistent(
  docFiles: RawFile[],
  knownRoles: ReadonlySet<string>,
  cycleConfigFile: RawFile,
  cycleSchemaFile: RawFile,
): Failure[] {
  const parsed = parseRoleCyclesConfig(cycleConfigFile.text, cycleSchemaFile.text, cycleConfigFile.path)
  if (!parsed.ok) {
    return parsed.errors.map((message) => cycleFailure(cycleConfigFile.path, message))
  }

  const { cycles } = parsed.config
  if (cycles.length === 0) {
    return [
      cycleFailure(
        cycleConfigFile.path,
        'declares zero cycles -- an empty declaration must not read like a clean tree',
      ),
    ]
  }

  const unknownRoleFailures = cycles.flatMap((cycle) =>
    cycle.roles
      .filter((role) => !knownRoles.has(role))
      .map((role) =>
        cycleFailure(
          cycleConfigFile.path,
          `pipeline "${cycle.pipeline}" (${renderCycle(cycle.roles)}) declares role \`${role}\`, which is not in the derived roster: ${[...knownRoles].sort().join(', ')}`,
        ),
      ),
  )
  if (unknownRoleFailures.length > 0) return unknownRoleFailures

  return [
    ...checkDuplicateCycles(cycleConfigFile, cycles),
    ...checkCycleMentions(docFiles, knownRoles, cycleConfigFile, cycles),
  ]
}

/**
 * Check 5: every real rules/*.yml is named in the rule documentation file
 * (forward -- currently .claude/agents/articles/ast-grep-rules.md, read by
 * run.ts and handed in as ruleDocFile; see the comment there for the
 * invariant this file is meant to satisfy, "documented somewhere roles will
 * read", as distinct from "named in CLAUDE.md specifically"), and every
 * explicit `rules/<id>.yml` path mentioned in *any* doc file resolves to a
 * real rule file (reverse -- see rule-mentions.ts for why only path
 * mentions, not bare backticked ids, are used in this direction). The
 * reverse direction reads every docFiles entry independently, rather than
 * concatenating their text first, so a bad path is attributed to the actual
 * file it was found in -- CLAUDE.md, an article, or an agent file -- and
 * not blamed on ruleDocFile regardless of where it lives.
 */
export function checkRulesDocumented(ruleDocFile: RawFile, docFiles: RawFile[], ruleIds: string[]): Failure[] {
  const mentioned = extractMentionedRuleIds(ruleDocFile.text)
  const forwardFailures: Failure[] = ruleIds
    .filter((ruleId) => !mentioned.has(ruleId))
    .map((ruleId) => ({
      check: 'rules-documented',
      file: ruleDocFile.path,
      message: `rule \`${ruleId}\` (rules/${ruleId}.yml) is not named in ${ruleDocFile.path}`,
    }))

  const knownRuleIds = new Set(ruleIds)
  const reverseFailures: Failure[] = docFiles.flatMap((file) =>
    [...new Set(extractRulePathMentions(file.text))]
      .filter((pathMention) => !knownRuleIds.has(pathMention))
      .map((pathMention) => ({
        check: 'rules-documented',
        file: file.path,
        message: `${file.path} references \`rules/${pathMention}.yml\`, which does not exist`,
      })),
  )

  return [...forwardFailures, ...reverseFailures]
}

export interface CheckInput {
  docFiles: RawFile[]
  agentFiles: RawFile[]
  ruleDocFile: RawFile
  packageScripts: ReadonlySet<string>
  ruleIds: string[]
  cycleConfigFile: RawFile
  cycleSchemaFile: RawFile
}

export function checkAll(input: CheckInput): Failure[] {
  // The role vocabulary check4 builds its cycle pattern from is a fact about
  // which agent files exist, not about what their frontmatter says -- read it
  // off the filename rather than parsing the file, so a malformed frontmatter
  // block can't quietly shrink the alternation and make a cycle mention stop
  // being recognised as one. (checkAgentFrontmatterValid above is what holds
  // `name` and the filename stem in agreement, so the two never diverge.)
  const knownRoles = new Set(input.agentFiles.map((file) => filenameStemOf(file.path)))
  return [
    ...checkNpmRunReferencesResolve(input.docFiles, input.packageScripts),
    ...checkAgentFrontmatterValid(input.agentFiles),
    ...checkNoStaleRoleReferences(input.docFiles),
    ...checkCycleStringConsistent(input.docFiles, knownRoles, input.cycleConfigFile, input.cycleSchemaFile),
    ...checkRulesDocumented(input.ruleDocFile, input.docFiles, input.ruleIds),
  ]
}
