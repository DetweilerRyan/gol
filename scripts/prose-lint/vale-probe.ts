// This program's predecessor ran two probes -- `command -v vale` (is it on
// PATH) and `vale ls-config` (does .vale.ini load) -- collapsed here into
// one spawn: `vale ls-config` alone already tells both apart, since a
// missing binary and an unloadable config fail differently at the
// spawnSync layer. See run.ts's module header for the one spawn this
// classifies.
//
// Measured against Node on this machine: spawning a binary absent from
// PATH sets `result.error.code === 'ENOENT'`, `status: null`, and leaves
// `stdout`/`stderr` undefined -- the process never started. Spawning vale
// itself with no loadable `.vale.ini` sets no `error` at all; it runs, and
// reports a nonzero `status` (2, for both "no .vale.ini found" and "one
// present but unparseable") with the E100 diagnostic on `stderr`, `stdout`
// empty. A clean `vale ls-config` sets `status: 0` and writes to `stdout`.

/**
 * What one `vale ls-config` probe established. `output` is the probe's own
 * combined stdout/stderr, kept only so a caller can show the first few
 * lines of a load failure -- see `decide()`'s use of it.
 */
export interface ValeProbe {
  valeOnPath: boolean
  configLoaded: boolean
  output: string
}

/**
 * Classifies one `spawnSync('vale', ['ls-config'], ...)` result. An ENOENT
 * spawn error means the binary itself is absent from PATH; any other spawn
 * error, or a nonzero exit status, means it was found but its config would
 * not load -- see `.claude/agents/articles/prose-linting.md`'s Setup
 * section for what `vale sync` fixes.
 */
export function classifyProbe(result: {
  error?: { code?: string } | undefined
  status: number | null
  stdout?: string | null
  stderr?: string | null
}): ValeProbe {
  if (result.error?.code === 'ENOENT') {
    return { valeOnPath: false, configLoaded: false, output: '' }
  }
  const configLoaded = !result.error && result.status === 0
  return { valeOnPath: true, configLoaded, output: `${result.stdout ?? ''}${result.stderr ?? ''}` }
}
