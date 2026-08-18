// Type-aware mutation of a single Gherkin example cell value, following the
// rule ordering from https://github.com/unclebob/Acceptance-Pipeline-Specification's
// mutator-spec.md. Mutations are deterministic for a given (seedKey, value)
// pair so repeated runs produce identical, diffable mutants.

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

function hashString(input) {
  let h = 1779033703 ^ input.length
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

// mulberry32
export function seededRandom(seedString) {
  let seed = hashString(seedString)
  return function next() {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function nonzeroDelta(rand, max) {
  let delta = 0
  while (delta === 0) delta = Math.floor(rand() * (max * 2 + 1)) - max
  return delta
}

function randomChar(rand) {
  return ALPHABET[Math.floor(rand() * ALPHABET.length)]
}

function differentChar(rand, exclude) {
  const index = Math.floor(rand() * ALPHABET.length)
  const ch = ALPHABET[index]
  return ch === exclude ? ALPHABET[(index + 1) % ALPHABET.length] : ch
}

function mutateString(value, rand) {
  if (value.length === 0) return randomChar(rand)

  const strategies =
    value.length < 2 ? ['insert', 'delete', 'replace', 'case'] : ['insert', 'delete', 'replace', 'swap', 'case']
  const strategy = strategies[Math.floor(rand() * strategies.length)]
  const i = Math.floor(rand() * value.length)

  switch (strategy) {
    case 'insert':
      return value.slice(0, i) + randomChar(rand) + value.slice(i)
    case 'delete':
      return value.slice(0, i) + value.slice(i + 1)
    case 'replace':
      return value.slice(0, i) + differentChar(rand, value[i]) + value.slice(i + 1)
    case 'swap': {
      const j = i === value.length - 1 ? i - 1 : i + 1
      const chars = value.split('')
      ;[chars[i], chars[j]] = [chars[j], chars[i]]
      return chars.join('')
    }
    case 'case': {
      const ch = value[i]
      const swapped = ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase()
      return swapped === ch
        ? value.slice(0, i) + randomChar(rand) + value.slice(i + 1)
        : value.slice(0, i) + swapped + value.slice(i + 1)
    }
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/
const ISO_DURATION = /^P(?=\d|T)(\d+Y)?(\d+M)?(\d+D)?(T(\d+H)?(\d+M)?(\d+S)?)?$/

export function mutateValue(originalValue, seedKey) {
  const rand = seededRandom(`${seedKey}::${originalValue}`)

  if (originalValue.includes(',')) {
    const parts = originalValue.split(',')
    const mutableIndexes = parts.map((_, i) => i).filter((i) => parts[i].trim().length > 0)
    if (mutableIndexes.length > 0) {
      const target = mutableIndexes[Math.floor(rand() * mutableIndexes.length)]
      const trimmed = parts[target].trim()
      parts[target] = parts[target].replace(trimmed, mutateValue(trimmed, `${seedKey}[${target}]`))
      return parts.join(',')
    }
  }

  if (/^true$/i.test(originalValue)) return matchCase(originalValue, 'false')
  if (/^false$/i.test(originalValue)) return matchCase(originalValue, 'true')

  if (/^(null|nil|none)$/i.test(originalValue)) {
    return mutateString(originalValue, rand)
  }

  if (/^-?\d+$/.test(originalValue)) {
    return String(parseInt(originalValue, 10) + nonzeroDelta(rand, 9))
  }

  if (/^-?\d+\.\d+$/.test(originalValue)) {
    const decimals = originalValue.split('.')[1].length
    const magnitude = Math.max(1, Number(`1e-${decimals - 1}`))
    let delta = 0
    while (delta === 0) delta = Number((rand() * 2 - 1) * magnitude || 0)
    return (parseFloat(originalValue) + delta).toFixed(decimals)
  }

  if (ISO_DATE.test(originalValue)) {
    const d = new Date(`${originalValue}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + nonzeroDelta(rand, 5))
    return d.toISOString().slice(0, 10)
  }

  if (ISO_DATETIME.test(originalValue)) {
    const d = new Date(originalValue)
    d.setUTCMinutes(d.getUTCMinutes() + nonzeroDelta(rand, 30))
    return d.toISOString()
  }

  if (ISO_DURATION.test(originalValue) && originalValue !== 'P') {
    const match = originalValue.match(/\d+/)
    if (match) {
      const bumped = Math.max(1, parseInt(match[0], 10) + nonzeroDelta(rand, 3))
      return originalValue.replace(match[0], String(bumped))
    }
  }

  return mutateString(originalValue, rand)
}

function matchCase(original, replacement) {
  return original[0] === original[0].toUpperCase() ? replacement[0].toUpperCase() + replacement.slice(1) : replacement
}
