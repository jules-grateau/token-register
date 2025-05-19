import React from 'react';
import type { CategoryType } from 'shared-ts';
import ClickableCard from '../../ClickableCard';
import { useTranslation } from 'react-i18next';

interface CategoryListProps {
  isLoading: boolean;
  isError: boolean;
  categories: CategoryType[] | undefined;
  allCategoriesId?: number;
  onSelectCategory: (categoryId: number) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({ isLoading, isError, categories, allCategoriesId, onSelectCategory }) => {
  const { t } = useTranslation();

  if (isLoading) return <p>{t('loading_categories')}</p>;
  if (isError) return <p>{t('error_loading_categories')}</p>;
  if (!categories || categories.length === 0) return <p>{t('no_categories')}</p>;

  return (
    <>
      {categories.map(category => (
        <ClickableCard
          key={category.id}
          title={category.name}
          onClick={() => onSelectCategory(category.id)}
        />
      ))}
      {allCategoriesId !== undefined && 
      <ClickableCard
        key='0'
        title={t('all_categories')}
        onClick={() => onSelectCategory(allCategoriesId)}
      />}
    </>
  );
};

export default CategoryList;