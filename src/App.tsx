import { useState } from 'react'
import { useImmer } from 'use-immer'
import LifeBoard from './components/LifeBoard'
import { createEmptyLiveCells, getNextGeneration, type LiveCells, toggleCell as toggleCellInPlace } from './gameOfLife'
import { placePattern, type Pattern } from './patternLibrary'

function App() {
  const [liveCells, updateLiveCells] = useImmer<LiveCells>(() => createEmptyLiveCells())
  const [generation, setGeneration] = useState(0)

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
    setGeneration((gen) => gen + 1)
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-gray-50">
      <LifeBoard liveCells={liveCells} onToggleCell={toggleCell} onPlacePattern={placePatternOnGrid} />

      <div className="absolute top-4 left-4 flex flex-col gap-3 rounded-lg bg-gray-900 p-4 text-white shadow-lg">
        <h1 className="text-xl font-semibold">Conway's Game of Life</h1>

        <div className="flex items-center gap-3">
          <button
            id="next-generation-button"
            type="button"
            onClick={handleNextGeneration}
            className="rounded bg-white px-4 py-2 font-medium text-gray-900 transition-colors hover:bg-gray-200"
          >
            Next Generation
          </button>
          <span className="font-medium">Generation: {generation}</span>
        </div>
      </div>
    </div>
  )
}

export default App
