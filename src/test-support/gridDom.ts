import { GRID_CONTENT_ID } from '../components/Grid'

// Shared by every test that renders Grid or its composition root (LifeBoard):
// both need to locate the pointer-handled #grid-content div by its exported
// id rather than each hand-rolling the same querySelector + null-check.
export function gridContentEl(container: HTMLElement): HTMLElement {
  const el = container.querySelector(`#${GRID_CONTENT_ID}`)
  if (!el) throw new Error(`#${GRID_CONTENT_ID} not found`)
  return el as HTMLElement
}
