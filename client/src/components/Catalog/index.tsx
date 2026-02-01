import { useEffect, useState } from 'react';
import { SimpleGrid, Paper, ScrollArea, Group, Tabs, Text, ActionIcon, Stack } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useDispatch, useSelector } from 'react-redux';
import { add } from '../../redux/cartSlice';
import { useGetCategoriesQuery, useGetProductsByCategoryQuery } from '../../services/categories';
import ProductList from './ProductList';
import { useGetProductsQuery } from '../../services/product';
import type { ProductType, CategoryType } from 'shared-ts';
import Loader from '../Loader';
import { selectSelectedCategory, setSelectedCategory } from '../../redux/selectedCategorySlice';
import { selectIsEditMode } from '../../redux/editModeSlice';
import { useTranslation } from 'react-i18next';
import NewProductCard from '../ProductManagement/NewProductCard';
import ProductFormModal from '../ProductManagement/ProductFormModal';
import ProductDeleteConfirm from '../ProductManagement/ProductDeleteConfirm';
import NewCategoryButton from '../CategoryManagement/NewCategoryButton';
import CategoryFormModal from '../CategoryManagement/CategoryFormModal';
import CategoryDeleteConfirm from '../CategoryManagement/CategoryDeleteConfirm';

export const ALL_CATEGORIES_ID = 0;

interface CategoryTab {
  label: string;
  value: string;
  id: number;
  categoryData?: CategoryType;
}

function Catalog(): React.ReactElement {
  const dispatch = useDispatch();
  const categoriesQuery = useGetCategoriesQuery();
  const productsQuery = useGetProductsQuery();
  const selectedCategory = useSelector(selectSelectedCategory);
  const isEditMode = useSelector(selectIsEditMode);
  const { t } = useTranslation();

  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductType | null>(null);

  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryType | null>(null);

  const productsByCategoryQuery = useGetProductsByCategoryQuery(selectedCategory!, {
    skip: selectedCategory === null || selectedCategory === ALL_CATEGORIES_ID,
  });

  useEffect(() => {
    if (selectedCategory === null) {
      dispatch(setSelectedCategory(ALL_CATEGORIES_ID));
    }
  }, [dispatch, selectedCategory]);

  const handleAddToCart = (product: ProductType) => {
    if (!isEditMode) {
      dispatch(add(product));
    }
  };

  const handleEditProduct = (product: ProductType) => {
    setEditingProduct(product);
    setIsProductFormOpen(true);
  };

  const handleCloseProductForm = () => {
    setIsProductFormOpen(false);
    setEditingProduct(null);
  };

  const handleEditCategory = (category: CategoryType) => {
    setEditingCategory(category);
    setIsCategoryFormOpen(true);
  };

  const handleCloseCategoryForm = () => {
    setIsCategoryFormOpen(false);
    setEditingCategory(null);
  };

  const productSource =
    selectedCategory === ALL_CATEGORIES_ID
      ? productsQuery
      : selectedCategory !== null
        ? productsByCategoryQuery
        : undefined;

  const categoryTabs: CategoryTab[] = [
    { label: t('all_categories'), value: String(ALL_CATEGORIES_ID), id: ALL_CATEGORIES_ID },
    ...(categoriesQuery.currentData?.map((category) => ({
      label: category.name,
      value: String(category.id),
      id: category.id,
      categoryData: category,
    })) || []),
  ];

  const renderCategoryContent = (): React.ReactNode => {
    if (categoriesQuery.isLoading) {
      return <p>{t('loading_categories')}</p>;
    }
    if (categoriesQuery.isError) {
      return <p>{t('error_loading_categories')}</p>;
    }
    if (categoryTabs.length === 0) {
      return <p>{t('no_categories')}</p>;
    }

    return (
      <>
        {categoryTabs.map((category) => {
          const isSelected = String(selectedCategory) === category.value;
          const { categoryData } = category;
          const canEdit = isEditMode && category.id !== ALL_CATEGORIES_ID && categoryData;

          return (
            <Tabs.Tab key={category.value} value={category.value} w="100%" p={0}>
              <Group
                justify="space-between"
                wrap="nowrap"
                gap={0}
                align="stretch"
                style={{
                  minHeight: '80px',
                  background: isSelected ? 'var(--mantine-color-dark-5)' : 'transparent',
                }}
              >
                <Text
                  size="lg"
                  fw={700}
                  truncate
                  flex={1}
                  px="md"
                  py="md"
                  c="white"
                  style={{ alignContent: 'center' }}
                >
                  {category.label}
                </Text>
                {canEdit && (
                  <Group
                    gap={0}
                    wrap="nowrap"
                    align="stretch"
                    onClick={(e) => e.stopPropagation()}
                    w="50%"
                  >
                    <ActionIcon
                      variant="subtle"
                      radius={0}
                      h="auto"
                      flex={1}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCategory(categoryData);
                      }}
                      aria-label={t('actions.edit')}
                    >
                      <IconEdit size={24} color="var(--mantine-primary-color-filled)" />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      radius={0}
                      h="auto"
                      flex={1}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingCategory(categoryData);
                      }}
                      aria-label={t('delete')}
                    >
                      <IconTrash size={24} color="var(--mantine-color-red-6)" />
                    </ActionIcon>
                  </Group>
                )}
              </Group>
            </Tabs.Tab>
          );
        })}
        {isEditMode && <NewCategoryButton onClick={() => setIsCategoryFormOpen(true)} />}
      </>
    );
  };

  return (
    <>
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
            <Tabs.List style={{ flex: isEditMode ? 2 : 1 }}>
              <ScrollArea h="100%">
                <Loader isLoading={categoriesQuery.isFetching} />
                <Stack gap="xs">{renderCategoryContent()}</Stack>
              </ScrollArea>
            </Tabs.List>

            {productSource && (
              <Tabs.Panel value={String(selectedCategory)} style={{ flex: 8 }} display="flex">
                <ScrollArea flex={1} p="xl" h="100%">
                  <Loader isLoading={productSource.isFetching} />
                  <SimpleGrid cols={{ xs: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                    {isEditMode && <NewProductCard onClick={() => setIsProductFormOpen(true)} />}
                    <ProductList
                      products={productSource.currentData}
                      isError={productSource.isError}
                      onAddToCart={handleAddToCart}
                      isLoading={productSource.isFetching}
                      isEditMode={isEditMode}
                      onEditProduct={handleEditProduct}
                      onDeleteProduct={setDeletingProduct}
                    />
                  </SimpleGrid>
                </ScrollArea>
              </Tabs.Panel>
            )}
          </Tabs>
        </Group>
      </Paper>

      <ProductFormModal
        isOpen={isProductFormOpen}
        onClose={handleCloseProductForm}
        product={editingProduct}
        defaultCategoryId={selectedCategory !== ALL_CATEGORIES_ID ? selectedCategory : null}
      />

      <ProductDeleteConfirm
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        product={deletingProduct}
      />

      <CategoryFormModal
        isOpen={isCategoryFormOpen}
        onClose={handleCloseCategoryForm}
        category={editingCategory}
      />

      <CategoryDeleteConfirm
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        category={deletingCategory}
      />
    </>
  );
}

export default Catalog;
