import {
  IconApple,
  IconBaguette,
  IconBeer,
  IconBottle,
  IconBurger,
  IconCake,
  IconCandy,
  IconCheese,
  IconCoffee,
  IconCookie,
  IconCup,
  IconDroplet,
  IconGift,
  IconGlass,
  IconGlassCocktail,
  IconGlassFull,
  IconGrill,
  IconIceCream,
  IconMeat,
  IconMilk,
  IconMug,
  IconPackage,
  IconPizza,
  IconRecycle,
  IconSalad,
  IconSausage,
  IconShirt,
  IconSoup,
  IconTicket,
  type Icon,
} from '@tabler/icons-react';
import type { CatalogIconKey } from 'shared-ts';

/**
 * Catalog icons (D-046, D-047): key stored in the database -> Tabler component.
 * docs/design/icons.md, "Icônes produit". The order is the order of the picker
 * (drinks, dishes, desserts, misc.). The label is `catalog_icons.<key>` in the locales.
 */
const CATALOG_ICONS: Record<CatalogIconKey, Icon> = {
  beer: IconBeer,
  wine: IconGlass,
  cocktail: IconGlassCocktail,
  soft_drink: IconGlassFull,
  bottle: IconBottle,
  water: IconDroplet,
  coffee: IconCoffee,
  hot_drink: IconMug,
  milk: IconMilk,
  cup: IconCup,
  sandwich: IconBaguette,
  burger: IconBurger,
  hot_dog: IconSausage,
  pizza: IconPizza,
  salad: IconSalad,
  soup: IconSoup,
  meat: IconMeat,
  grill: IconGrill,
  cheese: IconCheese,
  snack: IconPackage,
  cookie: IconCookie,
  cake: IconCake,
  ice_cream: IconIceCream,
  candy: IconCandy,
  fruit: IconApple,
  deposit: IconRecycle,
  ticket: IconTicket,
  tshirt: IconShirt,
  goodies: IconGift,
};

export const CATALOG_ICON_KEYS = Object.keys(CATALOG_ICONS) as CatalogIconKey[];

/** Icon used by a deposit (negative price) without a chosen icon (D-046). */
export const DEPOSIT_ICON_KEY: CatalogIconKey = 'deposit';

export function isCatalogIconKey(value: unknown): value is CatalogIconKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(CATALOG_ICONS, value);
}

/** Component of a stored key. An unknown key (list shortened later) counts as "no icon". */
export function getCatalogIcon(key: string | null | undefined): Icon | null {
  return isCatalogIconKey(key) ? CATALOG_ICONS[key] : null;
}

/** D-046: a product without icon shows its initial (first character, upper case). */
export function getInitial(name: string): string {
  const first = Array.from(name.trim())[0];
  return first ? first.toLocaleUpperCase() : '';
}
