import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { CategoryType, ProductType, PostAPIResponseType } from 'shared-ts';
import { BASE_API_URL } from '../config';
import { ApiProductType, mapProduct } from './mappers';

const API_URL = BASE_API_URL + '/categories';

export const categoriesApi = createApi({
  reducerPath: 'categoriesApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL, credentials: 'include' }),
  tagTypes: ['Categories', 'Products'],
  endpoints: (build) => ({
    getCategories: build.query<CategoryType[], void>({
      query: () => '',
      providesTags: ['Categories'],
    }),
    getProductsByCategory: build.query<ProductType[], number>({
      query: (categoryId) => `/${categoryId}/products`,
      transformResponse: (response: ApiProductType[]) => response.map(mapProduct),
      providesTags: ['Products'],
    }),
    createCategory: build.mutation<PostAPIResponseType, Omit<CategoryType, 'id'>>({
      query: (category) => ({
        url: '',
        method: 'POST',
        body: category,
      }),
      invalidatesTags: ['Categories'],
    }),
    updateCategory: build.mutation<void, CategoryType>({
      query: ({ id, name }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: { name },
      }),
      invalidatesTags: ['Categories'],
    }),
    deleteCategory: build.mutation<void, number>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Categories', 'Products'],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetProductsByCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
