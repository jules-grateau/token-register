import React from 'react';

import styles from './Catalog.module.css';
import { useDispatch } from 'react-redux';
import { add } from '../../redux/cartSlice';
import { useGetCategoriesQuery, useGetProductsByCategoryQuery } from '../../services/categories';
import Button from '../Button';
import CategoryList from './CategoryList';
import ProductList from './ProductList';
import { useGetProductsQuery } from '../../services/product';
import type { ProductType } from 'shared-ts';
import { useTranslation } from 'react-i18next';

export const ALL_CATEGORIES_ID = 0;

const Catalog : React.FC = () => {
    const dispatch = useDispatch();
    const [selectedCategory, setSelectedCategory] = React.useState<number | null>(null);
    const categoriesQuery = useGetCategoriesQuery();
    const productsQuery = useGetProductsQuery()
    const hasSelectedCategory = selectedCategory !== null;
    const productsByCategoryQuery = useGetProductsByCategoryQuery(
        selectedCategory!,
        { skip: selectedCategory === null || selectedCategory === ALL_CATEGORIES_ID }
    );
    const { t } = useTranslation();
    const selectedCategoryName = selectedCategory != ALL_CATEGORIES_ID
      ? categoriesQuery.data?.find(category => category.id === selectedCategory)?.name
      : t('all_categories');

    const handleSelectCategory = (categoryId: number) => {
        setSelectedCategory(categoryId);
    };

    const handleGoBack = () => {
        setSelectedCategory(null);
    };

    const handleAddToCart = (product: ProductType) => {
        dispatch(add(product));
    }

    let productSource;
    if (selectedCategory === ALL_CATEGORIES_ID) {
        productSource = productsQuery;
    } else if (selectedCategory !== null) { //
        productSource = productsByCategoryQuery;
    }

  return (
    <div className={styles.catalogContainer}>
        <div className={styles.header}>
            <h2 className={styles.title}>{hasSelectedCategory ?  selectedCategoryName : t('categories')}</h2>
            {hasSelectedCategory && (
                <Button
                    onClick={handleGoBack}
                    color='primary'>
                    {t('go_back')}
                </Button>
            )}
        </div>
        <div className={styles.catalogBody}>
            {!hasSelectedCategory && (
                <div className={styles.cardList}>
                    <CategoryList 
                        categories={categoriesQuery.data} 
                        isError={categoriesQuery.isError} 
                        isLoading={categoriesQuery.isLoading}
                        onSelectCategory={handleSelectCategory}
                        allCategoriesId={ALL_CATEGORIES_ID}
                    />
                </div>
            )}
            {productSource && (
                <div className={styles.cardList}>
                    <ProductList
                        products={productSource.data}
                        isError={productSource.isError}
                        isLoading={productSource.isLoading}
                        onAddToCart={handleAddToCart}
                    />
                </div>
            )}  
        </div>
    </div>
  );
}

export default Catalog;