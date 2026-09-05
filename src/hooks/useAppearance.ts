import { useLayoutEffect, useState } from 'react'
import {
  APPEARANCE_STORAGE_KEY,
  parseAppearancePreference,
  resolveAppearance,
  type Appearance,
  type AppearancePreference,
} from '../appearance'
import { useSystemAppearance } from './useSystemAppearance'

export interface UseAppearanceResult {
  // What the player asked for -- possibly 'system'.
  preference: AppearancePreference
  // What is actually painted -- never 'system', see appearance.ts.
  appearance: Appearance
  choosePreference: (next: AppearancePreference) => void
}

// Owns the one appearance preference the whole app has. Called exactly once,
// from App.tsx -- a second call site would hold a second useState and the
// two could desync (see App.tsx's own comment at its call site). Delegates
// every rule to appearance.ts; this hook owns only what's genuinely
// React/browser: the persisted preference as state, and the one effect that
// pushes the resolved appearance onto <html> for Tailwind's `dark:` variant
// (and this slice's @custom-variant override in src/index.css) to key off.
export function useAppearance(): UseAppearanceResult {
  const [preference, setPreference] = useState<AppearancePreference>(() =>
    parseAppearancePreference(localStorage.getItem(APPEARANCE_STORAGE_KEY)),
  )
  const systemAppearance = useSystemAppearance()
  const appearance = resolveAppearance(preference, systemAppearance)

  // A layout effect (rather than a plain effect), so the .dark class lands
  // before paint rather than after -- see useInitialCentering.ts's own
  // comment for the same reasoning. A plain effect leaves a frame in which
  // the app has already painted in the wrong appearance. useLayoutEffect
  // warns during SSR, but this app has no SSR (main.tsx is a plain client
  // bootstrap), so that's not a concern here.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', appearance === 'dark')
  }, [appearance])

  function choosePreference(next: AppearancePreference) {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, next)
    setPreference(next)
  }

  return { preference, appearance, choosePreference }
}
