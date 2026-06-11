/**
 * Static asset registry.
 *
 * Place images under `src/assets/images`, fonts under `src/assets/fonts` and
 * re-export typed `require(...)` references here so screens import assets from a
 * single, refactor-friendly location, e.g.:
 *
 *   export const images = {
 *     onboarding: require('./images/onboarding.png'),
 *   };
 *
 * Icons are rendered as SVG via the <Icon /> component (see
 * `src/components/Icon.tsx`), so no icon font assets are required.
 */

export const images = {} as const;
export const fonts = {} as const;
