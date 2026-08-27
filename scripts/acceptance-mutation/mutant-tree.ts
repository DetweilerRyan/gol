// Pure naming/path derivation for the batched-mutation temp tree: given a
// target's real .feature filename, derive the filenames its mutants and
// baseline are written under inside one shared `features/` directory, and
// given any of those filenames, derive the generated Playwright spec
// filename bddgen produces for it under `out/` (see
// playwright.acceptance-mutation.config.ts's featuresRoot/outputDir).
//
// No filesystem access here -- isolating the naming from the writing is
// what makes both this module and (later) the result classifier testable
// without a real temp directory, mirroring discovery.ts's pairTargets split.

const FEATURE_SUFFIX = '.feature'

// Once a target's own filename can be a relative path ('cell-life/cell-life.feature'),
// its derived mutant/baseline names have to land as flat files in the one
// shared temp `features/` directory run.ts writes into (mkdirSync is called
// for that directory only, never per target) -- so every '/' is flattened to
// '__' here, at the one place both derived-name functions funnel through.
//
// '__' alone is not an injective flattening: 'a/_b.feature' and
// 'a_/b.feature' both flatten to 'a___b.feature' without either containing a
// literal '__'. Rather than prove a cleverer encoding is collision-free,
// reject the case that makes '/' -> '__' unsafe: a target path may not
// itself contain '_'. Every current .feature file is kebab-case with no
// underscores, so this rejects nothing on the real tree; it exists to fail
// loudly if a future nested target ever would collide, rather than let two
// different targets silently overwrite the same temp file.
function baseName(targetFeatureFileName: string): string {
  if (!targetFeatureFileName.endsWith(FEATURE_SUFFIX)) {
    throw new Error(`Expected a .feature filename, got "${targetFeatureFileName}"`)
  }
  const withoutSuffix = targetFeatureFileName.slice(0, -FEATURE_SUFFIX.length)
  if (withoutSuffix.includes('_')) {
    throw new Error(
      `Feature path "${targetFeatureFileName}" contains "_", which is reserved for flattening nested paths into temp filenames`,
    )
  }
  return withoutSuffix.replaceAll('/', '__')
}

// One shared `features/` directory holds every target's mutants and
// baseline (the batched design architect measured end to end), so a name
// has to be unique *across* targets, not just within one -- prefixing with
// the target's own base name is what keeps "infinite-grid" and
// "camera-pan-and-zoom" from colliding on "mutant-0.feature".
export function mutantFeatureFileName(targetFeatureFileName: string, ordinal: number): string {
  return `${baseName(targetFeatureFileName)}.mutant-${ordinal}.feature`
}

export function baselineFeatureFileName(targetFeatureFileName: string): string {
  return `${baseName(targetFeatureFileName)}.baseline.feature`
}

// bddgen's generated spec filename for one input feature file, with
// featuresRoot pointed at the shared temp `features/` directory: flat, one
// spec per feature, named by appending `.spec.js` to the feature's own
// filename. Measured directly against playwright-bdd 9.2.0 by running bddgen
// against a single planted feature file with featuresRoot/outputDir
// overridden the same way playwright.acceptance-mutation.config.ts overrides
// them -- infinite-grid.mutant-0.feature produced exactly
// infinite-grid.mutant-0.feature.spec.js under `out/`, not a nested or
// renamed path.
export function specFileName(featureFileName: string): string {
  return `${featureFileName}.spec.js`
}
