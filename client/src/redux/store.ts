import { configureStore } from '@reduxjs/toolkit';
import { productsApi } from '../services/product';
import { cartReducer, type CartState } from './cartSlice';
import { ordersApi } from '../services/orders';
import { categoriesApi } from '../services/categories';
import { loadCartFromLocalStorage } from '../utils/localStorageCart';
import { selectedCategoryReducer } from './selectedCategorySlice';
import { editModeReducer } from './editModeSlice';
import listenerMiddleware from './listeners';

const preloadedCart = loadCartFromLocalStorage();
const preloadedState: Partial<RootState> = {
  cart: preloadedCart,
};

export const store = configureStore({
  reducer: {
    [productsApi.reducerPath]: productsApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [categoriesApi.reducerPath]: categoriesApi.reducer,
    cart: cartReducer,
    selectedCategory: selectedCategoryReducer,
    editMode: editModeReducer,
  },
  preloadedState: preloadedState as RootState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(productsApi.middleware)
      .concat(ordersApi.middleware)
      .concat(categoriesApi.middleware)
      .concat(listenerMiddleware.middleware),
});

export interface RootState {
  [productsApi.reducerPath]: ReturnType<typeof productsApi.reducer>;
  [ordersApi.reducerPath]: ReturnType<typeof ordersApi.reducer>;
  [categoriesApi.reducerPath]: ReturnType<typeof categoriesApi.reducer>;
  cart: CartState;
  editMode: { isEditMode: boolean };
}
export type AppDispatch = typeof store.dispatch;
