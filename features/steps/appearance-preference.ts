// Step definitions for appearance-preference.feature, driving the real
// application in a real browser through Playwright-BDD.
//
// IMPORT ALLOWLIST -- playwright-bdd, @playwright/test, and ../e2e-helpers.
// Nothing from src/, and no selector of its own.
//
// THIS MODULE BORROWS NOTHING AND LENDS NOTHING. Every step below is new
// vocabulary, because no other feature has ever had anything to say about how
// the app looks. It deliberately does not reuse an existing open-the-app step
// ("an empty grid", "a camera centered on the origin at the default zoom"):
// each of those states something about the board or the camera that these
// scenarios do not care about, and every one of them navigates before the
// system appearance could be set, which is the one ordering this feature
// depends on.
//
// THE CONTRACT PRESUMES AN AFFORDANCE THAT DOES NOT EXIST YET, which is the
// ordinary shape of a spec written before its implementation and is why every
// scenario here is red today. The proposal -- a control named `Appearance`
// offering `Light`, `Dark` and `Follow system` -- is written down in
// features/screenplay/elements.ts's appearanceControl, together with what
// would change if architect prefers a different one. No .feature line depends
// on which shape wins.
//
// THE TWO WAYS "the appearance in effect" COULD BE OBSERVED, because the
// .feature text is deliberately neutral between them and the choice is
// architect's CONTRACT call rather than this module's:
//
//   1. READ THE PAINT (what this draft does). questions.ts's
//      appearanceInEffect asks what colour is painted at the middle of the
//      board and classifies it as light or dark by brightness. It is filed
//      there as an ARIA reach-around, with a deletion trigger, because nothing
//      the app announces distinguishes a dark screen from a light one.
//
//   2. ANNOUNCE THE RESOLVED APPEARANCE. Give the app an accessible way to say
//      which appearance it settled on -- not just which one was asked for --
//      and the reach-around is deleted, on the exact
//      scrollbar-visible-proportion-affordance precedent where an announced
//      proportion replaced a measured thumb box and took two tolerances with
//      it. The open question is whether that affordance is owed at all: "the
//      screen is dark" may be a visual fact with no screen-reader equivalent,
//      in which case reading the paint is the honest instrument rather than a
//      workaround for a missing one.
//
// WHY THERE IS NO EXAMPLES TABLE, and the reason is a survivor analysis rather
// than "a table is impossible" -- the same shape keyboard-grid-reachability
// records for itself. The natural table here is | system | chosen |, and both
// of its columns are move-together survivors. Mutating `chosen` moves the When
// and the Then together, so the scenario still passes. Mutating `system` is
// worse: in every scenario where the two differ, the value's ONLY job is to
// differ, so a mutation that collapses them into the same appearance leaves a
// scenario that is still perfectly true -- an override still wins when it
// agrees with the system. The Given/When/Then structure already spends both
// values in every combination that discriminates (system dark and light at
// open; a choice against the system; a choice AGREEING with the system, which
// is scenario five's whole point), so a table would buy two survivors and no
// new kill. npm run acceptance-mutation reports this feature as
// `0 mutants (no Examples table)`, which is the designed state.
//
// THE ORDERING THIS FEATURE RESTS ON, measured against Chromium rather than
// reasoned about, and the reason the system-appearance step is always FIRST:
// the emulation has to be in place before the app boots for the
// starts-out-matching scenarios to be about booting at all. Setting it
// afterwards is a different claim, and it is the one the mid-session scenario
// makes on purpose.
//
// npm run gherkin-dry flags "the system appearance changes to <x>" against
// "the system appearance is <x>" as a medium-confidence near-duplicate, and
// they stay two steps. The difference between them is precisely the ordering
// above -- one is the appearance the player arrived with, the other is one
// that changed under them while they played -- so collapsing the pair would
// erase the distinction the third scenario exists to make, and would leave a
// When reading "the system appearance is dark", which states no act at all.
//
// RESIDUE LEFT TO THE HAND-WRITTEN SPEC, which product's VERIFY pass writes
// from the outline in this slice's SPECIFY handoff: what the dark palette
// actually IS -- the board's own fill, a live cell painted light against it, a
// dead cell staying transparent so the board shows through, the gridlines
// staying visible against both, and the chrome (HUD, toolbar, library) staying
// legible. Those are rendered-pixel claims, and the last word on them is the
// user's eye rather than any assertion.
import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import {
  type Appearance,
  type AppearancePreference,
  appearanceInEffect,
  appearancePreference,
  chooseAppearance,
  openGrid,
  returnToTheApp,
  setSystemAppearance,
} from '../e2e-helpers'

const { Given, When, Then } = createBdd()

// A {word} placeholder will hand over whatever the .feature says, so the two
// appearance words are checked rather than trusted. Without this a typo, or a
// value some later Examples table introduces, would reach emulateMedia as a
// silently-ignored string and the scenario would assert against whatever
// appearance happened to be in force.
function asAppearance(word: string): Appearance {
  if (word !== 'light' && word !== 'dark') throw new Error(`"${word}" is not an appearance -- expected light or dark`)
  return word
}

function asPreference(word: string): AppearancePreference {
  if (word !== 'light' && word !== 'dark')
    throw new Error(`"${word}" is not an appearance a player can choose -- expected light or dark`)
  return word
}

Given('the system appearance is {word}', async ({ page }, word: string) => {
  await setSystemAppearance(page, asAppearance(word))
})

When('I open the app', async ({ page }) => {
  await openGrid(page)
})

// The same act as the When above, said in the tense a setup step needs. Two
// texts rather than one because a scenario may have only one When, and five of
// the seven here spend theirs on something later than the opening.
Given('I have opened the app', async ({ page }) => {
  await openGrid(page)
})

// The mid-session half. Chromium does deliver this to a running page -- both
// matchMedia's own matches and a registered change listener -- but it does so
// asynchronously, which is why the Then that reads the result polls.
When('the system appearance changes to {word}', async ({ page }, word: string) => {
  await setSystemAppearance(page, asAppearance(word))
})

When('I choose the {word} appearance', async ({ page }, word: string) => {
  await chooseAppearance(page, asPreference(word))
})

Given('I have chosen the {word} appearance', async ({ page }, word: string) => {
  await chooseAppearance(page, asPreference(word))
})

When('I hand the appearance back to the system', async ({ page }) => {
  await chooseAppearance(page, 'system')
})

When('I return to the app', async ({ page }) => {
  await returnToTheApp(page)
})

// POLLED, EVERYWHERE, AND FOR TWO SEPARATE REASONS. A mid-session system
// change arrives asynchronously (see the When above), and a choice made
// through the control has to get through a React render before the paint
// changes. A single read would be a race in both cases, and a flaky
// appearance assertion is the kind that passes for a whole slice and then
// fails on someone else's machine.
Then('the appearance in effect should be {word}', async ({ page }, word: string) => {
  const expected = asAppearance(word)
  await expect.poll(() => appearanceInEffect(page), { message: `the board is not painted ${expected}` }).toBe(expected)
})

Then('the appearance preference should be {word}', async ({ page }, word: string) => {
  await expect.poll(() => appearancePreference(page)).toBe(asPreference(word))
})

Then('the app should be following the system appearance', async ({ page }) => {
  await expect.poll(() => appearancePreference(page)).toBe('system')
})
