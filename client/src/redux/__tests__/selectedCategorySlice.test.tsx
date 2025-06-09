import { selectSelectedCategory } from '../selectedCategorySlice';

describe('selectSelectedCategory', () => {
  it('returns the selected category when set', () => {
    const state = { selectedCategory: 5 };
    expect(selectSelectedCategory(state)).toBe(5);
  });

  it('returns null when no category is selected', () => {
    const state = { selectedCategory: null };
    expect(selectSelectedCategory(state)).toBeNull();
  });
});
