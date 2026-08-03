/**
 * Static asset registry.
 *
 * Place images under `src/assets` and re-export typed `require(...)` references
 * here so screens import assets from a single, refactor-friendly location.
 *
 * Icons are rendered as SVG via the <Icon /> component (see
 * `src/components/Icon.tsx`), so no icon font assets are required.
 */

export const images = {
  appLogo: require('./app-logo.png'),
} as const;

export const fonts = {} as const;
