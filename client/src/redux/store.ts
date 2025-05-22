import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { productsApi } from '../services/product'
import { add, addDiscount, cartReducer, clear, remove, type CartState } from './cartSlice'
import { ordersApi } from '../services/orders'
import { categoriesApi } from '../services/categories'
import { loadCartFromLocalStorage, saveCartToLocalStorage } from '../utils/localStorageCart'

const listenerMiddleware = createListenerMiddleware<RootState>();

listenerMiddleware.startListening({
  matcher: isAnyOf(add, remove, clear, addDiscount),
  effect: (_action, store) => {
    const newCartState = store.getState().cart;
    saveCartToLocalStorage(newCartState);
  }
})

const preloadedCart = loadCartFromLocalStorage();
const preloadedState : Partial<RootState> = {
  cart: preloadedCart
};

export const store = configureStore({
  reducer: {
    [productsApi.reducerPath]: productsApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [categoriesApi.reducerPath]: categoriesApi.reducer,
    'cart': cartReducer,
  },
  preloadedState: preloadedState as RootState,
  middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(productsApi.middleware)
        .concat(ordersApi.middleware).concat(categoriesApi.middleware)
        .concat(listenerMiddleware.middleware),
    
})

export interface RootState {
  [productsApi.reducerPath]: ReturnType<typeof productsApi.reducer>;
  [ordersApi.reducerPath]: ReturnType<typeof ordersApi.reducer>;
  [categoriesApi.reducerPath]: ReturnType<typeof categoriesApi.reducer>;
  cart: CartState;
}
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState
export type AppDispatch = typeof store.dispatch