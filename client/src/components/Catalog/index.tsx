import React from 'react';
import { Stack, SimpleGrid, Paper, ScrollArea } from '@mantine/core';
import { useDispatch, useSelector } from 'react-redux';
import { add } from '../../redux/cartSlice';
import { useGetCategoriesQuery, useGetProductsByCategoryQuery } from '../../services/categories';
import CategoryList from './CategoryList';
import ProductList from './ProductList';
import { useGetProductsQuery } from '../../services/product';
import type { ProductType } from 'shared-ts';
import Loader from '../Loader';
import {
  resetSelectedCategory,
  selectSelectedCategory,
  setSelectedCategory,
} from '../../redux/selectedCategorySlice';
export const ALL_CATEGORIES_ID = 0;

const Catalog: React.FC = () => {
  const dispatch = useDispatch();
  const categoriesQuery = useGetCategoriesQuery();
  const productsQuery = useGetProductsQuery();
  const selectedCategory = useSelector(selectSelectedCategory);
  const hasSelectedCategory = selectedCategory !== null;
  const productsByCategoryQuery = useGetProductsByCategoryQuery(selectedCategory!, {
    skip: selectedCategory === null || selectedCategory === ALL_CATEGORIES_ID,
  });

  const handleSelectCategory = (categoryId: number) => {
    dispatch(setSelectedCategory(categoryId));
  };

  const handleGoBack = () => {
    dispatch(resetSelectedCategory());
  };

  const handleAddToCart = (product: ProductType) => {
    dispatch(add(product));
  };

  let productSource;
  if (selectedCategory === ALL_CATEGORIES_ID) {
    productSource = productsQuery;
  } else if (selectedCategory !== null) {
    productSource = productsByCategoryQuery;
  }

  return (
    <Paper radius={0} display="flex" flex={1}>
      <Stack flex={1} p="xl" gap="md" m={0}>
        <Loader
          isLoading={
            categoriesQuery.isLoading ||
            productsQuery.isFetching ||
            productsByCategoryQuery.isFetching
          }
        />
        {!hasSelectedCategory && (
          <ScrollArea flex={1}>
            <SimpleGrid cols={{ sm: 2, md: 4, lg: 6 }} spacing="md">
              <CategoryList
                categories={categoriesQuery.currentData}
                isError={categoriesQuery.isError}
                isLoading={categoriesQuery.isFetching}
                onSelectCategory={handleSelectCategory}
                allCategoriesId={ALL_CATEGORIES_ID}
              />
            </SimpleGrid>
          </ScrollArea>
        )}
        {productSource && (
          <ScrollArea flex={1}>
            <SimpleGrid cols={{ sm: 2, md: 4, lg: 6 }} spacing="md">
              <ProductList
                products={productSource.currentData}
                isError={productSource.isError}
                isLoading={productSource.isFetching}
                onAddToCart={handleAddToCart}
                onGoBack={handleGoBack}
              />
            </SimpleGrid>
          </ScrollArea>
        )}
      </Stack>
    </Paper>
  );
};

export default Catalog;
