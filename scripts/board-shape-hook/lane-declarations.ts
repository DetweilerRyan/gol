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

function parseFlatLane(name: string, keys: string[]): ParsedLaneShape {
  if (keys.length !== 1) return { reason: `lane '${name}': a 'flat' lane must declare only "shape"` }
  return { shape: { shape: 'flat' } }
}

function isValidItemBasename(item: unknown): item is string {
  return typeof item === 'string' && item.length > 0 && !item.includes('/') && item.endsWith('.md')
}

function parseFolderLane(name: string, value: Record<string, unknown>, keys: string[]): ParsedLaneShape {
  if (keys.length !== 2 || !('item' in value)) {
    return { reason: `lane '${name}': a 'folder' lane must declare exactly "shape" and "item"` }
  }
  const item = value.item
  if (!isValidItemBasename(item)) {
    return { reason: `lane '${name}': "item" must be a non-empty, '/'-free '*.md' basename` }
  }
  return { shape: { shape: 'folder', item } }
}

function parseLaneShape(name: string, value: unknown): ParsedLaneShape {
  if (!isPlainObject(value)) return { reason: `lane '${name}': value is not an object` }
  const keys = Object.keys(value)

  if (value.shape === 'flat') return parseFlatLane(name, keys)
  if (value.shape === 'folder') return parseFolderLane(name, value, keys)

  return { reason: `lane '${name}': "shape" must be 'flat' or 'folder'` }
}

type ParsedJson = { value: unknown } | { reason: string }

function parseJsonText(text: string): ParsedJson {
  try {
    return { value: JSON.parse(text) }
  } catch {
    return { reason: 'declaration file is not valid JSON' }
  }
}

type LaneEntries = { entries: Array<[string, unknown]> } | { reason: string }

function extractLaneEntries(parsed: unknown): LaneEntries {
  if (!isPlainObject(parsed)) return { reason: 'declaration file is not a JSON object' }

  const lanesValue = parsed.lanes
  if (!isPlainObject(lanesValue)) return { reason: 'declaration file has no "lanes" object' }

  const entries = Object.entries(lanesValue)
  // The inertness guard: an empty "lanes" object would leave every board
  // path undeclared, silently downgrading every lane's shape check to an
  // undeclared-lane warning -- the exact fail-open direction this slice
  // exists to close. Same principle as scripts/gate-report.ts's
  // checkNonEmpty.
  if (entries.length === 0) return { reason: 'declaration file\'s "lanes" object has no entries' }

  return { entries }
}

type BuiltLanes = { lanes: LaneDeclarations } | { reason: string }

function buildLaneMap(entries: Array<[string, unknown]>): BuiltLanes {
  const lanes = new Map<string, LaneShape>()
  for (const [name, value] of entries) {
    if (!isLaneName(name)) return { reason: `lane name '${name}' is empty or contains '/'` }
    const result = parseLaneShape(name, value)
    if ('reason' in result) return { reason: result.reason }
    lanes.set(name, result.shape)
  }
  return { lanes }
}

/**
 * Validates and parses `board-lanes.config.json`'s text into a lane-name to
 * shape map. `undefined` stands for "the file was missing or unreadable" --
 * the caller writes absence as a value rather than as an omitted argument.
 * Every failure -- malformed JSON, a missing or empty "lanes" object, an
 * invalid lane name, an invalid shape -- returns `unavailable` with a
 * reason; there is no partial-map outcome. Only the top-level `lanes` key is
 * read: any other top-level key, `$schema` among them, is ignored (the JSON
 * schema file gives editors the strict view).
 */
export function parseLaneDeclarations(text: string | undefined): LaneDeclarationsLookup {
  if (text === undefined) return unavailable('declaration file missing or unreadable')

  const parsedJson = parseJsonText(text)
  if ('reason' in parsedJson) return unavailable(parsedJson.reason)

  const entriesResult = extractLaneEntries(parsedJson.value)
  if ('reason' in entriesResult) return unavailable(entriesResult.reason)

  const lanesResult = buildLaneMap(entriesResult.entries)
  if ('reason' in lanesResult) return unavailable(lanesResult.reason)

  return { kind: 'declared', lanes: lanesResult.lanes }
}
