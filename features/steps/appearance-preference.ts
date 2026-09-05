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
// THE AFFORDANCE THIS CONTRACT PRESUMED HAS SINCE LANDED. The module was
// drafted against a control that did not exist -- the ordinary shape of a spec
// written before its implementation, and why every scenario here was red at
// SPECIFY -- and architect's CONTRACT pass ratified the proposal unchanged: a
// control named `Appearance` offering `Light`, `Dark` and `Follow system`,
// which src/components/GridToolbar.tsx now ships as a native select.
// features/screenplay/elements.ts's appearanceControl is what reaches it. No
// .feature line moved for it, which is what writing them neutrally bought.
//
// HOW "the appearance in effect" IS OBSERVED, which was a real choice rather
// than a default. The .feature text is neutral between reading the paint and
// reading an announcement, and architect ruled for the paint: questions.ts's
// appearanceInEffect asks what colour is painted at the middle of the board
// and classifies it light or dark by brightness. The alternative -- giving the
// app an accessible way to say which appearance it RESOLVED to, rather than
// which one was asked for -- was rejected as a test hook wearing an
// affordance's name: "the screen is dark" is a visual fact with no
// screen-reader equivalent, and the control already announces the half a
// screen-reader user can act on, which is the preference. So the paint read is
// the honest instrument here rather than a reach-around, it carries no
// deletion trigger, and the argument in full -- together with the one
// precondition it places on any future step that borrows the Then below --
// lives at its own site.
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
// THERE IS NO RESIDUE HERE, AND NO HAND-WRITTEN SPEC. The SPECIFY draft of
// this paragraph promised an appearance-preference.e2e.spec.ts stating what
// the dark palette actually IS -- the board's own fill, a live cell painted
// light against it, a dead cell staying transparent so the board shows
// through, the gridlines visible against both, the chrome legible. Architect's
// CONTRACT ruling withdrew that promise and product's VERIFY pass wrote no
// such file. Rendered colour is none of the four things the hand-written layer
// exists for: its geometry category takes a measured box, a coordinate or an
// element resolved by point, and a palette is not any of those. Every claim
// about WHICH appearance is in effect is stated in the seven scenarios above;
// how that appearance LOOKS is settled by the user looking at it, asserted
// nowhere on purpose, so that improving the palette never reds a test.
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

// The two polls below carry a message: for a reason worth knowing before
// deleting one. expect.poll retries its callback until the timeout and then
// reports the LAST VALUE, swallowing anything the callback threw -- and
// appearancePreference throws a carefully worded error naming the unrecognized
// option label it actually saw. Without a message the failure reads as a bare
// timeout on `undefined` and that text is lost, so each message restates its
// gist.
Then('the appearance preference should be {word}', async ({ page }, word: string) => {
  const expected = asPreference(word)
  await expect
    .poll(() => appearancePreference(page), {
      message: `the appearance control is not showing ${expected} (if it never settles, it is showing a label none of the three known options match)`,
    })
    .toBe(expected)
})

Then('the app should be following the system appearance', async ({ page }) => {
  await expect
    .poll(() => appearancePreference(page), {
      message:
        'the appearance control is not showing that the app is following the system (if it never settles, it is showing a label none of the three known options match)',
    })
    .toBe('system')
})
