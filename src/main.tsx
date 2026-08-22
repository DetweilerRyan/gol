import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { seedFromSearch } from './liveCellSeed'

// The MODE check has to live at the entry module, not in App.tsx or a hook,
// so Rolldown can constant-fold `import.meta.env.MODE === 'perf'` to `false`
// in a normal production build and tree-shake seedFromSearch (and the LCG
// behind it) out of the shipped bundle entirely -- see
// rules/no-logic-in-composition-root.yml's comment on why this file is exempt
// from that rule, and rules/no-build-env-in-domain.yml for why the same check
// may never move into liveCellSeed.ts itself. Everything else stays on the
// far side of that call: seedFromSearch already answers "no seeding
// requested" with `undefined` (no `cells` param, or an unsatisfiable one),
// which App.tsx treats as an ordinary empty grid, so nothing here has to
// decide anything beyond the mode.
const initialLiveCells = import.meta.env.MODE === 'perf' ? seedFromSearch(window.location.search) : undefined

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialLiveCells={initialLiveCells} />
  </StrictMode>,
)
