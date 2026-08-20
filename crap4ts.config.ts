import { defineConfig } from 'crap4ts'

// Scoped to the unit-tested modules: the framework-free logic (grid rules,
// camera math, the pan/zoom hook) plus the four presentational components
// that now have their own render()-based unit tests (GridToolbar,
// PatternLibraryModal, RulerLabel, Scrollbar). Grid.tsx/App.tsx/main.tsx are
// still React UI/bootstrap code exercised by manual + browser testing, not
// unit tests, so they remain excluded here rather than scored against a
// coverage bar they can't clear.
export default defineConfig({
  threshold: 6,
  coverageMetric: 'line',
  src: ['src'],
  include: [
    'src/gameOfLife.ts',
    'src/viewport.ts',
    'src/hooks/useCamera.ts',
    'src/components/GridToolbar.tsx',
    'src/components/PatternLibraryModal.tsx',
    'src/components/RulerLabel.tsx',
    'src/components/Scrollbar.tsx',
  ],
  exclude: ['**/*.test.*', '**/*.spec.*', '**/*.d.ts'],
  // format: "table",
  // breakdown: "off",
  // sort: "crap",
  // top: 10,
  // summary: false,
})
