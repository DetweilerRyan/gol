// Shared by the gating checkers whose `checks.ts` each needs a
// "this program found nothing to check, and that is itself a failure"
// guard -- ast-grep-rule-check's checkAnyRulesFound and reference-check's
// checkAnyFilesScanned used to carry independent, identically-shaped
// implementations of exactly this guard (an empty resolution universe
// silently reads as a clean run and exits 0, the failure mode every other
// check in both programs exists to catch elsewhere) until dry4ts:scripts
// flagged the pair as a duplicate. Reference-check's checkAnyReferencesFound
// is a different shape (it also inspects each item's contents, not just the
// list length) and stays where it is.

export interface GateFailure {
  check: string
  file: string
  message: string
}

/**
 * A single check-shaped failure when `items` is empty; no failure otherwise.
 * `file` is conventionally `'(none)'` for a whole-run guard like this one,
 * which has no single source file to blame.
 */
export function checkNonEmpty<T>(items: T[], check: string, file: string, message: string): GateFailure[] {
  if (items.length > 0) return []
  return [{ check, file, message }]
}
