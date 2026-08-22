import { useImmer } from 'use-immer'
import GenerationHud from './components/GenerationHud'
import LifeBoard from './components/LifeBoard'
import { createEmptyLiveCells, getNextGeneration, type LiveCells, toggleCell as toggleCellInPlace } from './gameOfLife'
import { placePattern, type Pattern } from './patternLibrary'

interface AppProps {
  // Perf-harness seeding only -- see src/main.tsx and src/liveCellSeed.ts.
  // Undefined (the normal app boot) still yields an empty grid.
  initialLiveCells?: LiveCells
}

function App({ initialLiveCells }: AppProps = {}) {
  const [liveCells, updateLiveCells] = useImmer<LiveCells>(() => initialLiveCells ?? createEmptyLiveCells())

  function toggleCell(x: number, y: number) {
    updateLiveCells((draft) => {
      toggleCellInPlace(draft, x, y)
    })
  }

  function placePatternOnGrid(pattern: Pattern, anchorX: number, anchorY: number) {
    updateLiveCells((draft) => {
      placePattern(draft, pattern, anchorX, anchorY)
    })
  }

  function handleNextGeneration() {
    updateLiveCells((draft) => getNextGeneration(draft))
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-gray-50">
      <LifeBoard liveCells={liveCells} onToggleCell={toggleCell} onPlacePattern={placePatternOnGrid} />

      <GenerationHud onAdvance={handleNextGeneration} />
    </div>
  )
}

export default App
