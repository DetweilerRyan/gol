// Assembles the run-header facts that make a perf report comparable across
// machines and commits (git SHA, CPU, node version, timestamp). Every read
// is injected via EnvironmentReaders rather than called directly (no
// child_process, no os, no `new Date()` in here) so this stays testable
// without shelling out to git or reading the real host -- see run.ts for the
// real readers, which is where the messy, hard-to-unit-test parts (spawning
// git, falling back when it fails) belong instead, since run.ts is the I/O
// shell excluded from the quality gates.

export interface EnvironmentReaders {
  gitSha: () => string
  cpus: () => Array<{ model: string }>
  nodeVersion: () => string
  now: () => Date
}

export interface RunEnvironment {
  gitSha: string
  cpuModel: string
  cpuCoreCount: number
  nodeVersion: string
  timestampIso: string
}

const UNKNOWN_CPU_MODEL = 'unknown'

export function readRunEnvironment(readers: EnvironmentReaders): RunEnvironment {
  const cpus = readers.cpus()
  return {
    gitSha: readers.gitSha(),
    cpuModel: cpus[0]?.model ?? UNKNOWN_CPU_MODEL,
    cpuCoreCount: cpus.length,
    nodeVersion: readers.nodeVersion(),
    timestampIso: readers.now().toISOString(),
  }
}
