import { LAYOUT_QUERIES, type LayoutMode } from '../hooks/useLayoutMode';

const QUERY_BY_MODE: Record<LayoutMode, string | null> = {
  'phone-landscape': LAYOUT_QUERIES.phoneLandscape,
  'phone-portrait': LAYOUT_QUERIES.phonePortrait,
  desktop: LAYOUT_QUERIES.desktop,
  tablet: null,
};

/**
 * Makes `useLayoutMode()` return `mode`. Other queries can be matched too
 * (e.g. '(max-width: 767.98px)'). Call `resetLayoutMode()` after the test.
 */
export function setLayoutMode(mode: LayoutMode, extraMatches: string[] = []): void {
  const matches = [QUERY_BY_MODE[mode], ...extraMatches].filter(Boolean);
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: matches.includes(query),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

export function resetLayoutMode(): void {
  setLayoutMode('tablet');
}
