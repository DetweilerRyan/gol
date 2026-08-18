import { useState } from 'react'
import { useImmer } from 'use-immer'
import Grid from './components/Grid'
import { createEmptyLiveCells, getNextGeneration, type LiveCells, toggleCell as toggleCellInPlace } from './gameOfLife'

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
    <div className="flex min-h-screen flex-col items-center gap-6 bg-gray-50 py-10">
      <h1 className="text-3xl font-semibold text-gray-900">Conway's Game of Life</h1>

      <Grid liveCells={liveCells} onToggleCell={toggleCell} />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleNextGeneration}
          className="rounded bg-gray-900 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700"
        >
          Next Generation
        </button>
        <span className="font-medium text-gray-700">Generation: {generation}</span>
      </div>
    </div>
  )
}

export default App
