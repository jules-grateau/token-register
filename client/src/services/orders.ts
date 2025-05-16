import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { CartItem, Order } from 'shared-ts';
import { remove } from '../redux/cartSlice';

const API_URL = 'http://localhost:3001/orders';

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL,  
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    }}),
  endpoints: (build) => ({
    addOrder: build.mutation<void,CartItem[]>({
      query: (cart : CartItem[]) => ({
        url: '',
        method: 'POST',
        body: cart,

      }),
    }),
    removeOrder: build.mutation<void, number>({
      query: (id) => ({
        url: `${API_URL}/${id}`,
        method: 'DELETE',
      }),
    }),
    getOrders: build.query<Order[], void>({
      query: () => ({
        url: '',
        method: 'GET',
        
      }),
    })
  }),
})

export const { useAddOrderMutation, useGetOrdersQuery, useRemoveOrderMutation } = ordersApi;