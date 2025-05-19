import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ProductType } from 'shared-ts';

const API_URL = import.meta.env.VITE_BASE_API_URL + '/products';

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL, credentials: 'include' }),
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