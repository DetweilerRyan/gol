import { useState } from 'react'
import GenerationHud from './components/GenerationHud'
import LifeBoard from './components/LifeBoard'
import { type LiveCells } from './gameOfLife'
import { createLiveCellStore } from './liveCellStore'

interface AppProps {
  // Perf-harness seeding only -- see src/main.tsx and src/liveCellSeed.ts.
  // Undefined (the normal app boot) still yields an empty grid, via
  // createLiveCellStore's own default.
  initialLiveCells?: LiveCells
}

function App({ initialLiveCells }: AppProps = {}) {
  const [store] = useState(() => createLiveCellStore(initialLiveCells))

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-gray-50">
      <LifeBoard store={store} />

      <GenerationHud onAdvance={store.advance} />
    </div>
  )
}

export default App
