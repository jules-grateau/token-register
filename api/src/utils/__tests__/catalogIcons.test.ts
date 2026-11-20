import { CATALOG_ICON_KEYS, isCatalogIconKey, isValidIconField } from '../catalogIcons';

describe('catalog icon whitelist (D-046)', () => {
  it('holds the 29 keys of docs/design/icons.md', () => {
    expect(CATALOG_ICON_KEYS).toHaveLength(29);
    expect(CATALOG_ICON_KEYS).toEqual(expect.arrayContaining(['beer', 'deposit', 'goodies']));
  });

  it('accepts a known key only', () => {
    expect(isCatalogIconKey('beer')).toBe(true);
    expect(isCatalogIconKey('IconBeer')).toBe(false);
    expect(isCatalogIconKey('toString')).toBe(false);
    expect(isCatalogIconKey(null)).toBe(false);
  });

  it('accepts a missing or null icon field', () => {
    expect(isValidIconField(undefined)).toBe(true);
    expect(isValidIconField(null)).toBe(true);
    expect(isValidIconField('')).toBe(false);
    expect(isValidIconField(3)).toBe(false);
  });
});
