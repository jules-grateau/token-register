import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { productsApi } from '../services/product';
import { cartReducer, type CartState } from './cartSlice';
import { ordersApi } from '../services/orders';
import { categoriesApi } from '../services/categories';
import { cashDaysApi } from '../services/cashDays';
import { usersApi } from '../services/users';
import { loadCartFromLocalStorage } from '../utils/localStorageCart';
import { selectedCategoryReducer } from './selectedCategorySlice';
import { editModeReducer } from './editModeSlice';
import { authReducer, type AuthState } from './authSlice';
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
    [cashDaysApi.reducerPath]: cashDaysApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    cart: cartReducer,
    selectedCategory: selectedCategoryReducer,
    editMode: editModeReducer,
    auth: authReducer,
  },
  preloadedState: preloadedState as RootState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(productsApi.middleware)
      .concat(ordersApi.middleware)
      .concat(categoriesApi.middleware)
      .concat(cashDaysApi.middleware)
      .concat(usersApi.middleware)
      .concat(listenerMiddleware.middleware),
});

// D-061: queries that opt in (the open cash day) refresh when the tab comes back.
setupListeners(store.dispatch);

export interface RootState {
  [productsApi.reducerPath]: ReturnType<typeof productsApi.reducer>;
  [ordersApi.reducerPath]: ReturnType<typeof ordersApi.reducer>;
  [categoriesApi.reducerPath]: ReturnType<typeof categoriesApi.reducer>;
  [cashDaysApi.reducerPath]: ReturnType<typeof cashDaysApi.reducer>;
  [usersApi.reducerPath]: ReturnType<typeof usersApi.reducer>;
  cart: CartState;
  editMode: { isEditMode: boolean };
  auth: AuthState;
}
export type AppDispatch = typeof store.dispatch;
