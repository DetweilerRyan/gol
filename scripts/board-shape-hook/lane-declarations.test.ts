import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseLaneDeclarations } from './lane-declarations.ts'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..')

describe('parseLaneDeclarations -- unavailable rows', () => {
  it.each([
    {
      name: 'text is undefined -- the file was missing or unreadable',
      text: undefined,
      reason: 'declaration file missing or unreadable',
    },
    {
      name: 'text is not valid JSON',
      text: '{ not json',
      reason: 'declaration file is not valid JSON',
    },
    {
      name: 'the parsed value is not an object',
      text: '["ideas"]',
      reason: 'declaration file is not a JSON object',
    },
    {
      name: 'the parsed value is null -- typeof null is "object", so the null check is load-bearing',
      text: 'null',
      reason: 'declaration file is not a JSON object',
    },
    {
      name: '"lanes" is missing',
      text: '{}',
      reason: 'declaration file has no "lanes" object',
    },
    {
      name: '"lanes" is not an object',
      text: '{"lanes": []}',
      reason: 'declaration file has no "lanes" object',
    },
    {
      name: '"lanes" has no entries -- the inertness guard',
      text: '{"lanes": {}}',
      reason: 'declaration file\'s "lanes" object has no entries',
    },
    {
      name: 'a lane name contains a "/"',
      text: '{"lanes": {"a/b": {"shape": "flat"}}}',
      reason: "lane name 'a/b' is empty or contains '/'",
    },
    {
      name: 'a lane name is the empty string',
      text: '{"lanes": {"": {"shape": "flat"}}}',
      reason: "lane name '' is empty or contains '/'",
    },
    {
      name: 'a lane value is not an object',
      text: '{"lanes": {"ideas": "flat"}}',
      reason: "lane 'ideas': value is not an object",
    },
    {
      name: 'a lane\'s "shape" is neither "flat" nor "folder"',
      text: '{"lanes": {"ideas": {"shape": "nested"}}}',
      reason: "lane 'ideas': \"shape\" must be 'flat' or 'folder'",
    },
    {
      name: 'a "flat" lane carries an "item" key',
      text: '{"lanes": {"ideas": {"shape": "flat", "item": "proposal.md"}}}',
      reason: "lane 'ideas': a 'flat' lane must declare only \"shape\"",
    },
    {
      name: 'a "folder" lane has no "item" key',
      text: '{"lanes": {"ready": {"shape": "folder"}}}',
      reason: 'lane \'ready\': a \'folder\' lane must declare exactly "shape" and "item"',
    },
    {
      name: 'a "folder" lane carries an extra key beside "shape" and "item"',
      text: '{"lanes": {"ready": {"shape": "folder", "item": "proposal.md", "extra": true}}}',
      reason: 'lane \'ready\': a \'folder\' lane must declare exactly "shape" and "item"',
    },
    {
      name: 'a "folder" lane\'s "item" is empty',
      text: '{"lanes": {"ready": {"shape": "folder", "item": ""}}}',
      reason: "lane 'ready': \"item\" must be a non-empty, '/'-free '*.md' basename",
    },
    {
      name: 'a "folder" lane\'s "item" contains a "/"',
      text: '{"lanes": {"ready": {"shape": "folder", "item": "sub/proposal.md"}}}',
      reason: "lane 'ready': \"item\" must be a non-empty, '/'-free '*.md' basename",
    },
    {
      name: 'a "folder" lane\'s "item" does not end in ".md"',
      text: '{"lanes": {"ready": {"shape": "folder", "item": "proposal.txt"}}}',
      reason: "lane 'ready': \"item\" must be a non-empty, '/'-free '*.md' basename",
    },
    {
      // A JSON array can carry a `.length`, an `.includes` and (via a JSON-encoded
      // string element) look superficially item-shaped -- this pins that the type
      // check runs before any of that, rather than an array reaching `.endsWith`
      // and throwing past the validator.
      name: 'a "folder" lane\'s "item" is not a string (an array)',
      text: '{"lanes": {"ready": {"shape": "folder", "item": ["proposal.md"]}}}',
      reason: "lane 'ready': \"item\" must be a non-empty, '/'-free '*.md' basename",
    },
  ])('$name', ({ text, reason }) => {
    expect(parseLaneDeclarations(text)).toEqual({ kind: 'unavailable', reason })
  })
})

describe('parseLaneDeclarations -- declared rows', () => {
  it('tolerates a top-level "$schema" key by name', () => {
    const result = parseLaneDeclarations(
      '{"$schema": "./schemas/board-lanes.schema.json", "lanes": {"ideas": {"shape": "flat"}}}',
    )
    expect(result).toEqual({ kind: 'declared', lanes: new Map([['ideas', { shape: 'flat' }]]) })
  })

  it('parses a "folder" lane\'s "item"', () => {
    const result = parseLaneDeclarations('{"lanes": {"ready": {"shape": "folder", "item": "proposal.md"}}}')
    expect(result).toEqual({
      kind: 'declared',
      lanes: new Map([['ready', { shape: 'folder', item: 'proposal.md' }]]),
    })
  })

  it('answers a prototype-shaped lane name from the data, never from Object.prototype', () => {
    // A Record lookup on 'toString' or 'constructor' answers from the prototype instead of
    // the data -- the whole reason this module returns a Map. Declaring lanes named exactly
    // those two proves parseLaneDeclarations does not launder its keys through a plain object
    // lookup anywhere between JSON.parse and the returned Map.
    const result = parseLaneDeclarations('{"lanes": {"toString": {"shape": "flat"}, "constructor": {"shape": "flat"}}}')
    expect(result.kind).toBe('declared')
    const lanes = (result as { kind: 'declared'; lanes: Map<string, unknown> }).lanes
    expect(lanes.get('toString')).toEqual({ shape: 'flat' })
    expect(lanes.get('constructor')).toEqual({ shape: 'flat' })
    // A key that was never declared must read back as absent, not as whatever
    // Object.prototype happens to carry under that name.
    expect(lanes.get('hasOwnProperty')).toBeUndefined()
  })
})

describe('parseLaneDeclarations -- the tracked board-lanes.config.json', () => {
  it('parses as declared, with exactly the three shipped lanes', () => {
    const text = readFileSync(path.join(REPO_ROOT, 'board-lanes.config.json'), 'utf8')

    const result = parseLaneDeclarations(text)

    expect(result).toEqual({
      kind: 'declared',
      lanes: new Map([
        ['ideas', { shape: 'flat' }],
        ['ready', { shape: 'folder', item: 'proposal.md' }],
        ['done', { shape: 'folder', item: 'proposal.md' }],
      ]),
    })
  })
})
