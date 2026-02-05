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

export type OrderItemType = {
  productId: number | null;
  productName: string;
  productPrice: number;
  categoryName: string;
  quantity: number;
  discountedAmount: number;
};

export type OrderType = {
  id: number;
  date: number;
  items: OrderItemType[];
};

export type CategoryType = {
  id: number;
  name: string;
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
