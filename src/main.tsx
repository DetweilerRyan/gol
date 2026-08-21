import { enableMapSet } from 'immer'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { buildSeededLiveCells, parseSeedRequest } from './liveCellSeed'

enableMapSet()

// The MODE check has to live at the entry module, not in App.tsx or a hook,
// so Rolldown can constant-fold `import.meta.env.MODE === 'perf'` to `false`
// in a normal production build and tree-shake buildSeededLiveCells (and its
// LCG) out of the shipped bundle entirely -- see rules/no-logic-in-composition-root.yml's
// comment on why this file is exempt from that rule, and rules/no-build-env-in-domain.yml
// for why the same check may never move into liveCellSeed.ts itself. parseSeedRequest can
// legally return undefined (no `cells` param, or an unsatisfiable one), which still means
// "no seeding requested" rather than a crash, so this stays gated behind MODE rather than
// asserted non-null.
function seedFromSearch(search: string) {
  const request = parseSeedRequest(search)
  return request ? buildSeededLiveCells(request) : undefined
}
const initialLiveCells = import.meta.env.MODE === 'perf' ? seedFromSearch(window.location.search) : undefined

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialLiveCells={initialLiveCells} />
  </StrictMode>,
)
