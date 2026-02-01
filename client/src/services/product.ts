import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ProductType, PostAPIResponseType } from 'shared-ts';
import { BASE_API_URL } from '../config';

const API_URL = BASE_API_URL + '/products';

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL, credentials: 'include' }),
  tagTypes: ['Products'],
  endpoints: (build) => ({
    getProducts: build.query<ProductType[], void>({
      query: () => ({
        url: '',
        method: 'GET',
      }),
      transformResponse: (response: ProductType[]) => response,
      providesTags: ['Products'],
    }),
    createProduct: build.mutation<PostAPIResponseType, Omit<ProductType, 'id'>>({
      query: (product) => ({
        url: '',
        method: 'POST',
        body: product,
      }),
      invalidatesTags: ['Products'],
    }),
    updateProduct: build.mutation<void, { id: number } & Partial<Omit<ProductType, 'id'>>>({
      query: ({ id, ...patch }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['Products'],
    }),
    deleteProduct: build.mutation<void, number>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Products'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;
