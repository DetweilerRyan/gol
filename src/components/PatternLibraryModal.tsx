import { Button } from '../catalyst/button'
import { Dialog, DialogBody, DialogTitle } from '../catalyst/dialog'
import { Subheading } from '../catalyst/heading'
import { PATTERN_CATEGORIES, patternsByCategory, type Pattern } from '../patternLibrary'

interface PatternLibraryModalProps {
  open: boolean
  onSelectPattern: (pattern: Pattern) => void
  onClose: () => void
}

// Headless UI's Dialog owns its own mount/unmount (based on `open`), portal,
// focus trap, and outside-click/Escape-to-close -- so unlike the previous
// hand-rolled version, this component no longer needs its own
// stopPropagation/onClick-to-close wiring. It still unmounts when closed
// (Headless's default), so the toHaveCount(0) test assertions still hold.
export default function PatternLibraryModal({ open, onSelectPattern, onClose }: PatternLibraryModalProps) {
  return (
    <Dialog open={open} onClose={onClose} size="sm">
      <DialogTitle>Pattern Library</DialogTitle>
      <DialogBody>
        {PATTERN_CATEGORIES.map((category) => (
          <section key={category} className="mb-4 last:mb-0">
            <Subheading level={3} className="mb-1 text-sm! font-semibold! text-gray-500!">
              {category}
            </Subheading>
            <div className="flex flex-col">
              {patternsByCategory(category).map((pattern) => (
                <Button key={pattern.name} plain className="justify-start" onClick={() => onSelectPattern(pattern)}>
                  {pattern.name}
                </Button>
              ))}
            </div>
          </section>
        ))}
      </DialogBody>
    </Dialog>
  )
}
