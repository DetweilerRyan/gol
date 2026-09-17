import { describe, expect, it } from 'vitest'
import { parseRoleCyclesConfig, renderCycle, type ParseRoleCyclesResult } from './cycle-config.ts'

// ParseRoleCyclesResult is a union -- ok:true xor ok:false -- so a test
// asserting on the errors member has to establish which member it holds
// first. Throwing rather than returning a fallback keeps the "it
// unexpectedly succeeded" case a named failure instead of an empty array
// that quietly satisfies every assertion below it.
function errorsOf(result: ParseRoleCyclesResult): string[] {
  if (result.ok) {
    throw new Error('expected parseRoleCyclesConfig to report errors, but it returned ok: true')
  }
  return result.errors
}

// A schema fixture built in-memory, kept structurally faithful to
// schemas/role-cycles.schema.json (draft-07, the same ajv traps
// cycle-config.ts's own header names) but owned by this test file rather
// than read off disk -- every test in this file uses in-memory fixtures
// only, never a live-tree read.
const SCHEMA = JSON.stringify({
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  additionalProperties: false,
  required: ['cycles'],
  properties: {
    $schema: { type: 'string' },
    cycles: { type: 'array', items: { $ref: '#/definitions/cycle' } },
  },
  definitions: {
    cycle: {
      type: 'object',
      additionalProperties: false,
      required: ['pipeline', 'roles'],
      properties: {
        pipeline: { type: 'string', minLength: 1 },
        roles: { type: 'array', minItems: 3, items: { type: 'string', minLength: 1 } },
      },
    },
  },
})

const VALID_CONFIG = JSON.stringify({
  cycles: [{ pipeline: 'story', roles: ['product', 'coder', 'cleaner', 'architect', 'hardener', 'product'] }],
})

describe('parseRoleCyclesConfig', () => {
  it('returns ok:true with the parsed config for a schema-valid config', () => {
    const result = parseRoleCyclesConfig(VALID_CONFIG, SCHEMA, 'role-cycles.config.json')
    if (!result.ok) throw new Error('expected ok: true')
    expect(result.config.cycles).toHaveLength(1)
    expect(result.config.cycles[0].pipeline).toBe('story')
  })

  it('accepts a config carrying its own $schema key', () => {
    const withSchemaKey = JSON.stringify({ $schema: './schemas/role-cycles.schema.json', ...JSON.parse(VALID_CONFIG) })
    const result = parseRoleCyclesConfig(withSchemaKey, SCHEMA, 'role-cycles.config.json')
    expect(result.ok).toBe(true)
  })

  it('fails on malformed JSON in the config text, attributing the error to configPath', () => {
    const errors = errorsOf(parseRoleCyclesConfig('{ not json', SCHEMA, 'role-cycles.config.json'))
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('role-cycles.config.json')
    expect(errors[0]).toContain('invalid JSON')
    // Pins errorMessage's own body, not just parseJson's "invalid JSON: "
    // prefix -- a mutant that empties errorMessage's body still leaves that
    // prefix, so the suffix has to be checked too: JSON.parse's own error
    // text is never literally the string "undefined".
    expect(errors[0]).not.toContain('undefined')
  })

  it('fails on malformed JSON in the schema text, attributing the error to the schema file', () => {
    const errors = errorsOf(parseRoleCyclesConfig(VALID_CONFIG, '{ not json', 'role-cycles.config.json'))
    expect(errors).toHaveLength(1)
    // One combined pattern, not two separate toContain checks: this also
    // pins the short-circuit itself, not just which file gets blamed. Skip
    // that early return and the same malformed schema still fails, but only
    // after falling through to ajv.compile(undefined), which reports
    // "schema-compile" instead of "invalid JSON" -- a check for the schema
    // path alone can't tell the two apart.
    expect(errors[0]).toMatch(/schemas\/role-cycles\.schema\.json.*invalid JSON/)
  })

  it('fails when the schema itself does not compile', () => {
    const brokenSchema = JSON.stringify({ type: 'object', properties: { foo: { type: 'not-a-real-type' } } })
    const errors = errorsOf(parseRoleCyclesConfig(VALID_CONFIG, brokenSchema, 'role-cycles.config.json'))
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('schema-compile')
  })

  // Two independently-invalid cycle entries, so allErrors: true's effect is
  // actually observable: a single bad entry can't distinguish it from
  // ajv's own allErrors: false default, since either reports at least 1.
  it('reports every ajv error when the config violates the schema, with allErrors: true', () => {
    const badConfig = JSON.stringify({
      cycles: [{ pipeline: '', roles: ['a', 'b', 'c'] }, { roles: ['a', 'b'] }],
    })
    const errors = errorsOf(parseRoleCyclesConfig(badConfig, SCHEMA, 'role-cycles.config.json'))
    expect(errors.length).toBeGreaterThan(1)
    expect(errors.every((error) => error.startsWith('role-cycles.config.json:'))).toBe(true)
  })

  it('formats a nested violation with the instancePath, not "(root)"', () => {
    const badConfig = JSON.stringify({ cycles: [{ pipeline: '', roles: ['a', 'b', 'c'] }] })
    const errors = errorsOf(parseRoleCyclesConfig(badConfig, SCHEMA, 'role-cycles.config.json'))
    expect(errors.some((error) => error.includes('/cycles/0/pipeline'))).toBe(true)
    expect(errors.some((error) => error.includes('(root)'))).toBe(false)
  })

  it('formats a root-level violation (a missing required top-level property) as "(root)"', () => {
    const errors = errorsOf(parseRoleCyclesConfig('{}', SCHEMA, 'role-cycles.config.json'))
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('(root)')
    expect(errors[0]).toContain("must have required property 'cycles'")
  })

  it('rejects an unknown top-level property (additionalProperties: false)', () => {
    const badConfig = JSON.stringify({ ...JSON.parse(VALID_CONFIG), extra: true })
    const errors = errorsOf(parseRoleCyclesConfig(badConfig, SCHEMA, 'role-cycles.config.json'))
    expect(errors.some((error) => error.includes('must NOT have additional properties'))).toBe(true)
  })

  it('rejects a cycle declaring fewer than three roles', () => {
    const badConfig = JSON.stringify({ cycles: [{ pipeline: 'story', roles: ['product', 'coder'] }] })
    const errors = errorsOf(parseRoleCyclesConfig(badConfig, SCHEMA, 'role-cycles.config.json'))
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('renderCycle', () => {
  it('joins roles with the canonical arrow glyph and single spaces on each side', () => {
    expect(renderCycle(['product', 'coder', 'cleaner'])).toBe('product → coder → cleaner')
  })

  it('is the one author of the glyph -- a different join would not match it', () => {
    expect(renderCycle(['a', 'b', 'c'])).not.toBe('a -> b -> c')
  })
})
