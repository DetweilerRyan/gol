import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import GridToolbar from './GridToolbar'

function renderToolbar() {
  const onZoomIn = vi.fn()
  const onZoomOut = vi.fn()
  const onReset = vi.fn()
  const onPatterns = vi.fn()
  render(<GridToolbar onZoomIn={onZoomIn} onZoomOut={onZoomOut} onReset={onReset} onPatterns={onPatterns} />)
  return { onZoomIn, onZoomOut, onReset, onPatterns }
}

describe('GridToolbar', () => {
  it('renders all four buttons with their aria-labels', () => {
    renderToolbar()
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset view' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open pattern library' })).toBeInTheDocument()
  })

  it.each([
    ['Zoom in', 'onZoomIn'],
    ['Zoom out', 'onZoomOut'],
    ['Reset view', 'onReset'],
    ['Open pattern library', 'onPatterns'],
  ] as const)('clicking %s calls %s only', async (buttonName, expectedHandler) => {
    const user = userEvent.setup()
    const handlers = renderToolbar()
    await user.click(screen.getByRole('button', { name: buttonName }))
    for (const [name, handler] of Object.entries(handlers)) {
      expect(handler).toHaveBeenCalledTimes(name === expectedHandler ? 1 : 0)
    }
  })
})
