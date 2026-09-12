// Parses `vale --output=line` into findings. The format is
// `path:line:col:Style.Rule:message`, and a message may itself contain colons,
// so the split is bounded at four rather than unbounded.
//
// Anything that is not a finding line -- a blank, a summary, a diagnostic -- is
// dropped. That is deliberate and it is why run.ts checks vale's exit status
// separately: a run that produced NO parseable output would otherwise read as a
// clean fixture set, which is this program's own confident-zero failure mode.
//
// TWO EQUIVALENT MUTANTS live here, ruled 2026-09-12. Dropping the `^` anchor
// changes nothing, because `.+?` is lazy and exec scans from position 0, so the
// first match starts there either way. And the `match[2] === undefined` half of
// the guard is unreachable: if FINDING matched at all, both capture groups are
// defined. That half exists for noUncheckedIndexedAccess, not for any input.

/** One `vale --output=line` finding. */
export interface ValeFinding {
  file: string
  rule: string
}

const FINDING = /^(.+?):\d+:\d+:([A-Za-z0-9_]+\.[A-Za-z0-9_]+):/

/** Findings in the order vale reported them. Non-finding lines are skipped. */
export function parseValeFindings(output: string): ValeFinding[] {
  const findings: ValeFinding[] = []
  for (const line of output.split('\n')) {
    const match = FINDING.exec(line.trim())
    if (match?.[1] === undefined || match[2] === undefined) continue
    findings.push({ file: match[1], rule: match[2] })
  }
  return findings
}
