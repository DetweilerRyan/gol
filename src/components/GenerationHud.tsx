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
    <div className="absolute top-4 left-4 flex flex-col gap-3 rounded-lg bg-gray-900 p-4 text-white shadow-lg">
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
