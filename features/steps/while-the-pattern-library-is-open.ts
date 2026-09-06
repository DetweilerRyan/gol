// Step definitions for while-the-pattern-library-is-open.feature, driving the
// real application in a real browser through Playwright-BDD.
//
// IMPORT ALLOWLIST -- playwright-bdd, @playwright/test, and ../e2e-helpers,
// checked by rules/no-domain-imports-in-bdd-steps.yml. Only two of the three
// are used: every assertion this feature makes is a step BORROWED from the
// module that owns its vocabulary, so nothing here asserts and nothing here
// needs expect.
//
// THIS MODULE HOLDS THE THREE AIMED ACTS AND NOTHING ELSE, which is the whole
// of what is peculiar to this feature. The steps around them are borrowed by
// writing the same text and defining nothing -- the registry is global across
// features/steps/, so a second definition would be an ambiguous-step error
// rather than an override:
//
//   Given a camera centered on the origin at the default zoom  camera-pan-and-zoom.ts
//   Given the pattern library is open                          pattern-library.ts
//   When  I press <key>                                        keyboard-grid-navigation.ts
//   Then  the cell at (<x>, <y>) should be dead                cell-life-and-death.ts
//   Then  the zoom percentage should be <n>                    camera-pan-and-zoom.ts
//   Then  the camera should not have moved                     camera-pan-and-zoom.ts
//
// Two of those five were written for this feature and still live elsewhere,
// because a step belongs to the module its SUBJECT belongs to rather than to
// the feature that first needed it. "the pattern library is open" is about the
// library; "the camera should not have moved" is about the camera, and is the
// negative twin of that module's "the camera should have moved ..." steps,
// measured against the same baseline its centered-origin Given records.
//
// WHY THE ACTS ARE ALL RAW-MOUSE. Every one of them has to be DELIVERED to a
// pixel and allowed to land on whichever element is topmost, because that is
// the situation each scenario describes. Playwright's Locator.click() refuses
// to click a covered element -- it would time out, and a scenario whose act
// never happened cannot say anything about what followed it. clickCell,
// clickWhereZoomInIs and dragPan all go through page.mouse for that reason.
import { createBdd } from 'playwright-bdd'
import { CENTER, clickCell, clickWhereZoomInIs, dragPan } from '../e2e-helpers'

const { When } = createBdd()

// FAR ENOUGH TO BE UNMISSABLE, AND OTHERWISE ARBITRARY. A pan that got through
// would move the origin by exactly these pixels; the Then asserts zero, so any
// non-zero distance reports it and nothing discriminates on the magnitudes.
// They stay here rather than in the step text for that reason -- a number in
// the Gherkin reads as a number the claim depends on.
const DRAG_RIGHT_PX = 60
const DRAG_DOWN_PX = 40

// Aimed at the cell's own centre pixel under the default camera, which is what
// clickCell computes -- so the scenario names a cell and the click goes exactly
// where a player aiming at that cell would put the pointer.
When('I click the cell at \\({int}, {int}\\) behind the library', async ({ page }, x: number, y: number) => {
  await clickCell(page, x, y)
})

When('I click the zoom in control behind the library', async ({ page }) => {
  await clickWhereZoomInIs(page)
})

// Starts at CENTER, the pixel the Background's camera puts the origin at and
// therefore squarely on the library panel, so the drag is one a player could
// only make ACROSS the library rather than around it.
//
// REGISTERED AS A When AND WRITTEN IN A GIVEN POSITION by the scenario that
// uses it, which playwright-bdd matches by text rather than by keyword. That is
// not a workaround: while the library is up the whole application root is
// hidden and inert, so the camera cannot be read at all until it closes, and
// the drag is therefore the state the dismissal is observed against rather than
// the last act. The feature file's own comment records the measurement.
When('I drag across the library', async ({ page }) => {
  await dragPan(page, CENTER.x, CENTER.y, DRAG_RIGHT_PX, DRAG_DOWN_PX)
})
