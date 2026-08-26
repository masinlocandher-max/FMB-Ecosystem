/* Standalone microsites.
 *
 * Most public HTML in this repository belongs to the FMB unified shell: the
 * FMB&CO. header, the ecosystem navigation, the corporate footer, and the
 * unified stylesheet and script. The post-build passes assume that, and the
 * design gate audits for it.
 *
 * A small number of routes are deliberately NOT part of that system. They are
 * standalone microsites: they live on the FMB domain, but they present as
 * their own thing, with their own art direction and no ecosystem chrome.
 *
 * Those routes are listed here once, and every sitewide pass imports this list
 * rather than keeping its own copy. Excluding a microsite at the source of the
 * build is the supported approach — do not inject the shell and then strip it
 * out again afterwards.
 *
 * Prefixes are matched against dist-relative POSIX paths, e.g.
 * "MissIntercontinental/index.html".
 */

export const STANDALONE_MICROSITE_PREFIXES = Object.freeze([
  // Francine's personal application profile for the Miss Intercontinental
  // organization. Deliberately independent of the corporate ecosystem.
  'MissIntercontinental/',
]);

/* Prefixes excluded from unified-shell passes for reasons other than being a
 * standalone microsite: applications, APIs, authenticated areas, admin. */
export const SYSTEM_PREFIXES = Object.freeze([
  '_sites/',
  'app/',
  'api/',
  'auth/',
  'admin/',
  'data/',
  'yoni/',
]);

/** True when a dist-relative path belongs to a standalone microsite. */
export function isStandaloneMicrosite(name) {
  return STANDALONE_MICROSITE_PREFIXES.some((prefix) => name.startsWith(prefix));
}

/**
 * Extend a script's own exclusion list with the standalone microsites.
 * Keeps each script's extra prefixes (for example 'data-center/') intact.
 */
export function withMicrositeExclusions(prefixes = SYSTEM_PREFIXES) {
  const merged = new Set([...prefixes, ...STANDALONE_MICROSITE_PREFIXES]);
  return [...merged];
}
