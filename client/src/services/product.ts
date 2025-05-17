import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ProductType } from 'shared-ts';

const API_URL = 'http://localhost:3001/products';

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints : (build) => ({
    getProducts: build.query<ProductType[], void>({
      query: () => ({
        url: '',
        method: 'GET',
      }),
      transformResponse: (response: ProductType[]) => response,
    }),
  }),
})

export const { useGetProductsQuery } = productsApi;