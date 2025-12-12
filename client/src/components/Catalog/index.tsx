import React, { useEffect } from 'react';
import { SimpleGrid, Paper, ScrollArea, Group, Tabs, Text } from '@mantine/core';
import { useDispatch, useSelector } from 'react-redux';
import { add } from '../../redux/cartSlice';
import { useGetCategoriesQuery, useGetProductsByCategoryQuery } from '../../services/categories';
import ProductList from './ProductList';
import { useGetProductsQuery } from '../../services/product';
import type { ProductType } from 'shared-ts';
import Loader from '../Loader';
import { selectSelectedCategory, setSelectedCategory } from '../../redux/selectedCategorySlice';
import { useTranslation } from 'react-i18next';
export const ALL_CATEGORIES_ID = 0;

const Catalog: React.FC = () => {
  const dispatch = useDispatch();
  const categoriesQuery = useGetCategoriesQuery();
  const productsQuery = useGetProductsQuery();
  const selectedCategory = useSelector(selectSelectedCategory);
  const { t } = useTranslation();

  const productsByCategoryQuery = useGetProductsByCategoryQuery(selectedCategory!, {
    skip: selectedCategory === null || selectedCategory === ALL_CATEGORIES_ID,
  });

  useEffect(() => {
    if (selectedCategory === null) {
      dispatch(setSelectedCategory(ALL_CATEGORIES_ID));
    }
  }, [dispatch, selectedCategory]);

  const handleAddToCart = (product: ProductType) => {
    dispatch(add(product));
  };

  let productSource;
  if (selectedCategory === ALL_CATEGORIES_ID) {
    productSource = productsQuery;
  } else if (selectedCategory !== null) {
    productSource = productsByCategoryQuery;
  }

  const categoryData = [
    { label: t('all_categories'), value: String(ALL_CATEGORIES_ID) },
    ...(categoriesQuery.currentData?.map((category) => ({
      label: category.name,
      value: String(category.id),
    })) || []),
  ];

  const categoryContent = () => {
    if (categoriesQuery.isLoading) return <p>{t('loading_categories')}</p>;
    if (categoriesQuery.isError) return <p>{t('error_loading_categories')}</p>;
    if (!categoryData || categoryData.length === 0) return <p>{t('no_categories')}</p>;

    return categoryData.map((category) => (
      <Tabs.Tab key={category.value} value={category.value} w="100%" p="xl">
        <Text fw={700}>{category.label}</Text>
      </Tabs.Tab>
    ));
  };

  return (
    <Paper radius={0} display="flex" flex={1}>
      <Group flex={1} p={0} gap="md" m={0}>
        <Tabs
          orientation="vertical"
          value={String(selectedCategory)}
          onChange={(value) => value && dispatch(setSelectedCategory(Number(value)))}
          display="flex"
          flex={1}
          h="100%"
        >
          <Tabs.List>
            <ScrollArea h="100%">
              <Loader isLoading={categoriesQuery.isFetching} />
              {categoryContent()}
            </ScrollArea>
          </Tabs.List>

          {productSource && (
            <Tabs.Panel
              value={String(selectedCategory)}
              style={{ flex: 9 }}
              display="flex"
              flex={1}
            >
              <ScrollArea flex={1} p="xl" h="100%">
                <Loader isLoading={productSource.isFetching} />
                <SimpleGrid cols={{ xs: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                  <ProductList
                    products={productSource.currentData}
                    isError={productSource.isError}
                    onAddToCart={handleAddToCart}
                    isLoading={productSource.isFetching}
                  />
                </SimpleGrid>
              </ScrollArea>
            </Tabs.Panel>
          )}
        </Tabs>
      </Group>
    </Paper>
  );
};

export default Catalog;
