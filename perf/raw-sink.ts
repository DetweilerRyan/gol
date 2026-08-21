// Writes one raw sample to reports/perf/raw/ as JSON. This is the entire
// boundary to scripts/perf-report/ -- a file on disk, not a module import.
// `import type` is the one exception (see below): types are erased at
// compile time, so it never actually links perf/'s runtime module graph to
// scripts/perf-report/'s. A value-level import would drag scripts/** into
// this file's TS program (tsconfig.app.json: `moduleResolution: "bundler"`,
// `lib: DOM`) across a resolution boundary from scripts/'s own
// `moduleResolution: "nodenext"` program -- don't add one, in either
// direction.
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { RawScenarioSample } from '../scripts/perf-report/raw-sample.ts'

const PERF_DIR = path.dirname(fileURLToPath(import.meta.url))
const RAW_DIR = path.resolve(PERF_DIR, '../reports/perf/raw')

// One file per scenario x project, not per scenario alone: this slice wires
// two Playwright projects and, left to Playwright's default, both run the
// same scenario -- a filename keyed on scenario alone would have the
// second project's run silently overwrite the first's, and run.ts/format.ts
// both expect one row per (scenario, project) pair to survive.
export function writeRawSample(sample: RawScenarioSample): void {
  mkdirSync(RAW_DIR, { recursive: true })
  const fileName = `${sample.scenario}--${sample.project}.json`
  writeFileSync(path.join(RAW_DIR, fileName), JSON.stringify(sample, null, 2))
}
