import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { CategoryType, ProductType } from 'shared-ts';

const API_URL = import.meta.env.VITE_BASE_API_URL + '/categories';

export const categoriesApi = createApi({
  reducerPath: 'categoriesApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL, credentials: 'include' }),
  endpoints : (build) => ({
    getCategories: build.query<CategoryType[], void>({
      query: () => ({
        url: '',
        method: 'GET',
      }),
      transformResponse: (response: ProductType[]) => response,
    }),
    getProductsByCategory: build.query<ProductType[], number>({
      query: (categoryId) => ({
        url: `/${categoryId}/products`,
        method: 'GET',
      }),
      transformResponse: (response: ProductType[]) => response
    }),
  }),
})

export const { useGetCategoriesQuery, useGetProductsByCategoryQuery } = categoriesApi;