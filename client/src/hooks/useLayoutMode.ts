import { useMediaQuery } from '@mantine/hooks';

export type LayoutMode = 'phone-portrait' | 'phone-landscape' | 'tablet' | 'desktop';

// docs/design/spacing-layout.md, "Critère de bascule". Evaluated in this order.
export const LAYOUT_QUERIES = {
  phoneLandscape: '(orientation: landscape) and (max-height: 499.98px)',
  phonePortrait: '(orientation: portrait) and (max-width: 575.98px)',
  desktop: '(min-width: 992px)',
} as const;

const OPTIONS = { getInitialValueInEffect: false };

/** Single source of truth for the page structure (Register, Catalog, Cart, toasts). */
export function useLayoutMode(): LayoutMode {
  const isPhoneLandscape = useMediaQuery(LAYOUT_QUERIES.phoneLandscape, false, OPTIONS);
  const isPhonePortrait = useMediaQuery(LAYOUT_QUERIES.phonePortrait, false, OPTIONS);
  const isDesktop = useMediaQuery(LAYOUT_QUERIES.desktop, false, OPTIONS);

  if (isPhoneLandscape) return 'phone-landscape';
  if (isPhonePortrait) return 'phone-portrait';
  if (isDesktop) return 'desktop';
  return 'tablet';
}

export const isPhoneMode = (mode: LayoutMode): boolean =>
  mode === 'phone-portrait' || mode === 'phone-landscape';
