import { useState } from 'react'
import GenerationHud from './components/GenerationHud'
import LifeBoard from './components/LifeBoard'
import { type LiveCells } from './gameOfLife'
import { useAppearance } from './hooks/useAppearance'
import { createLiveCellStore } from './liveCellStore'

interface AppProps {
  // Perf-harness seeding only -- see src/main.tsx and src/liveCellSeed.ts.
  // Undefined (the normal app boot) still yields an empty grid, via
  // createLiveCellStore's own default.
  initialLiveCells?: LiveCells
}

function App({ initialLiveCells }: AppProps = {}) {
  const [store] = useState(() => createLiveCellStore(initialLiveCells))
  // Called exactly once -- see useAppearance.ts's own comment on why a
  // second call site would desync. preference/choosePreference are forwarded
  // down to LifeBoard -> GridToolbar as plain props; `appearance` itself is
  // never read here or passed down, since nothing below this component
  // branches on it -- the hook's own effect is what pushes it onto <html>.
  const { preference, choosePreference } = useAppearance()

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-gray-50 dark:bg-zinc-900">
      <LifeBoard store={store} appearancePreference={preference} onAppearanceChange={choosePreference} />

      <GenerationHud onAdvance={store.advance} />
    </div>
  )
}

export default App
