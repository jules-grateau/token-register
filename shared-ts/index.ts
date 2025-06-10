export type ProductType = {
  id: number;
  name: string;
  price: number;
  categoryId: number;
};

export type CartItemType = {
  product: ProductType;
  quantity: number;
  discountedAmount: number;
};

export type OrderType = {
  id: number;
  date: number;
  items: CartItemType[];
};

export type CategoryType = {
  id: number;
  name: string;
};

export type PostAPIResponseType = {
  id: number;
};
