// Parses one .claude/agents/*.md file's YAML-shaped frontmatter block into
// the four fields checks.ts validates. Deliberately NOT a real YAML parser:
// several agent descriptions are long, hand-written prose containing a
// literal ": " sequence (e.g. "REVIEW (the default, and its slot in the
// cycle) -- invoke after..."), which a real YAML parser reads as a nested
// mapping and refuses -- measured against the `yaml` package already a
// dependency of this repo, it fails to parse 2 of the 5 agent files today
// (architect.md, coder.md) for exactly that reason. Every field in this
// frontmatter format is written on exactly one line by this repo's own
// convention (no multi-line values), so a line-anchored `key: value` regex
// reads every field exactly as intended without choking on the prose.

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
