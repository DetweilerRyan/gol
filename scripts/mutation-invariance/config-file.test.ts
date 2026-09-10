import { describe, expect, it } from 'vitest'
import { parseConfig } from './config-file.ts'

// A schema fixture built in-memory, kept structurally faithful to
// schemas/mutation-invariance.schema.json (draft-07, the three ajv traps
// from that file's own header comment) but owned by this test file rather
// than read off disk -- this invocation's tests use in-memory fixtures
// only, never a live-tree read.
const SCHEMA = JSON.stringify({
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  additionalProperties: false,
  required: ['scope', 'allow', 'absent'],
  properties: {
    $schema: { type: 'string' },
    scope: { type: 'string' },
    allow: { type: 'array', items: { $ref: '#/definitions/allowEntry' } },
    absent: { type: 'array', items: { $ref: '#/definitions/absentEntry' } },
  },
  definitions: {
    path: { type: 'string', pattern: '^[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*(/\\*\\*)?$' },
    allowEntry: {
      type: 'object',
      additionalProperties: false,
      required: ['path', 'securedBy'],
      properties: {
        path: { $ref: '#/definitions/path' },
        securedBy: { enum: ['vitest-exclude', 'stryker-ignore-patterns', 'written-argument'] },
        argument: { type: 'string' },
        verifiedOn: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      },
      if: { properties: { securedBy: { const: 'written-argument' } } },
      then: {
        required: ['argument', 'verifiedOn'],
        properties: { path: { type: 'string', pattern: '^[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*$' } },
      },
      else: {
        properties: { path: { type: 'string', pattern: '^[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*/\\*\\*$' } },
      },
    },
    absentEntry: {
      type: 'object',
      additionalProperties: false,
      required: ['path', 'reason'],
      properties: { path: { $ref: '#/definitions/path' }, reason: { type: 'string' } },
    },
  },
})

const VALID_CONFIG = JSON.stringify({
  scope: 'npm run test:mutation',
  allow: [
    { path: 'features/**', securedBy: 'stryker-ignore-patterns' },
    { path: 'ideas/**', securedBy: 'vitest-exclude' },
    { path: 'CLAUDE.md', securedBy: 'written-argument', argument: 'never mutated', verifiedOn: '2026-09-08' },
  ],
  absent: [{ path: 'src/**', reason: "stryker's own mutate scope" }],
})

describe('parseConfig', () => {
  it('returns the parsed config and no failures for a schema-valid config', () => {
    const { config, failures } = parseConfig(VALID_CONFIG, SCHEMA, 'mutation-invariance.config.json')
    expect(failures).toEqual([])
    expect(config?.scope).toBe('npm run test:mutation')
    expect(config?.allow).toHaveLength(3)
    expect(config?.absent).toHaveLength(1)
  })

  it('accepts a config carrying its own $schema key', () => {
    const withSchemaKey = JSON.stringify({
      $schema: './schemas/mutation-invariance.schema.json',
      ...JSON.parse(VALID_CONFIG),
    })
    const { config, failures } = parseConfig(withSchemaKey, SCHEMA, 'mutation-invariance.config.json')
    expect(failures).toEqual([])
    expect(config).toBeDefined()
  })

  it('fails on malformed JSON in the config text, attributing the failure to configPath', () => {
    const { config, failures } = parseConfig('{ not json', SCHEMA, 'mutation-invariance.config.json')
    expect(config).toBeUndefined()
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('config-parse')
    expect(failures[0].file).toBe('mutation-invariance.config.json')
    expect(failures[0].message).toContain('invalid JSON')
  })

  it('fails on malformed JSON in the schema text, attributing the failure to the schema file', () => {
    const { config, failures } = parseConfig(VALID_CONFIG, '{ not json', 'mutation-invariance.config.json')
    expect(config).toBeUndefined()
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('schema-parse')
    expect(failures[0].file).toBe('schemas/mutation-invariance.schema.json')
  })

  it('fails when the schema itself does not compile', () => {
    const brokenSchema = JSON.stringify({ type: 'object', properties: { foo: { type: 'not-a-real-type' } } })
    const { config, failures } = parseConfig(VALID_CONFIG, brokenSchema, 'mutation-invariance.config.json')
    expect(config).toBeUndefined()
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('schema-compile')
  })

  it('reports every ajv error when the config violates the schema, with allErrors: true', () => {
    const badConfig = JSON.stringify({ scope: 'x', allow: [{ path: 'ideas/**' }], absent: [] })
    const { config, failures } = parseConfig(badConfig, SCHEMA, 'mutation-invariance.config.json')
    expect(config).toBeUndefined()
    expect(failures.length).toBeGreaterThan(0)
    expect(failures.every((failure) => failure.check === 'schema-valid')).toBe(true)
    expect(failures.every((failure) => failure.file === 'mutation-invariance.config.json')).toBe(true)
  })

  it('rejects an unknown top-level property (additionalProperties: false)', () => {
    const badConfig = JSON.stringify({ ...JSON.parse(VALID_CONFIG), extra: true })
    const { failures } = parseConfig(badConfig, SCHEMA, 'mutation-invariance.config.json')
    expect(failures.length).toBeGreaterThan(0)
  })

  it('requires argument and verifiedOn for a written-argument entry', () => {
    const badConfig = JSON.stringify({
      scope: 'x',
      allow: [{ path: 'CLAUDE.md', securedBy: 'written-argument' }],
      absent: [],
    })
    const { failures } = parseConfig(badConfig, SCHEMA, 'mutation-invariance.config.json')
    expect(failures.length).toBeGreaterThan(0)
  })

  it('rejects a written-argument entry using the dir/** form', () => {
    const badConfig = JSON.stringify({
      scope: 'x',
      allow: [{ path: 'ideas/**', securedBy: 'written-argument', argument: 'x', verifiedOn: '2026-09-08' }],
      absent: [],
    })
    const { failures } = parseConfig(badConfig, SCHEMA, 'mutation-invariance.config.json')
    expect(failures.length).toBeGreaterThan(0)
  })

  it('rejects a vitest-exclude entry not using the dir/** form', () => {
    const badConfig = JSON.stringify({
      scope: 'x',
      allow: [{ path: 'ideas', securedBy: 'vitest-exclude' }],
      absent: [],
    })
    const { failures } = parseConfig(badConfig, SCHEMA, 'mutation-invariance.config.json')
    expect(failures.length).toBeGreaterThan(0)
  })

  it('rejects a verifiedOn that is not YYYY-MM-DD shaped', () => {
    const badConfig = JSON.stringify({
      scope: 'x',
      allow: [{ path: 'CLAUDE.md', securedBy: 'written-argument', argument: 'x', verifiedOn: 'not-a-date' }],
      absent: [],
    })
    const { failures } = parseConfig(badConfig, SCHEMA, 'mutation-invariance.config.json')
    expect(failures.length).toBeGreaterThan(0)
  })
})
