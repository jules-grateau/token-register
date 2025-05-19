import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { CartItemType, OrderType } from 'shared-ts';

const API_URL = import.meta.env.VITE_BASE_API_URL + '/orders';

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL,  
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    }}),
  endpoints: (build) => ({
    addOrder: build.mutation<void,CartItemType[]>({
      query: (cart : CartItemType[]) => ({
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
    getOrders: build.query<OrderType[], void>({
      query: () => ({
        url: '',
        method: 'GET',
        
      }),
    })
  }),
})

export const { useAddOrderMutation, useGetOrdersQuery, useRemoveOrderMutation } = ordersApi;