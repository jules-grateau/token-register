/**
 * Key of a catalog icon (D-046, D-047): closed list of docs/design/icons.md, "Icônes produit".
 * The database stores the key, never the icon itself. Adding an icon = adding a key here, in the
 * API whitelist (api/src/utils/catalogIcons.ts) and in the client map
 * (client/src/config/catalogIcons.ts); both are checked against this type.
 */
export type CatalogIconKey =
  | 'beer'
  | 'wine'
  | 'cocktail'
  | 'soft_drink'
  | 'bottle'
  | 'water'
  | 'coffee'
  | 'hot_drink'
  | 'milk'
  | 'cup'
  | 'sandwich'
  | 'burger'
  | 'hot_dog'
  | 'pizza'
  | 'salad'
  | 'soup'
  | 'meat'
  | 'grill'
  | 'cheese'
  | 'snack'
  | 'cookie'
  | 'cake'
  | 'ice_cream'
  | 'candy'
  | 'fruit'
  | 'deposit'
  | 'ticket'
  | 'tshirt'
  | 'goodies';

export type ProductType = {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  /** Optional icon (D-046). null or missing: the card shows the product's initial. */
  icon?: CatalogIconKey | null;
};

export type CartItemType = {
  product: ProductType;
  quantity: number;
  discountedAmount: number;
};

export type OrderItemType = {
  productId: number | null;
  productName: string;
  productPrice: number;
  categoryName: string;
  quantity: number;
  discountedAmount: number;
};

/**
 * How an order was paid, in the smallest unit of the currency (EUR instances only).
 * A mode that was not used is null. When both are set, their sum is the order total
 * (cash + card split). A total <= 0 has a single mode, whose amount is the total.
 * The cash received and the change given back are not stored.
 */
export type OrderPaymentType = {
  cashAmount: number | null;
  cardAmount: number | null;
};

export type OrderType = {
  id: number;
  date: number;
  items: OrderItemType[];
  /** null for orders placed before payments were recorded, and on token instances. */
  payment: OrderPaymentType | null;
};

/** Machine-readable error codes returned by the API next to `error`. */
export type ApiErrorCode = 'PAYMENT_REQUIRED';

/** Body of POST /orders. `payment` is required on EUR instances and refused on token ones. */
export type CreateOrderRequestType = {
  items: CartItemType[];
  payment?: OrderPaymentType | null;
};

export type CategoryType = {
  id: number;
  name: string;
  /** Optional icon shown in the category tab (D-047). null or missing: the name only. */
  icon?: CatalogIconKey | null;
};

export type PostAPIResponseType = {
  id: number;
};

export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

export type PaginatedOrdersResponse = PaginatedResponse<OrderType>;

/** Currency of an instance. Amounts are always stored as integers in the smallest unit:
 * 1 token for TOKEN, 1 cent for EUR. */
export type CurrencyCode = 'TOKEN' | 'EUR';
