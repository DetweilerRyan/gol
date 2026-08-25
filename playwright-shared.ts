import { devices } from '@playwright/test'
import { devPort } from './dev-port.ts'

// Shared between playwright.config.ts (the hand-written e2e suite) and
// playwright.acceptance-mutation.config.ts (the acceptance-mutation runner's
// generated bdd specs, see scripts/acceptance-mutation/). Both need the exact
// same dev-server URL and viewport: features/e2e-helpers.ts's pixel-math
// constants (CENTER = {x:640,y:450} and everything derived from it, per
// CLAUDE.md) assume precisely this camera, and a silent drift between the two
// configs would make mutation results disagree with the e2e gate for an
// invisible reason.
//
// The port is this worktree's own (see dev-port.ts), not a fixed 5173.
export const baseURL = `http://localhost:${devPort()}`

// devices['Desktop Chrome'] carries its own viewport (1280x720), which would
// otherwise win over a 900-height override -- reasserted explicitly here so
// every pixel-math formula in both suites can rely on exactly 1280x900.
export const chromium1280x900 = { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } }
