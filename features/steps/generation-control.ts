// Step definitions for generation-control.feature, driving the real
// application in a real browser through Playwright-BDD.
//
// IMPORT ALLOWLIST -- playwright-bdd, @playwright/test, and ../e2e-helpers,
// checked by rules/no-domain-imports-in-bdd-steps.yml.
//
// THIS MODULE DEFINES ONE STEP AND BORROWS FIVE. The step registry is global
// across features/steps/, so a step text may be defined exactly once and a
// second definition is an ambiguous-step error rather than an override. The
// five written with text another module already registers, and defined nowhere
// here:
//
//   Given an empty grid                              cell-life-and-death.ts
//   Given nothing has keyboard focus                 keyboard-grid-navigation.ts
//   When  I press <key>                              keyboard-grid-navigation.ts
//   Then  the game should still be on its first generation   cell-life-and-death.ts
//   Then  the game should be on its second generation        cell-life-and-death.ts
//
// That borrowing is the point rather than a saving. The generation counter is
// cell-life-and-death.ts's vocabulary and keyboard focus is
// keyboard-grid-navigation.ts's, so this feature says what it has to say about
// a keystroke and a generation in the words those two features already use --
// which is what stops "the game advanced" meaning one thing here and another
// there. What is genuinely this module's own is the control itself.
import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import { focusNextGeneration, nextGenerationControl, openGrid } from '../e2e-helpers'

const { Given } = createBdd()

// THE ONE STATE A POINTER CANNOT SET UP. Clicking this control advances the
// game, so "focused, not yet used" is reachable only from the keyboard -- and
// it is the state the scenario is about, since the defect it guards against is
// a second listener firing alongside the control's own activation.
//
// The assertion is a precondition rather than the accepted behaviour: if the
// focus never landed, the Enter that follows would reach nothing and the
// scenario would fail on the generation count with no hint as to why.
Given('the Next generation control has keyboard focus', async ({ page }) => {
  await openGrid(page)
  await focusNextGeneration(page)
  await expect(nextGenerationControl(page)).toBeFocused()
})
