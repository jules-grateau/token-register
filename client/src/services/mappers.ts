import type { ProductType } from 'shared-ts';

export type ApiProductType = Omit<ProductType, 'categoryId'> & { category_id: number };

export const mapProduct = (product: ApiProductType): ProductType => ({
  id: product.id,
  name: product.name,
  price: product.price,
  categoryId: product.category_id,
});
