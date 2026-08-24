// The per-feature harness for cell-life-and-death.feature, and the ONLY module
// its steps file imports. It owns exactly one thing the shared core cannot
// know: which part of the infinite world this feature's scenarios must be able
// to observe. It mounts nothing itself -- board.tsx owns the single active
// board -- and it composes no extra capability onto the Board, because every
// step of this feature is served by the core's own toggle/advance/stateAt/
// liveCount/generation. A feature that needs more (a wheel gesture, a modal
// query) adds it in ITS OWN module like this one, over board.tsx's exported
// cellButton and assertActive, rather than by editing the core.
import { mountBoardRequiring, type Board, type WorldWindow } from './board'

// Re-exported so the steps file names one module and not two: `Board` is the
// type of what mountBoard() hands back, and where that type is declared is the
// harness's business rather than a step's.
export type { Board }

// The world rectangle every scenario in cell-life-and-death.feature, and
// every mutant of it, needs to be able to observe. mountBoardRequiring()
// asserts the mounted window CONTAINS this -- see assertWindowMounted() for
// why containment rather than equality. Every coordinate the feature touches
// -- INCLUDING every seeded mutant of it that acceptance-mutation generates
// -- lands inside it:
//
//   x -> -5              puts a blinker arm at -6
//   y -> 5               puts the post-generation blinker at y 4..6
//   expected center x -> 8
//   expected center y -> -3   reads cells at y -4..-2
//
// A 160x160 viewport mounts only -4..7 and would miss two of those, which is
// what fixes board.tsx's VIEWPORT at its lower bound.
//
// ONE RESIDUAL, recorded rather than guarded against: mutation-rules.ts's
// mutateInteger draws a nonzero delta in +/-9, so a mutated <x> could in
// principle be -8 and put a blinker arm at -9 -- one cell outside even the
// mounted window. That does not happen at the current seeds (all four
// coordinate mutants are listed above), and if a future seed change reaches
// it, board.tsx's CELL_NOT_MOUNTED sentinel is what makes the miss greppable
// instead of silent.
const REQUIRED_WINDOW: WorldWindow = { minX: -6, maxX: 8, minY: -4, maxY: 6 }

export function mountBoard(): Board {
  return mountBoardRequiring(REQUIRED_WINDOW).board
}
