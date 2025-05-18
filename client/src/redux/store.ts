import { configureStore } from '@reduxjs/toolkit'
import { productsApi } from '../services/product'
import { cartReducer } from './cartSlice'
import { ordersApi } from '../services/orders'

export const store = configureStore({
  reducer: {
    [productsApi.reducerPath]: productsApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    'cart': cartReducer,
  },
  
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(productsApi.middleware).concat(ordersApi.middleware),
    
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState
export type AppDispatch = typeof store.dispatch