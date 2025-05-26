import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CartItemType, ProductType } from 'shared-ts';

export interface CartState {
  items: CartItemType[];
}

interface AddDiscountActionType {
  productId: number;
  discountedAmount: number;
}

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    add(state, action: PayloadAction<ProductType>) {
      const existingItem = state.items.find((item) => item.product.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ product: action.payload, quantity: 1, discountedAmount: 0 });
      }
    },
    addDiscount(state, action: PayloadAction<AddDiscountActionType>) {
      const existingItem = state.items.find((item) => item.product.id === action.payload.productId);
      if (existingItem) {
        existingItem.discountedAmount = action.payload.discountedAmount;
      }
    },
    remove(state, action: PayloadAction<number>) {
      state.items.splice(action.payload, 1);
    },
    clear(state) {
      state.items = [];
    },
  },
});

export const { add, remove, clear, addDiscount } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;

export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectTotalPrice = (state: { cart: CartState }) => {
  return state.cart.items.reduce(
    (total, item) => total + (item.product.price * item.quantity - item.discountedAmount),
    0
  );
};
export const selectTotalItems = (state: { cart: CartState }) => {
  return state.cart.items.reduce((total, item) => total + item.quantity, 0);
};
