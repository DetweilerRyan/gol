// Declares which backlog/ lane names exist and what artifact shape each
// wears -- 'flat' for a bare <slug>.md file, or 'folder' for a <slug>/<item>
// folder naming its item's basename. Pure text-in, value-out: no node:fs, no
// node:process here (rules/no-process-io-outside-run-in-hook-programs.yml
// covers this directory). run.ts owns reading board-lanes.config.json and
// hands the raw text, or undefined when the read failed, to
// parseLaneDeclarations.

/** One lane's declared artifact shape. */
export type LaneShape = { shape: 'flat' } | { shape: 'folder'; item: string }

/**
 * Every declared lane, keyed by lane name. A `Map`, not a `Record` -- lane
 * names are path-derived keys, and a `Record` lookup on `__proto__` or
 * `constructor` would answer from the prototype rather than the data.
 */
export type LaneDeclarations = ReadonlyMap<string, LaneShape>

/**
 * The result of validating `board-lanes.config.json`'s text. `declared`
 * carries the parsed map. `unavailable` carries a human-readable `reason`
 * and never a partial map -- a caller that cannot classify at all is the
 * only outcome any validation failure produces.
 */
export type LaneDeclarationsLookup =
  { kind: 'declared'; lanes: LaneDeclarations } | { kind: 'unavailable'; reason: string }

function unavailable(reason: string): LaneDeclarationsLookup {
  return { kind: 'unavailable', reason }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isLaneName(value: string): boolean {
  return value.length > 0 && !value.includes('/')
}

type ParsedLaneShape = { shape: LaneShape } | { reason: string }

function parseLaneShape(name: string, value: unknown): ParsedLaneShape {
  if (!isPlainObject(value)) return { reason: `lane '${name}': value is not an object` }
  const keys = Object.keys(value)

  if (value.shape === 'flat') {
    if (keys.length !== 1) return { reason: `lane '${name}': a 'flat' lane must declare only "shape"` }
    return { shape: { shape: 'flat' } }
  }

  if (value.shape === 'folder') {
    if (keys.length !== 2 || !('item' in value)) {
      return { reason: `lane '${name}': a 'folder' lane must declare exactly "shape" and "item"` }
    }
    const item = value.item
    if (typeof item !== 'string' || item.length === 0 || item.includes('/') || !item.endsWith('.md')) {
      return { reason: `lane '${name}': "item" must be a non-empty, '/'-free '*.md' basename` }
    }
    return { shape: { shape: 'folder', item } }
  }

  return { reason: `lane '${name}': "shape" must be 'flat' or 'folder'` }
}

/**
 * Validates and parses `board-lanes.config.json`'s text into a lane-name to
 * shape map. `undefined` stands for "the file was missing or unreadable" --
 * the caller writes absence as a value rather than as an omitted argument.
 * Every failure -- malformed JSON, a missing or empty "lanes" object, an
 * invalid lane name, an invalid shape -- returns `unavailable` with a
 * reason; there is no partial-map outcome. A top-level `$schema` key is
 * tolerated by name and otherwise ignored.
 */
export function parseLaneDeclarations(text: string | undefined): LaneDeclarationsLookup {
  if (text === undefined) return unavailable('declaration file missing or unreadable')

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return unavailable('declaration file is not valid JSON')
  }

  if (!isPlainObject(parsed)) return unavailable('declaration file is not a JSON object')

  const lanesValue = parsed.lanes
  if (!isPlainObject(lanesValue)) return unavailable('declaration file has no "lanes" object')

  const entries = Object.entries(lanesValue)
  // The inertness guard: an empty "lanes" object would leave every board
  // path undeclared, silently downgrading every lane's shape check to an
  // undeclared-lane warning -- the exact fail-open direction this slice
  // exists to close. Same principle as scripts/gate-report.ts's
  // checkNonEmpty.
  if (entries.length === 0) return unavailable('declaration file\'s "lanes" object has no entries')

  const lanes = new Map<string, LaneShape>()
  for (const [name, value] of entries) {
    if (!isLaneName(name)) return unavailable(`lane name '${name}' is empty or contains '/'`)
    const result = parseLaneShape(name, value)
    if ('reason' in result) return unavailable(result.reason)
    lanes.set(name, result.shape)
  }

  return { kind: 'declared', lanes }
}
