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
  crownHero: require('./figma/crown-hero.png'),
  googleLogo: require('./auth/google.png'),
  authHero: [
    require('./auth/hero-1.png'),
    require('./auth/hero-2.png'),
    require('./auth/hero-3.png'),
    require('./auth/hero-4.png'),
    require('./auth/hero-5.png'),
    require('./auth/hero-6.png'),
  ],
} as const;

export const fonts = {} as const;
