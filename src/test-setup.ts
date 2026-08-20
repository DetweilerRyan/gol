import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// vitest.config.ts doesn't enable `test.globals`, so @testing-library/react's
// own auto-cleanup (which detects a global `afterEach`) never fires -- without
// this, components rendered by one test/`it` block stay mounted into the next,
// producing "multiple elements found" failures across component test files.
afterEach(() => {
  cleanup()
})
