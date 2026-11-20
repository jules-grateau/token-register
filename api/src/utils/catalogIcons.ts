import type { CatalogIconKey } from 'shared-ts';

/**
 * Whitelist of catalog icon keys (D-046, D-047), docs/design/icons.md "Icônes produit".
 * A Record so that the compiler fails when a key of CatalogIconKey is missing here.
 */
const CATALOG_ICON_KEY_SET: Record<CatalogIconKey, true> = {
  beer: true,
  wine: true,
  cocktail: true,
  soft_drink: true,
  bottle: true,
  water: true,
  coffee: true,
  hot_drink: true,
  milk: true,
  cup: true,
  sandwich: true,
  burger: true,
  hot_dog: true,
  pizza: true,
  salad: true,
  soup: true,
  meat: true,
  grill: true,
  cheese: true,
  snack: true,
  cookie: true,
  cake: true,
  ice_cream: true,
  candy: true,
  fruit: true,
  deposit: true,
  ticket: true,
  tshirt: true,
  goodies: true,
};

export const CATALOG_ICON_KEYS = Object.keys(CATALOG_ICON_KEY_SET) as CatalogIconKey[];

export const INVALID_ICON_MESSAGE =
  'Invalid icon: it must be one of the catalog icon keys, or null';

export function isCatalogIconKey(value: unknown): value is CatalogIconKey {
  return (
    typeof value === 'string' && Object.prototype.hasOwnProperty.call(CATALOG_ICON_KEY_SET, value)
  );
}

/** An icon field of a request body: missing (undefined), null (no icon) or a known key. */
export function isValidIconField(value: unknown): value is CatalogIconKey | null | undefined {
  return value === undefined || value === null || isCatalogIconKey(value);
}
