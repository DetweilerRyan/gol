// The five checks over `.claude/**` + CLAUDE.md described in CLAUDE.md's
// "Custom quality tooling" section: mechanical facts about the pipeline's
// own documentation, mirroring ast-grep-rule-check's checks.ts in shape --
// every check here is a binary fact, so this program (like that one) is a
// gate, not advisory. Parsing/extraction for each check lives in its own
// file (npm-run-refs.ts, agent-frontmatter.ts, roles.ts, cycle-string.ts,
// rule-mentions.ts); this file is just the five checks plus checkAll, which
// runs them all -- the surrounding orchestration (reading files off disk,
// formatting the exit code/output lines) lives in run.ts/decide.ts instead.

import { filenameStemOf, parseAgentFrontmatter, type AgentFrontmatter } from './agent-frontmatter.ts'
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
const KNOWN_MODELS = ['opus', 'sonnet', 'haiku']

// Check 1: every `npm run <script>` reference in the docs names a real
// package.json script. One failure per distinct (file, script) pair, not
// one per occurrence -- a script mentioned wrong three times in the same
// file is one typo to fix, not three failures to wade through.
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

// Check 2: every .claude/agents/*.md file's frontmatter validates -- name
// matches the filename, description is present, tools is a subset of the
// known tool set, model is a known model.
export function checkAgentFrontmatterValid(agentFiles: RawFile[]): Failure[] {
  return agentFiles.flatMap(checkOneAgentFrontmatter)
}

// Check 3: no backticked mention of a retired role (`qa`, `refactorer`,
// `specifier`) without a historical qualifier nearby -- see roles.ts for
// why the check is scoped to this short, git-verified list rather than a
// generic "role-shaped token" scan.
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

// Check 4: every cycle-shaped string (role → role → ... → role) across the
// docs is byte-identical. Reports every mention that differs from the
// most-common form found, and reports its own failure if no cycle mention
// was found anywhere at all -- an empty result set here would otherwise
// look identical to a clean repo, the same failure mode
// ast-grep-rule-check's checkAnyRulesFound exists to catch.
export function checkCycleStringConsistent(docFiles: RawFile[], knownRoles: ReadonlySet<string>): Failure[] {
  const allMentions = docFiles.flatMap((file) =>
    findCycleMentions(file.text, knownRoles).map((mention) => ({ file: file.path, ...mention })),
  )
  if (allMentions.length === 0) {
    return [
      {
        check: 'cycle-string-consistent',
        file: '(none)',
        message:
          'no cycle-shaped string (role → role → ...) was found anywhere -- check the arrow glyph or the known-roles list',
      },
    ]
  }
  const counts = new Map<string, number>()
  for (const mention of allMentions) counts.set(mention.text, (counts.get(mention.text) ?? 0) + 1)
  const [canonical] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  return allMentions
    .filter((mention) => mention.text !== canonical)
    .map((mention) => ({
      check: 'cycle-string-consistent',
      file: mention.file,
      message: `line ${mention.line} has cycle string "${mention.text}", which differs from the canonical form seen elsewhere: "${canonical}"`,
    }))
}

// Check 5: every real rules/*.yml is named in CLAUDE.md (forward), and
// every explicit `rules/<id>.yml` path CLAUDE.md names resolves to a real
// rule file (reverse -- see rule-mentions.ts for why only path mentions,
// not bare backticked ids, are used in this direction).
export function checkRulesNamedInClaudeMd(claudeMdText: string, ruleIds: string[]): Failure[] {
  const mentioned = extractMentionedRuleIds(claudeMdText)
  const forwardFailures: Failure[] = ruleIds
    .filter((ruleId) => !mentioned.has(ruleId))
    .map((ruleId) => ({
      check: 'rules-named-in-claude-md',
      file: 'CLAUDE.md',
      message: `rule \`${ruleId}\` (rules/${ruleId}.yml) is not named in CLAUDE.md`,
    }))

  const knownRuleIds = new Set(ruleIds)
  const reverseFailures: Failure[] = [...new Set(extractRulePathMentions(claudeMdText))]
    .filter((pathMention) => !knownRuleIds.has(pathMention))
    .map((pathMention) => ({
      check: 'rules-named-in-claude-md',
      file: 'CLAUDE.md',
      message: `CLAUDE.md references \`rules/${pathMention}.yml\`, which does not exist`,
    }))

  return [...forwardFailures, ...reverseFailures]
}

export interface CheckInput {
  docFiles: RawFile[]
  agentFiles: RawFile[]
  claudeMdText: string
  packageScripts: ReadonlySet<string>
  ruleIds: string[]
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
    ...checkCycleStringConsistent(input.docFiles, knownRoles),
    ...checkRulesNamedInClaudeMd(input.claudeMdText, input.ruleIds),
  ]
}
