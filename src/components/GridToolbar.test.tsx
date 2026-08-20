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

  it('clicking Zoom in calls onZoomIn only', async () => {
    const user = userEvent.setup()
    const { onZoomIn, onZoomOut, onReset, onPatterns } = renderToolbar()
    await user.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(onZoomIn).toHaveBeenCalledTimes(1)
    expect(onZoomOut).not.toHaveBeenCalled()
    expect(onReset).not.toHaveBeenCalled()
    expect(onPatterns).not.toHaveBeenCalled()
  })

  it('clicking Zoom out calls onZoomOut only', async () => {
    const user = userEvent.setup()
    const { onZoomIn, onZoomOut, onReset, onPatterns } = renderToolbar()
    await user.click(screen.getByRole('button', { name: 'Zoom out' }))
    expect(onZoomOut).toHaveBeenCalledTimes(1)
    expect(onZoomIn).not.toHaveBeenCalled()
    expect(onReset).not.toHaveBeenCalled()
    expect(onPatterns).not.toHaveBeenCalled()
  })

  it('clicking Reset view calls onReset only', async () => {
    const user = userEvent.setup()
    const { onZoomIn, onZoomOut, onReset, onPatterns } = renderToolbar()
    await user.click(screen.getByRole('button', { name: 'Reset view' }))
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(onZoomIn).not.toHaveBeenCalled()
    expect(onZoomOut).not.toHaveBeenCalled()
    expect(onPatterns).not.toHaveBeenCalled()
  })

  it('clicking Open pattern library calls onPatterns only', async () => {
    const user = userEvent.setup()
    const { onZoomIn, onZoomOut, onReset, onPatterns } = renderToolbar()
    await user.click(screen.getByRole('button', { name: 'Open pattern library' }))
    expect(onPatterns).toHaveBeenCalledTimes(1)
    expect(onZoomIn).not.toHaveBeenCalled()
    expect(onZoomOut).not.toHaveBeenCalled()
    expect(onReset).not.toHaveBeenCalled()
  })
})
