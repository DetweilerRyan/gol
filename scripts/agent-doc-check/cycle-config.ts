// Parses and schema-validates role-cycles.config.json in one step. Both the
// config text and the schema text are handed in as strings, never read from
// disk here, so every failure mode (malformed JSON in either file, a
// schema-compile error, a schema-validation error) is reachable from an
// in-memory fixture -- run.ts is the only place that actually reads the two
// files. Mirrors scripts/mutation-invariance/config-file.ts's parseConfig,
// including the same four ajv traps documented in that file's own header:
// ajv's default export is draft-07; a `format` keyword cannot appear in the
// schema, since ajv 8 core ships no formats and throws on an unknown one;
// the schema must declare `$schema` in its own `properties`, or
// `additionalProperties: false` would reject the config's own `$schema` key;
// and under this repo's `nodenext` module resolution with no
// `esModuleInterop`, ajv's default export is not constructable, so this
// module imports the named `Ajv` export instead.

import { Ajv, type ErrorObject, type ValidateFunction } from 'ajv'

/** One pipeline's declared cycle, e.g. `{ pipeline: 'story', roles: ['product', 'coder', ...] }`. */
export interface DeclaredCycle {
  pipeline: string
  roles: string[]
}

export interface RoleCyclesConfig {
  cycles: DeclaredCycle[]
}

/**
 * Either the parsed, schema-valid config, or a list of human-readable error
 * strings -- never both. A discriminated union rather than a pair of
 * independently-optional fields, so a caller needs one `ok` check to know
 * which member it holds.
 */
export type ParseRoleCyclesResult = { ok: true; config: RoleCyclesConfig } | { ok: false; errors: string[] }

// Attributed to the schema file itself in an error string -- the config
// doesn't carry its own schema's path, and parseRoleCyclesConfig's own
// signature (configText, schemaText, configPath) has no separate schemaPath
// parameter, so this is the one place that name is spelled.
const SCHEMA_FILE = 'schemas/role-cycles.schema.json'

type JsonParseResult = { value: unknown; error?: undefined } | { value?: undefined; error: string }

// Shared by parseJson's catch and parseRoleCyclesConfig's own ajv.compile
// catch below -- both need a best-effort message out of a caught value
// typed `unknown`.
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function parseJson(text: string, file: string): JsonParseResult {
  try {
    return { value: JSON.parse(text) }
  } catch (error) {
    return { error: `${file}: invalid JSON: ${errorMessage(error)}` }
  }
}

// ajv's `message` is typed optional only because the `messages: false` option
// can suppress it -- this module always constructs Ajv with its default
// options, so `message` is populated on every error and there is no fallback
// string to test; see config-file.ts's formatAjvError for the same idiom.
function formatAjvError(configPath: string, error: ErrorObject): string {
  const location = error.instancePath === '' ? '(root)' : error.instancePath
  return `${configPath}: ${location} ${error.message}`
}

/**
 * Parses and schema-validates role-cycles.config.json in one step.
 * `configPath` is used only to attribute an error to a file -- parsing
 * itself never touches disk.
 *
 * Short-circuits on the first failure class reached: a schema that isn't
 * valid JSON, then a config that isn't valid JSON, then a schema that
 * doesn't itself compile, then every schema-validation error against the
 * config (`allErrors: true`, so more than one can come back at once).
 */
export function parseRoleCyclesConfig(
  configText: string,
  schemaText: string,
  configPath: string,
): ParseRoleCyclesResult {
  const schemaResult = parseJson(schemaText, SCHEMA_FILE)
  if (schemaResult.error) return { ok: false, errors: [schemaResult.error] }

  const configResult = parseJson(configText, configPath)
  if (configResult.error) return { ok: false, errors: [configResult.error] }

  const ajv = new Ajv({ allErrors: true })
  let validate: ValidateFunction
  try {
    validate = ajv.compile(schemaResult.value as object)
  } catch (error) {
    return { ok: false, errors: [`${SCHEMA_FILE}: schema-compile: ${errorMessage(error)}`] }
  }

  if (!validate(configResult.value)) {
    // `as ErrorObject[]`, not `?? []`: ajv only ever sets `validate.errors`
    // to `null` before a validation call or after one that *passed* --
    // having just observed `validate(...)` return `false`, `.errors` is
    // guaranteed a populated array, so a `?? []` fallback would be
    // unreachable by construction and invisible to every gate here. Same
    // idiom as config-file.ts's own treatment of the same ajv fact.
    const errors = validate.errors as ErrorObject[]
    return { ok: false, errors: errors.map((error) => formatAjvError(configPath, error)) }
  }

  return { ok: true, config: configResult.value as RoleCyclesConfig }
}

/** Renders a declared cycle's roles to the canonical arrow string -- the config carries arrays, never arrow strings, so this is the one place the glyph and spacing are authored. */
export function renderCycle(roles: readonly string[]): string {
  return roles.join(' → ')
}
