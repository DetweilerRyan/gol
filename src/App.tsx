import { useEffect, useState } from 'react'
import { useImmer } from 'use-immer'
import Grid from './components/Grid'
import { createEmptyLiveCells, getNextGeneration, type LiveCells, toggleCell as toggleCellInPlace } from './gameOfLife'
import { placePattern, type Pattern } from './patternLibrary'

function App() {
  const [liveCells, updateLiveCells] = useImmer<LiveCells>(() => createEmptyLiveCells())
  const [generation, setGeneration] = useState(0)
  const [suppressEnter, setSuppressEnter] = useState(false)

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

  // The grid covers virtually the whole window, so any click focuses a cell
  // button -- a global shortcut can't skip all button targets or it would
  // never fire in normal use. Only the Next Generation button itself needs to
  // be excluded, since it already activates on Enter natively; without this
  // exclusion, focusing it and pressing Enter would advance the generation
  // twice (once from its own click handler, once from this listener).
  // suppressEnter additionally covers the pattern library modal and placing
  // mode (reported up from Grid) -- Enter shouldn't silently advance the
  // simulation while the user is browsing or lining up a pattern.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Enter') return
      if (suppressEnter) return
      if (e.target instanceof HTMLElement && e.target.id === 'next-generation-button') return
      handleNextGeneration()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNextGeneration, suppressEnter])

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-gray-50">
      <Grid
        liveCells={liveCells}
        onToggleCell={toggleCell}
        onPlacePattern={placePatternOnGrid}
        onSuppressEnterChange={setSuppressEnter}
      />

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
