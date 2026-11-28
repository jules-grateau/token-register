import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  CreateOrderRequestType,
  PostAPIResponseType,
  PaginatedOrdersResponse,
  PaginationParams,
} from 'shared-ts';
import { BASE_API_URL } from '../config';
import { authBaseQuery } from './baseQuery';

const API_URL = BASE_API_URL + '/orders';

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: authBaseQuery({
    baseUrl: API_URL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  endpoints: (build) => ({
    addOrder: build.mutation<number, CreateOrderRequestType>({
      query: (order: CreateOrderRequestType) => ({
        url: '',
        method: 'POST',
        body: order,
      }),
      transformResponse: (response: PostAPIResponseType) => response.id,
    }),
    removeOrder: build.mutation<void, number>({
      query: (id) => ({
        url: `${API_URL}/${id}`,
        method: 'DELETE',
      }),
    }),
    getOrders: build.query<PaginatedOrdersResponse, PaginationParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params) {
          queryParams.append('page', params.page.toString());
          queryParams.append('pageSize', params.pageSize.toString());
        }
        const queryString = queryParams.toString();
        return {
          url: queryString ? `?${queryString}` : '',
          method: 'GET',
        };
      },
    }),
  }),
});

export const { useAddOrderMutation, useGetOrdersQuery, useRemoveOrderMutation } = ordersApi;
