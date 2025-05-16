import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartItem, Product } from "shared-ts";

interface BasketState {
    items: CartItem[]
}

const initialState: BasketState = {
    items: []
};

const basketSlice = createSlice({
    name: "basket",
    initialState,
    reducers: {
        add(state, action: PayloadAction<Product>) {
            const existingItem = state.items.find(item => item.product.id === action.payload.id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                state.items.push({ product: action.payload, quantity: 1 });
            }
        },
        remove(state, action: PayloadAction<number>) {
            state.items.splice(action.payload, 1);
        }
    }
});

export const { add, remove } = basketSlice.actions;
export const basketReducer = basketSlice.reducer;

export const selectBasketItems = (state: { basket: BasketState }) => state.basket.items;
export const selectTotalPrice = (state: { basket: BasketState }) => {
    return state.basket.items.reduce((total, item) => total + item.product.price * item.quantity, 0);
}