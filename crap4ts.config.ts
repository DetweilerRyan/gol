import { defineConfig } from 'crap4ts'

// Scoped to the unit-tested modules: the framework-free logic (grid rules,
// the pattern catalog, camera math, the pattern-placing state machine), the
// four hooks that adapt it to React, the four presentational components that
// have their own render()-based unit tests (GridToolbar, PatternLibraryModal,
// RulerLabel, Scrollbar), and Grid.tsx itself, which composes all of the
// above and has its own unit tests too. App.tsx/main.tsx are still React
// bootstrap code exercised by manual + browser testing, not unit tests, so
// they remain excluded here rather than scored against a coverage bar they
// can't clear; src/test-support/ is test infrastructure, not product code.
export default defineConfig({
  threshold: 6,
  coverageMetric: 'line',
  src: ['src'],
  include: [
    'src/gameOfLife.ts',
    'src/patternLibrary.ts',
    'src/viewport.ts',
    'src/patternPlacement.ts',
    'src/hooks/useCamera.ts',
    'src/hooks/useElementSize.ts',
    'src/hooks/usePatternPlacement.ts',
    'src/hooks/useWheelInput.ts',
    'src/components/GridToolbar.tsx',
    'src/components/PatternLibraryModal.tsx',
    'src/components/RulerLabel.tsx',
    'src/components/Scrollbar.tsx',
    'src/components/Grid.tsx',
  ],
  exclude: ['**/*.test.*', '**/*.spec.*', '**/*.d.ts'],
  // format: "table",
  // breakdown: "off",
  // sort: "crap",
  // top: 10,
  // summary: false,
})
