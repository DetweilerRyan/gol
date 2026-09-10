// Parses and schema-validates mutation-invariance.config.json in one step.
// Both the config text and the schema text are handed in as strings, never
// read from disk here, so every failure mode (malformed JSON in either
// file, a schema-compile error, a schema-validation error) is reachable
// from an in-memory fixture -- run.ts (out of scope for this slice) is the
// only place that actually reads the two files.
//
// ajv 8 traps, measured by architect's DESIGN pass and worth restating here
// since a mistake in any of the three silently degrades this module rather
// than throwing somewhere obvious: ajv's default export is draft-07 (the
// draft the schema itself declares); "format": "date" cannot appear in the
// schema, since ajv 8 core ships no formats and throws on an unknown one --
// schemas/mutation-invariance.schema.json uses a `pattern` instead; and the
// schema must declare `$schema` in its own `properties`, or
// `additionalProperties: false` would reject the config's own `$schema` key.

import { Ajv, type ErrorObject, type ValidateFunction } from 'ajv'
import type { GateFailure } from '../gate-report.ts'

/** How an `allow[]` entry's path is kept out of the mutation sandbox or out of its scoring, per CLAUDE.md's merge-protocol step 5. */
export type SecuredBy = 'vitest-exclude' | 'stryker-ignore-patterns' | 'written-argument'

export interface AllowEntry {
  path: string
  securedBy: SecuredBy
  argument?: string
  verifiedOn?: string
}

export interface AbsentEntry {
  path: string
  reason: string
}

export interface MutationInvarianceConfig {
  scope: string
  allow: AllowEntry[]
  absent: AbsentEntry[]
}

// Attributed to the schema file itself in a GateFailure -- the config
// doesn't carry its own schema's path, and parseConfig's own signature
// (configText, schemaText, configPath) has no separate schemaPath
// parameter, so this is the one place that name is spelled.
const SCHEMA_FILE = 'schemas/mutation-invariance.schema.json'

type JsonParseResult = { value: unknown; failure?: undefined } | { value?: undefined; failure: GateFailure }

function parseJson(text: string, file: string, check: string): JsonParseResult {
  try {
    return { value: JSON.parse(text) }
  } catch (error) {
    return {
      failure: {
        check,
        file,
        message: `invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      },
    }
  }
}

// ajv's `message` is typed optional only because the `messages: false` option
// can suppress it -- this module always constructs Ajv with its default
// options, so `message` is populated on every error and there is no
// fallback string to test; the `?? '...'` this used to carry was an
// unreachable branch, invisible to every gate here (see this program's
// own args.ts for the same repo-wide idiom of naming that class rather than
// leaving a silent, unkillable mutant).
function formatAjvError(error: ErrorObject): string {
  const location = error.instancePath === '' ? '(root)' : error.instancePath
  return `${location} ${error.message}`
}

/**
 * Parses and schema-validates the mutation-invariance config in one step.
 * `configPath` is used only to attribute a failure to a file -- parsing
 * itself never touches disk.
 *
 * Short-circuits on the first failure class reached: a schema that isn't
 * valid JSON, then a config that isn't valid JSON, then a schema that
 * doesn't itself compile, then every schema-validation error against the
 * config (`allErrors: true`, so more than one can come back at once).
 */
export function parseConfig(
  configText: string,
  schemaText: string,
  configPath: string,
): { config?: MutationInvarianceConfig; failures: GateFailure[] } {
  const schemaResult = parseJson(schemaText, SCHEMA_FILE, 'schema-parse')
  if (schemaResult.failure) return { failures: [schemaResult.failure] }

  const configResult = parseJson(configText, configPath, 'config-parse')
  if (configResult.failure) return { failures: [configResult.failure] }

  const ajv = new Ajv({ allErrors: true })
  let validate: ValidateFunction
  try {
    validate = ajv.compile(schemaResult.value as object)
  } catch (error) {
    return {
      failures: [
        {
          check: 'schema-compile',
          file: SCHEMA_FILE,
          message: error instanceof Error ? error.message : String(error),
        },
      ],
    }
  }

  if (!validate(configResult.value)) {
    const errors: ErrorObject[] = validate.errors ?? []
    return {
      failures: errors.map((error) => ({
        check: 'schema-valid',
        file: configPath,
        message: formatAjvError(error),
      })),
    }
  }

  return { config: configResult.value as MutationInvarianceConfig, failures: [] }
}
