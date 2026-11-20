import { useEffect, useRef, useState } from 'react';
import {
  SimpleGrid,
  Paper,
  ScrollArea,
  Group,
  Tabs,
  Text,
  ActionIcon,
  Stack,
  Box,
  Button,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
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
import { useLayoutMode, type LayoutMode } from '../../hooks/useLayoutMode';

export const ALL_CATEGORIES_ID = 0;

const BORDER = '1px solid var(--mantine-color-default-border)';
const MEDIA_OPTIONS = { getInitialValueInEffect: false };
// docs/design/spacing-layout.md: tablets narrower than 768 px use the row of tabs too.
export const NARROW_TABLET_QUERY = '(max-width: 767.98px)';
export const WIDE_PHONE_LANDSCAPE_QUERY = '(min-width: 920px)';

interface CategoryTab {
  label: string;
  value: string;
  id: number;
  categoryData?: CategoryType;
}

function gridProps(mode: LayoutMode, isWideLandscape: boolean, isEditMode: boolean) {
  switch (mode) {
    case 'phone-portrait':
      return { cols: 2, spacing: 'sm', p: 'sm' };
    case 'phone-landscape':
      // Edit mode: no cart, the catalog takes the full width.
      return { cols: isWideLandscape || isEditMode ? 4 : 3, spacing: 'xs', p: 'xs' };
    case 'tablet':
      return { cols: 2, spacing: 'sm', p: 'sm' };
    default:
      return { cols: { xs: 1, sm: 2, md: 3, lg: 4 }, spacing: 'md', p: 'xl' };
  }
}

function Catalog(): React.ReactElement {
  const dispatch = useDispatch();
  const categoriesQuery = useGetCategoriesQuery();
  const productsQuery = useGetProductsQuery();
  const selectedCategory = useSelector(selectSelectedCategory);
  const isEditMode = useSelector(selectIsEditMode);
  const { t } = useTranslation();
  const mode = useLayoutMode();
  const isNarrowTablet = useMediaQuery(NARROW_TABLET_QUERY, false, MEDIA_OPTIONS);
  const isWideLandscape = useMediaQuery(WIDE_PHONE_LANDSCAPE_QUERY, false, MEDIA_OPTIONS);
  const isRow =
    mode === 'phone-portrait' ||
    mode === 'phone-landscape' ||
    (mode === 'tablet' && isNarrowTablet);
  const tabListRef = useRef<HTMLDivElement>(null);

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

  // Row of tabs: bring the selected tab into view.
  useEffect(() => {
    if (!isRow) return;
    tabListRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [isRow, selectedCategory]);

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
  const selectedCategoryData = categoryTabs.find(
    (category) => category.id === selectedCategory
  )?.categoryData;

  const categoryStatus = (): React.ReactNode => {
    if (categoriesQuery.isLoading) {
      return <p>{t('loading_categories')}</p>;
    }
    if (categoriesQuery.isError) {
      return <p>{t('error_loading_categories')}</p>;
    }
    if (categoryTabs.length === 0) {
      return <p>{t('no_categories')}</p>;
    }
    return null;
  };

  // Column of categories (tablet >= 768 px, desktop).
  const renderColumnTabs = (): React.ReactNode =>
    categoryStatus() ?? (
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
                {/* A category name is never cut: it wraps. */}
                <Text
                  size={mode === 'tablet' ? 'md' : 'lg'}
                  fw={700}
                  flex={1}
                  miw={0}
                  px={canEdit && mode === 'tablet' ? 'xs' : 'md'}
                  py="md"
                  c="white"
                  style={{ alignContent: 'center', overflowWrap: 'anywhere' }}
                >
                  {category.label}
                </Text>
                {canEdit && (
                  <Group gap={0} wrap="nowrap" align="stretch" onClick={(e) => e.stopPropagation()}>
                    <ActionIcon
                      variant="subtle"
                      radius={0}
                      h="auto"
                      w={44}
                      style={{ flex: 'none' }}
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
                      w={44}
                      style={{ flex: 'none' }}
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

  // Row of "pill" tabs (phones, tablets < 768 px).
  const renderRowTabs = (): React.ReactNode => {
    const status = categoryStatus();
    const showLandscapeActions =
      isEditMode && mode === 'phone-landscape' && selectedCategoryData !== undefined;

    return (
      <Group gap={0} wrap="nowrap" style={{ flex: 'none', borderBottom: BORDER }}>
        <Box pos="relative" style={{ flex: 1, minWidth: 0 }}>
          <ScrollArea scrollbars="x" type="never">
            <Group
              ref={tabListRef}
              gap="xs"
              wrap="nowrap"
              px="sm"
              py={mode === 'phone-landscape' ? 4 : 8}
            >
              <Loader isLoading={categoriesQuery.isFetching} />
              {status ?? (
                <>
                  <Tabs.List style={{ flexWrap: 'nowrap', gap: 'var(--mantine-spacing-xs)' }}>
                    {categoryTabs.map((category) => (
                      <Tabs.Tab
                        key={category.value}
                        value={category.value}
                        h={44}
                        px="md"
                        fz="md"
                        fw={700}
                        style={{ whiteSpace: 'nowrap', flex: 'none' }}
                      >
                        {category.label}
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                  {isEditMode && (
                    <Button
                      variant="default"
                      radius="xl"
                      h={44}
                      fz="md"
                      leftSection={<IconPlus size={20} />}
                      onClick={() => setIsCategoryFormOpen(true)}
                      styles={{ root: { borderStyle: 'dashed', flex: 'none' } }}
                    >
                      {t('category_management.new')}
                    </Button>
                  )}
                </>
              )}
            </Group>
          </ScrollArea>
          {/* Fade on the right edge: the row scrolls horizontally. */}
          <Box
            aria-hidden
            pos="absolute"
            top={0}
            right={0}
            bottom={0}
            w={24}
            style={{
              pointerEvents: 'none',
              background: 'linear-gradient(to right, transparent, var(--mantine-color-body))',
            }}
          />
        </Box>
        {showLandscapeActions && (
          <Group gap={0} wrap="nowrap" style={{ flex: 'none', borderLeft: BORDER }}>
            <ActionIcon
              variant="subtle"
              size={44}
              onClick={() => handleEditCategory(selectedCategoryData)}
              aria-label={t('category_management.edit')}
            >
              <IconEdit size={22} color="var(--mantine-primary-color-filled)" />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size={44}
              onClick={() => setDeletingCategory(selectedCategoryData)}
              aria-label={t('category_management.delete')}
            >
              <IconTrash size={22} color="var(--mantine-color-red-6)" />
            </ActionIcon>
          </Group>
        )}
      </Group>
    );
  };

  // Edit mode, phone portrait and narrow tablets: toolbar for the selected category.
  const showCategoryToolbar =
    isRow && isEditMode && mode !== 'phone-landscape' && selectedCategoryData !== undefined;

  const grid = gridProps(mode, isWideLandscape, isEditMode);

  return (
    <>
      <Paper radius={0} display="flex" flex={1} style={{ minWidth: 0, minHeight: 0 }}>
        <Tabs
          orientation={isRow ? 'horizontal' : 'vertical'}
          variant={isRow ? 'pills' : 'default'}
          radius={isRow ? 'xl' : undefined}
          autoContrast
          // Column: names wrap instead of widening the 200 px column (never truncated).
          styles={isRow ? undefined : { tab: { whiteSpace: 'normal' }, tabLabel: { minWidth: 0 } }}
          value={String(selectedCategory)}
          onChange={(value) => value && dispatch(setSelectedCategory(Number(value)))}
          display="flex"
          flex={1}
          h="100%"
          style={{ flexDirection: isRow ? 'column' : 'row', minWidth: 0 }}
        >
          {isRow ? (
            renderRowTabs()
          ) : (
            <Tabs.List
              style={
                mode === 'tablet'
                  ? { width: 200, flex: 'none' }
                  : { flex: isEditMode ? 2 : 1, minWidth: 200 }
              }
            >
              <ScrollArea h="100%">
                <Loader isLoading={categoriesQuery.isFetching} />
                <Stack gap="xs">{renderColumnTabs()}</Stack>
              </ScrollArea>
            </Tabs.List>
          )}

          {showCategoryToolbar && (
            <Group
              justify="space-between"
              wrap="nowrap"
              px="sm"
              mih={52}
              gap="xs"
              style={{ flex: 'none', borderBottom: BORDER }}
              data-testid="category-toolbar"
            >
              <Text size="md" fw={700} miw={0} style={{ overflowWrap: 'anywhere' }}>
                {selectedCategoryData.name}
              </Text>
              <Group gap="xs" wrap="nowrap" style={{ flex: 'none' }}>
                <Button
                  variant="light"
                  h={44}
                  leftSection={<IconEdit size={20} color="var(--mantine-primary-color-filled)" />}
                  onClick={() => handleEditCategory(selectedCategoryData)}
                >
                  {t('actions.edit')}
                </Button>
                <Button
                  variant="light"
                  color="red"
                  h={44}
                  leftSection={<IconTrash size={20} />}
                  onClick={() => setDeletingCategory(selectedCategoryData)}
                >
                  {t('delete')}
                </Button>
              </Group>
            </Group>
          )}

          {productSource && (
            <Tabs.Panel
              value={String(selectedCategory)}
              display="flex"
              style={{ flex: isRow ? 1 : 8, minHeight: 0, minWidth: 0 }}
            >
              <ScrollArea flex={1} p={grid.p} h="100%">
                <Loader isLoading={productSource.isFetching} />
                <SimpleGrid cols={grid.cols} spacing={grid.spacing}>
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
