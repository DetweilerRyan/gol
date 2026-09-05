import { useState } from 'react'

interface GenerationHudProps {
  onAdvance: () => void
}

export default function GenerationHud({ onAdvance }: GenerationHudProps) {
  const [generation, setGeneration] = useState(0)

  function handleNextGeneration() {
    onAdvance()
    setGeneration((gen) => gen + 1)
  }

  return (
    <div className="absolute top-4 left-4 flex flex-col gap-3 rounded-lg bg-gray-900 p-4 text-white shadow-lg dark:bg-zinc-800">
      {/* dark:bg-zinc-800 rather than leaving this at bg-gray-900 unchanged:
          the dark board itself is zinc-900, and gray-900/zinc-900 are close
          enough in lightness (oklch 21% both) that the panel would nearly
          vanish into the board without its own, lighter dark-mode shade --
          the same elevation step Catalyst's own `light` button colour takes
          for a dark-mode surface. */}
      <h1 className="text-xl font-semibold">{"Conway's Game of Life"}</h1>

      <div className="flex items-center gap-3">
        <button
          id="next-generation-button"
          type="button"
          onClick={handleNextGeneration}
          className="rounded bg-white px-4 py-2 font-medium text-gray-900 transition-colors hover:bg-gray-200"
        >
          {'Next Generation'}
        </button>
        <span className="font-medium">Generation: {generation}</span>
      </div>
    </div>
  )
}
