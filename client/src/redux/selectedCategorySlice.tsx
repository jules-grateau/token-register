import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const selectedCategorySlice = createSlice({
  name: 'selectedCategory',
  initialState: null as number | null,
  reducers: {
    setSelectedCategory: (_state, action: PayloadAction<number | null>) => action.payload,
    resetSelectedCategory: () => null,
  },
});

export const { setSelectedCategory, resetSelectedCategory } = selectedCategorySlice.actions;
export const selectedCategoryReducer = selectedCategorySlice.reducer;

export const selectSelectedCategory = (state: { selectedCategory: number | null }) =>
  state.selectedCategory;
