export interface AgentFrontmatter {
  path: string
  filenameStem: string
  hasFrontmatter: boolean
  name: string | undefined
  description: string | undefined
  tools: string[] | undefined
  model: string | undefined
}

const FRONTMATTER_BLOCK = /^---\n([\s\S]*?)\n---\n/
// FRONTMATTER_FIELD's trailing `$` assumes an LF-only line (this repo's own
// convention, via .gitattributes/Prettier) -- a CRLF line leaves a trailing
// `\r` that `.` never matches (it's a line terminator, not an ordinary
// character), so `$` then can't reach the true end of the raw line and the
// whole field silently fails to parse. Pinned by
// agent-frontmatter.test.ts's CRLF test rather than "fixed" by stripping
// `\r`, since no file in this repo is expected to have one.
const FRONTMATTER_FIELD = /^([A-Za-z_-]+):\s?(.*)$/

export function filenameStemOf(relativePath: string): string {
  return relativePath.slice(relativePath.lastIndexOf('/') + 1).replace(/\.md$/, '')
}

function parseFrontmatterFields(block: string): Map<string, string> {
  const fields = new Map<string, string>()
  for (const line of block.split('\n')) {
    const match = line.match(FRONTMATTER_FIELD)
    if (match) fields.set(match[1], match[2])
  }
  return fields
}

function toToolsList(value: string | undefined): string[] | undefined {
  if (value === undefined) return undefined
  return value
    .split(',')
    .map((tool) => tool.trim())
    .filter((tool) => tool.length > 0)
}

/**
 * Parses one `.claude/agents/*.md` file's YAML-shaped frontmatter block into
 * the fields {@link AgentFrontmatter} lists. Deliberately not a real YAML
 * parser: every field must be written on its own line (no multi-line
 * values), so a line-anchored `key: value` regex reads a long, hand-written
 * agent description straight through even when it contains a literal `": "`
 * sequence that a real YAML parser would read as a nested mapping and
 * refuse.
 */
// Measured against the `yaml` package already a dependency of this repo: it
// fails to parse 2 of the 5 agent files as they stand (architect.md,
// coder.md) for exactly that reason.
export function parseAgentFrontmatter(relativePath: string, rawText: string): AgentFrontmatter {
  const filenameStem = filenameStemOf(relativePath)
  const match = rawText.match(FRONTMATTER_BLOCK)
  if (!match) {
    return {
      path: relativePath,
      filenameStem,
      hasFrontmatter: false,
      name: undefined,
      description: undefined,
      tools: undefined,
      model: undefined,
    }
  }
  const fields = parseFrontmatterFields(match[1])
  return {
    path: relativePath,
    filenameStem,
    hasFrontmatter: true,
    name: fields.get('name'),
    description: fields.get('description'),
    tools: toToolsList(fields.get('tools')),
    model: fields.get('model'),
  }
}
