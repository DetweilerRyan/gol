import { defineConfig } from 'crap4ts'

// Scoped to the unit-tested, framework-free logic modules (grid rules, camera
// math, the pan/zoom hook). App.tsx/Grid.tsx/main.tsx are React UI/bootstrap
// code exercised by manual + browser testing, not unit tests, so they're
// excluded here rather than scored against a coverage bar they can't clear.
export default defineConfig({
  threshold: 6,
  coverageMetric: 'line',
  src: ['src'],
  include: ['src/gameOfLife.ts', 'src/viewport.ts', 'src/hooks/useCamera.ts'],
  exclude: ['**/*.test.*', '**/*.spec.*', '**/*.d.ts'],
  // format: "table",
  // breakdown: "off",
  // sort: "crap",
  // top: 10,
  // summary: false,
})
