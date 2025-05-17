import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartItemType, ProductType } from "shared-ts";

interface CartState {
    items: CartItemType[]
}

const initialState: CartState = {
    items: []
};

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        add(state, action: PayloadAction<ProductType>) {
            const existingItem = state.items.find(item => item.product.id === action.payload.id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                state.items.push({ product: action.payload, quantity: 1 });
            }
        },
        remove(state, action: PayloadAction<number>) {
            state.items.splice(action.payload, 1);
        },
        clear(state) {
            state.items = [];
        }
    }
});

export const { add, remove, clear } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;

export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectTotalPrice = (state: { cart: CartState }) => {
    return state.cart.items.reduce((total, item) => total + item.product.price * item.quantity, 0);
}
export const selectTotalItems = (state: { cart: CartState }) => {
    return state.cart.items.reduce((total, item) => total + item.quantity, 0);
}