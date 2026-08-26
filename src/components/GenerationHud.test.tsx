import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import GenerationHud from './GenerationHud'

describe('GenerationHud', () => {
  it('renders the next-generation button and starts at generation 0', () => {
    render(<GenerationHud onAdvance={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Next Generation' })).toHaveAttribute('id', 'next-generation-button')
    expect(screen.getByText('Generation: 0')).toBeInTheDocument()
  })

  it('renders the page heading', () => {
    render(<GenerationHud onAdvance={vi.fn()} />)
    expect(screen.getByRole('heading', { name: "Conway's Game of Life" })).toBeInTheDocument()
  })

  it('renders the panel positioned top-left', () => {
    const { container } = render(<GenerationHud onAdvance={vi.fn()} />)
    expect(container.firstElementChild).toHaveClass('absolute', 'top-4', 'left-4')
  })

  it('calls onAdvance and increments its own generation count on click', async () => {
    const user = userEvent.setup()
    const onAdvance = vi.fn()
    render(<GenerationHud onAdvance={onAdvance} />)

    await user.click(screen.getByRole('button', { name: 'Next Generation' }))

    expect(onAdvance).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Generation: 1')).toBeInTheDocument()
  })

  it('increments generation independently on repeated clicks', async () => {
    const user = userEvent.setup()
    const onAdvance = vi.fn()
    render(<GenerationHud onAdvance={onAdvance} />)

    const button = screen.getByRole('button', { name: 'Next Generation' })
    await user.click(button)
    await user.click(button)
    await user.click(button)

    expect(onAdvance).toHaveBeenCalledTimes(3)
    expect(screen.getByText('Generation: 3')).toBeInTheDocument()
  })
})
