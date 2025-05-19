import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { CategoryType, ProductType } from 'shared-ts';

const API_URL = 'http://localhost:3001/categories';

export const categoriesApi = createApi({
  reducerPath: 'categoriesApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
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