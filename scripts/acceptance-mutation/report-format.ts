// Presentational formatting for run.ts's own report() table, split out
// because **/run.ts is excluded from crap4ts and Stryker as an I/O shell
// (see mutant-plan.ts's own comment on the same exclusion) -- anything worth
// gating has to live outside it.
//
// displaySite trims a mutation site's own feature name off the front of its
// printed seedKey, so the report table's Site column doesn't repeat the
// Feature column's value on every row (today's only site kind's seedKey is
// `${featureFileName}:${rowIndex}:${columnName}` -- see
// examples-cell-sites.ts). This is deliberately not the "decompose the
// seedKey by kind" run.ts's own comment rules out: it never inspects a
// site's `kind`, only whether the printed feature name happens to prefix the
// seedKey, and falls through to the seedKey unchanged whenever it doesn't --
// so a future site kind whose seedKey isn't feature-prefixed prints exactly
// as it does today, with nothing here to update.
export function displaySite(feature: string, seedKey: string): string {
  const prefix = `${feature}:`
  return seedKey.startsWith(prefix) ? seedKey.slice(prefix.length) : seedKey
}
