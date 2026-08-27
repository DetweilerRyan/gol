// The extension point this refactor exists to create: a mutation site is
// "one place in a feature file a mutant may change", named by what kind of
// Gherkin construct it came from, addressed by a reproducible seed key, and
// located by a byte-precise TextSpan rather than a line to re-render. Adding
// a new kind of site -- step text, a scenario name, a DocString -- is meant
// to mean writing one new `*-sites.ts` file (a finder plus a renderer, on
// the model of examples-cell-sites.ts) and registering both below. Nothing
// else in this program should need to change: mutant-plan.ts calls
// listMutationSites/renderMutantText and never looks at `kind` itself, and
// run.ts prints a site generically by its seedKey (see its report()).
//
// The two Records below are the STRING_MUTATORS precedent from
// mutation-rules.ts applied here: SiteKind is a closed union, and a Record
// keyed by it means a new kind with no finder or no renderer registered is a
// type error at this file, not a silently-empty mutant set or a renderer
// that throws at run time on the first mutant of that kind.
import { parseFeature, type GherkinDocument } from './gherkin-document.ts'
import { findExamplesCellSites, renderExamplesCellSite } from './examples-cell-sites.ts'
import type { TextSpan } from './text-span.ts'

export type SiteKind = 'examples-cell'

// `seedKey` is the whole address: reproducible across runs, unique across
// every site in every target (today, `${featureFileName}:${rowIndex}:${columnName}` --
// see examples-cell-sites.ts), and self-contained, so mutant-plan.ts never
// has to know how a `kind` builds one. `value` is the original, unmutated
// text the site covers; `span` is where in the feature file it lives.
export interface MutationSite {
  kind: SiteKind
  seedKey: string
  value: string
  span: TextSpan
}

export type SiteFinder = (doc: GherkinDocument, lines: string[], featureFileName: string) => MutationSite[]
export type SiteRenderer = (featureText: string, site: MutationSite, mutatedValue: string) => string

const SITE_FINDERS: Record<SiteKind, SiteFinder> = {
  'examples-cell': findExamplesCellSites,
}

const SITE_RENDERERS: Record<SiteKind, SiteRenderer> = {
  'examples-cell': renderExamplesCellSite,
}

// Every SiteKind's finders run over the same parsed document, in
// registration order -- there is only one kind today, so order is not yet
// observable, but a future second finder inherits this rather than needing
// its own iteration policy.
export function listMutationSites(featureText: string, featureFileName: string): MutationSite[] {
  const { doc, lines } = parseFeature(featureText)
  return (Object.keys(SITE_FINDERS) as SiteKind[]).flatMap((kind) => SITE_FINDERS[kind](doc, lines, featureFileName))
}

export function renderMutantText(featureText: string, site: MutationSite, mutatedValue: string): string {
  return SITE_RENDERERS[site.kind](featureText, site, mutatedValue)
}
