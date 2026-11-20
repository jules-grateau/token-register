import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CartItemType, ProductType } from 'shared-ts';

export interface CartState {
  items: CartItemType[];
}

interface AddDiscountActionType {
  productId: number;
  discountedAmount: number;
}

interface UpdateQuantityActionType {
  productId: number;
  amount: number;
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
    updateQuantity(state, action: PayloadAction<UpdateQuantityActionType>) {
      const { productId, amount } = action.payload;
      const itemIndex = state.items.findIndex((item) => item.product.id === productId);

      if (itemIndex !== -1) {
        const itemToUpdate = state.items[itemIndex];
        const newQuantity = itemToUpdate.quantity + amount;
        if (newQuantity >= 0) {
          itemToUpdate.quantity = newQuantity;
        }
      }
    },
    clear(state) {
      state.items = [];
    },
    // D-019: "Annuler" after emptying the cart merges the previous cart back into the
    // current one: previous lines first, then the products added in the meantime.
    // D-024: a product present in both carts gets its quantities and its discount
    // amounts added (2 x Beer -1 + 1 x Beer -0.50 -> 3 x Beer -1.50).
    restore(state, action: PayloadAction<CartItemType[]>) {
      const current = state.items;
      const merged = action.payload.map((previous) => {
        const added = current.find((item) => item.product.id === previous.product.id);
        return added
          ? {
              ...previous,
              quantity: previous.quantity + added.quantity,
              discountedAmount: previous.discountedAmount + added.discountedAmount,
            }
          : { ...previous };
      });
      const addedOnly = current.filter(
        (item) => !action.payload.some((previous) => previous.product.id === item.product.id)
      );
      state.items = [...merged, ...addedOnly];
    },
  },
});

export const {
  add,
  remove,
  clear: clearCart,
  addDiscount,
  updateQuantity,
  restore: restoreCart,
} = cartSlice.actions;
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
