export type Product = {
  id: number;   // Product ID
  name: string; // Product name
  price: number; // Product price (in tokens)
}

export type CartItem = {
  product: Product; // Product details
  quantity: number; // Quantity of the product in the cart
}

export type Order = {
  id: number; // Order ID
  date: number; // Order date
  items: CartItem[]; // List of items in the order
}