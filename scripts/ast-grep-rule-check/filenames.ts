// The naming convention that binds a rule to its fixture, in one place: a rule
// at `<ruleDir>/<id>.yml` is tested by a fixture at `<testDir>/<id>-test.yml`.
// Both directions of that mapping are used -- checks.ts's checkFixtureExists
// goes rule id -> fixture stem, checkFixtureIdMatchesFilename goes fixture stem
// -> rule id -- so they live next to each other here, where a change to the
// suffix can't update one direction and miss the other. `filenameStemOf` is
// here for the same reason: rule-file.ts and fixture-file.ts both need it, and
// two hand-kept copies of a stem-extraction rule is exactly the kind of drift
// this program exists to catch in the rules it checks.

// The suffix ast-grep fixtures carry by this repo's convention. Not ast-grep's
// own rule -- ast-grep binds a fixture to a rule by the fixture's `id:` and
// doesn't care what the file is called (see checkFixtureIdMatchesFilename),
// which is precisely why the filename convention has to be checked separately.
const FIXTURE_SUFFIX = '-test'

// Directories are stripped by slicing at the last `/` rather than by an
// anchored `/^.*\//` regex. The two agree on every path without a line
// terminator, which made the `^` unfalsifiable-looking -- but `.` doesn't
// match a newline, so the anchored regex and its unanchored mutant really do
// diverge on `a\nb/c.yml` (`a\nb/c` vs `c`), and slicing simply says the last
// slash wins for every string. The `.ya?ml$` anchor below *is* load-bearing
// -- see the mid-filename ".yaml" test in filenames.test.ts.
export function filenameStemOf(relativePath: string): string {
  return relativePath.slice(relativePath.lastIndexOf('/') + 1).replace(/\.ya?ml$/, '')
}

// Rule id -> the filename stem its fixture must have.
export function fixtureStemForRuleId(ruleId: string): string {
  return `${ruleId}${FIXTURE_SUFFIX}`
}

// Fixture filename stem -> the rule id that filename claims to test. Written
// as endsWith/slice rather than a `-test` regex so the strip is anchored to
// the end by construction: a fixture named `no-test-thing` tests
// `no-test-thing`, not `no-thing`.
export function ruleIdForFixtureStem(fixtureStem: string): string {
  if (!fixtureStem.endsWith(FIXTURE_SUFFIX)) return fixtureStem
  return fixtureStem.slice(0, -FIXTURE_SUFFIX.length)
}
