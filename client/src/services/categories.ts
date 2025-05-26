import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { CategoryType, ProductType } from 'shared-ts';
import { BASE_API_URL } from '../config';

const API_URL = BASE_API_URL + '/categories';

export const categoriesApi = createApi({
  reducerPath: 'categoriesApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL, credentials: 'include' }),
  endpoints: (build) => ({
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
      transformResponse: (response: ProductType[]) => response,
    }),
  }),
});

export const { useGetCategoriesQuery, useGetProductsByCategoryQuery } = categoriesApi;
