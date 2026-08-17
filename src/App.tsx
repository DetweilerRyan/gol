import { useState } from 'react'
import { useImmer } from 'use-immer'
import Grid from './components/Grid'
import {
  createEmptyLiveCells,
  getNextGeneration,
  type LiveCells,
  toggleCell as toggleCellInPlace,
} from './gameOfLife'

function App() {
  const [liveCells, updateLiveCells] = useImmer<LiveCells>(() => createEmptyLiveCells())
  const [generation, setGeneration] = useState(0)

  function toggleCell(x: number, y: number) {
    updateLiveCells((draft) => {
      toggleCellInPlace(draft, x, y)
    })
  }

  function handleNextGeneration() {
    updateLiveCells((draft) => getNextGeneration(draft))
    setGeneration((gen) => gen + 1)
  }

  return (
    <div className="min-h-screen flex flex-col items-center gap-6 py-10 bg-gray-50">
      <h1 className="text-3xl font-semibold text-gray-900">Conway's Game of Life</h1>

      <Grid liveCells={liveCells} onToggleCell={toggleCell} />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleNextGeneration}
          className="px-4 py-2 rounded bg-gray-900 text-white font-medium hover:bg-gray-700 transition-colors"
        >
          Next Generation
        </button>
        <span className="text-gray-700 font-medium">Generation: {generation}</span>
      </div>
    </div>
  )
}

export default App
