import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PATTERN_CATEGORIES, patternsByCategory } from '../patternLibrary'
import PatternLibraryModal from './PatternLibraryModal'

describe('PatternLibraryModal', () => {
  it('renders every category heading and pattern name when open', () => {
    render(<PatternLibraryModal open onSelectPattern={vi.fn()} onClose={vi.fn()} />)

    for (const category of PATTERN_CATEGORIES) {
      expect(screen.getByText(category)).toBeInTheDocument()
      for (const pattern of patternsByCategory(category)) {
        expect(screen.getByRole('button', { name: pattern.name })).toBeInTheDocument()
      }
    }
  })

  it('clicking a pattern button calls onSelectPattern with that exact pattern object', () => {
    const onSelectPattern = vi.fn()
    render(<PatternLibraryModal open onSelectPattern={onSelectPattern} onClose={vi.fn()} />)

    const glider = patternsByCategory('Spaceships').find((pattern) => pattern.name === 'Glider')
    expect(glider).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Glider' }))
    expect(onSelectPattern).toHaveBeenCalledTimes(1)
    expect(onSelectPattern).toHaveBeenCalledWith(glider)
  })

  it('does not render dialog content when closed (Headless UI unmounts on close)', () => {
    render(<PatternLibraryModal open={false} onSelectPattern={vi.fn()} onClose={vi.fn()} />)

    expect(screen.queryByText('Pattern Library')).not.toBeInTheDocument()
    for (const category of PATTERN_CATEGORIES) {
      expect(screen.queryByText(category)).not.toBeInTheDocument()
    }
    expect(screen.queryByRole('button', { name: 'Glider' })).not.toBeInTheDocument()
  })
})
