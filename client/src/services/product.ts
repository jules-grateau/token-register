import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Product } from 'shared-ts';

const API_URL = 'http://localhost:3001/products';

export const productApi = createApi({
  reducerPath: 'productApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints : (builder) => ({
    getProducts: builder.query<Product[], void>({
      query: () => '/',
      transformResponse: (response: Product[]) => response,
    }),
  }),
})

export const { useGetProductsQuery } = productApi;