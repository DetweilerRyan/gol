import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { AppearancePreference } from '../appearance'
import GridToolbar from './GridToolbar'

function renderToolbar(appearancePreference: AppearancePreference = 'system') {
  const onZoomIn = vi.fn()
  const onZoomOut = vi.fn()
  const onReset = vi.fn()
  const onPatterns = vi.fn()
  const onAppearanceChange = vi.fn()
  render(
    <GridToolbar
      onZoomIn={onZoomIn}
      onZoomOut={onZoomOut}
      onReset={onReset}
      onPatterns={onPatterns}
      appearancePreference={appearancePreference}
      onAppearanceChange={onAppearanceChange}
    />,
  )
  return { onZoomIn, onZoomOut, onReset, onPatterns, onAppearanceChange }
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
      if (name === 'onAppearanceChange') continue
      expect(handler).toHaveBeenCalledTimes(name === expectedHandler ? 1 : 0)
    }
  })

  describe('the appearance control', () => {
    it('exposes an Appearance combobox with all three options', () => {
      renderToolbar()
      const combobox = screen.getByRole('combobox', { name: 'Appearance' })
      expect(combobox).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Light' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Dark' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Follow system' })).toBeInTheDocument()
    })

    it.each(['light', 'dark', 'system'] as const)(
      'shows %s as the selected option when that is the preference',
      (preference) => {
        renderToolbar(preference)
        const combobox = screen.getByRole('combobox', { name: 'Appearance' }) as HTMLSelectElement
        expect(combobox.value).toBe(preference)
      },
    )

    it.each([
      ['Light', 'light'],
      ['Dark', 'dark'],
      ['Follow system', 'system'],
    ] as const)('choosing %s calls onAppearanceChange with %s and nothing else', async (label, expected) => {
      const user = userEvent.setup()
      const handlers = renderToolbar()
      await user.selectOptions(screen.getByRole('combobox', { name: 'Appearance' }), label)
      expect(handlers.onAppearanceChange).toHaveBeenCalledExactlyOnceWith(expected)
      expect(handlers.onZoomIn).not.toHaveBeenCalled()
      expect(handlers.onZoomOut).not.toHaveBeenCalled()
      expect(handlers.onReset).not.toHaveBeenCalled()
      expect(handlers.onPatterns).not.toHaveBeenCalled()
    })
  })
})
