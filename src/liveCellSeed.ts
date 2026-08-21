import { cellKey, type LiveCells } from './gameOfLife'

// Deterministic live-cell seeding for the render-performance harness: lets a
// Playwright test ask for "50,000 live cells" via the URL instead of
// clicking that many cells one at a time. Framework-free and pure --
// rules/no-build-env-in-domain.yml and rules/no-dom-in-domain.yml exist
// specifically to keep the import.meta.env branch and the raw
// location.search read out of this module; parseSeedRequest takes the query
// string as a plain argument instead.

export interface SeedRequest {
  count: number
  spread: number
  seed: number
}

const DEFAULT_SPREAD = 200
const DEFAULT_SEED = 1

// Parses a `?cells=...&spread=...&seed=...` query string. `spread`/`seed`
// default when absent; `cells` is required (its absence means "no seeding
// requested"). Every other malformed or unsatisfiable input also collapses
// to `undefined` rather than throwing, so a typo'd URL fails quietly instead
// of hanging or crashing the harness.
export function parseSeedRequest(search: string): SeedRequest | undefined {
  const params = new URLSearchParams(search)
  const cellsRaw = params.get('cells')
  if (cellsRaw === null) return undefined

  const count = parseNonNegativeInteger(cellsRaw)
  const spread = parseParamWithDefault(params, 'spread', DEFAULT_SPREAD)
  const seed = parseParamWithDefault(params, 'seed', DEFAULT_SEED)
  if (count === undefined || spread === undefined || seed === undefined) return undefined

  const side = 2 * spread + 1
  const capacity = side * side
  if (count > capacity) return undefined

  return { count, spread, seed }
}

// `spread`/`seed` fall back to their default only when the query string
// omits the key entirely -- an explicit but malformed value (e.g.
// `?spread=abc`) still parses to `undefined` rather than silently defaulting,
// so parseSeedRequest can tell "not given" from "given badly."
function parseParamWithDefault(params: URLSearchParams, key: string, fallback: number): number | undefined {
  if (!params.has(key)) return fallback
  return parseNonNegativeInteger(params.get(key))
}

// Digits only -- no sign, no decimal point, no exponent -- so this rejects
// "-1", "1.5", "1e3", and non-numeric junk in one pass rather than accepting
// them via Number() and then filtering.
function parseNonNegativeInteger(raw: string | null): number | undefined {
  if (raw === null || !/^\d+$/.test(raw)) return undefined
  const value = Number(raw)
  return Number.isSafeInteger(value) ? value : undefined
}

// Builds exactly `request.count` live cells, deterministically from
// `request.seed`, placed within the [-spread, spread] square. Draws a
// capacity-space index per cell from a Math.imul-based LCG (its high bits,
// which are the well-distributed ones) and resolves collisions by linear
// probing forward through that same capacity space rather than redrawing.
// Because parseSeedRequest already guarantees count <= capacity for every
// request it can produce, a free slot always exists and this loop is
// bounded by capacity -- no iteration cap, no unreachable defensive throw.
export function buildSeededLiveCells(request: SeedRequest): LiveCells {
  const { count, spread, seed } = request
  const side = 2 * spread + 1
  const capacity = side * side

  const live: LiveCells = new Set()
  const occupied = new Set<number>()
  let state = seed >>> 0

  for (let i = 0; i < count; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    let index = Math.floor((state / 4294967296) * capacity)
    while (occupied.has(index)) {
      index = (index + 1) % capacity
    }
    occupied.add(index)

    const x = (index % side) - spread
    const y = Math.floor(index / side) - spread
    live.add(cellKey(x, y))
  }

  return live
}
