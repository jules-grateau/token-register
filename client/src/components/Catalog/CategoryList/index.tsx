import React from 'react';
import type { CategoryType } from 'shared-ts';
import ClickableCard from '../../ClickableCard';

interface CategoryListProps {
  isLoading: boolean;
  isError: boolean;
  categories: CategoryType[] | undefined;
  allCategoriesId?: number;
  onSelectCategory: (categoryId: number) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({ isLoading, isError, categories, allCategoriesId, onSelectCategory }) => {
  if (isLoading) return <p>Loading categories...</p>;
  if (isError) return <p>Error loading categories.</p>;
  if (!categories || categories.length === 0) return <p>No categories available.</p>;

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
        title="All Categories"
        onClick={() => onSelectCategory(allCategoriesId)}
      />}
    </>
  );
};

export default CategoryList;