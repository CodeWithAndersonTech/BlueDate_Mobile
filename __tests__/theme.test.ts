/**
 * @format
 * Lightweight unit test that exercises the theme builder without rendering any
 * native components (keeps `npm test` green during the UI-only phase).
 */

import { accentOrder, buildTheme } from '../src/theme';

describe('theme system', () => {
  it('builds a dark and light theme for every accent', () => {
    accentOrder.forEach(accent => {
      const dark = buildTheme('dark', accent);
      const light = buildTheme('light', accent);

      expect(dark.isDark).toBe(true);
      expect(light.isDark).toBe(false);
      expect(dark.colors.primary).toBe(light.colors.primary);
      expect(dark.gradients.primary.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('exposes spacing, radii and typography tokens', () => {
    const theme = buildTheme('dark', 'cosmic');
    expect(theme.spacing.base).toBe(16);
    expect(theme.radii.pill).toBeGreaterThan(100);
    expect(theme.typography.variants.h1.fontSize).toBeGreaterThan(0);
  });
});
