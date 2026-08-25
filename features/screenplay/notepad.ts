// SCREENPLAY: the Notepad -- scenario-scoped scratch state for the generated
// step modules under features/steps/.
//
// A DELIBERATE DIVERGENCE FROM THE PATTERN. In Screenplay a Notepad is an
// Ability an Actor carries, so its lifetime is the Actor's. This suite has no
// Actors: the `page` fixture is the ability, and the Notepad is keyed by it.
// That is the skip-Actors decision propagated one level down rather than a
// workaround -- Playwright creates a `page` per test and never shares one
// between tests, so keying by it gives exactly the per-scenario lifetime an
// Actor would have given.
//
// A Gherkin step's arguments are only its own placeholders, so a Then that
// speaks of something an earlier Given named ("the blinker should be
// vertical", or pattern-library's "it should be listed under ...") needs
// somewhere to keep it. playwright-bdd's own answer is a custom fixture, which
// would have to live in a module the step modules' three-import allowlist
// forbids -- so the store is keyed by the `page` fixture instead, which
// Playwright creates fresh for every test and never shares between them.
//
// ONE MECHANISM, TWO TYPED INSTANCES. What a step may carry is a coordinate, a
// count, or a name out of an Examples table -- never a piece of application
// state. The two stores stay separate so a caller cannot read a number out as
// a string or the reverse; they come from one factory so the carrying itself
// -- the per-page map, the has-any-step-established-this error -- is written
// once rather than per value type.
import { type Page } from '@playwright/test'

function createScenarioStore<T>() {
  const byPage = new WeakMap<Page, Map<string, T>>()

  return {
    remember(page: Page, key: string, value: T): void {
      const store = byPage.get(page) ?? new Map<string, T>()
      store.set(key, value)
      byPage.set(page, store)
    },
    recall(page: Page, key: string): T {
      const value = byPage.get(page)?.get(key)
      if (value === undefined) throw new Error(`No step in this scenario has established "${key}"`)
      return value
    },
  }
}

const scenarioNumbers = createScenarioStore<number>()
const scenarioTexts = createScenarioStore<string>()

export const remember = scenarioNumbers.remember
export const recall = scenarioNumbers.recall
export const rememberText = scenarioTexts.remember
export const recallText = scenarioTexts.recall
