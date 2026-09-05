// The pure rules behind the appearance preference: what a player can ask
// for, what is actually painted once that request is resolved against the
// system, and how a persisted preference is read back safely. Framework-free
// on purpose -- src/hooks/useSystemAppearance.ts and useAppearance.ts are the
// browser-facing adapters (matchMedia, localStorage, the <html> class toggle)
// that call into this; nothing here reads a DOM API or a clock.

// What a player wants: a fixed appearance, or whichever one the system is
// asking for at the time.
export type AppearancePreference = 'light' | 'dark' | 'system'

// What is actually on screen once a preference has been resolved against the
// system. There is no 'system' here on purpose -- following the system still
// puts exactly one of these two in front of the player.
export type Appearance = 'light' | 'dark'

// The localStorage key the preference is persisted under, named once so a
// reader and a writer can't drift apart.
export const APPEARANCE_STORAGE_KEY = 'appearance-preference'

// A fixed preference wins outright; 'system' defers to whatever the system
// is currently reporting.
export function resolveAppearance(preference: AppearancePreference, systemAppearance: Appearance): Appearance {
  return preference === 'system' ? systemAppearance : preference
}

// Reads a persisted preference back. Anything that is not one of the two
// fixed values -- absent (no key written yet, i.e. null), the empty string,
// corrupted, or written by some other version of this app -- resolves to
// 'system' rather than throwing, so a first-run visitor and a
// corrupted-storage visitor land on the same safe default instead of a
// broken page.
export function parseAppearancePreference(raw: string | null): AppearancePreference {
  return raw === 'light' || raw === 'dark' ? raw : 'system'
}
