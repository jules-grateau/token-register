export type ProductType = {
  id: number;   // Product ID
  name: string; // Product name
  price: number; // Product price (in tokens)
}

export type CartItemType = {
  product: ProductType; // Product details
  quantity: number; // Quantity of the product in the cart
}

export type OrderType = {
  id: number; // Order ID
  date: number; // Order date
  items: CartItemType[]; // List of items in the order
}

export type CategoryType = {
  id: number;
  name: string;
}

export type PostAPIResponseType = {
  id: number;
}