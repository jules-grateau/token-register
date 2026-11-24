import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CashDayType,
  CurrentCashDayResponseType,
  PaginatedOrdersResponse,
  PaginationParams,
} from 'shared-ts';
import { BASE_API_URL } from '../config';

const API_URL = BASE_API_URL + '/cash-days';

/**
 * Cash days (D-061). Every endpoint provides or invalidates the "CashDay" tag: after a sale or a
 * deletion, invalidating it refreshes the open day's totals and the closed days.
 */
export const cashDaysApi = createApi({
  reducerPath: 'cashDaysApi',
  tagTypes: ['CashDay'],
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  endpoints: (build) => ({
    getCurrentCashDay: build.query<CashDayType | null, void>({
      query: () => ({ url: '/current', method: 'GET' }),
      transformResponse: (response: CurrentCashDayResponseType) => response.cashDay,
      providesTags: ['CashDay'],
    }),
    getClosedCashDays: build.query<CashDayType[], void>({
      query: () => ({ url: '', method: 'GET' }),
      providesTags: ['CashDay'],
    }),
    getCashDayOrders: build.query<
      PaginatedOrdersResponse,
      { cashDayId: number } & PaginationParams
    >({
      query: ({ cashDayId, page, pageSize }) => ({
        url: `/${cashDayId}/orders?page=${page}&pageSize=${pageSize}`,
        method: 'GET',
      }),
      providesTags: ['CashDay'],
    }),
    openCashDay: build.mutation<CashDayType, void>({
      query: () => ({ url: '', method: 'POST' }),
      invalidatesTags: ['CashDay'],
    }),
    closeCashDay: build.mutation<CashDayType, void>({
      query: () => ({ url: '/current/close', method: 'POST' }),
      invalidatesTags: ['CashDay'],
    }),
    removeCashDayOrder: build.mutation<void, { cashDayId: number; orderId: number }>({
      query: ({ cashDayId, orderId }) => ({
        url: `/${cashDayId}/orders/${orderId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CashDay'],
    }),
  }),
});

export const {
  useGetCurrentCashDayQuery,
  useGetClosedCashDaysQuery,
  useGetCashDayOrdersQuery,
  useOpenCashDayMutation,
  useCloseCashDayMutation,
  useRemoveCashDayOrderMutation,
} = cashDaysApi;

/** Refreshes the open day's totals (after a sale or a deletion made elsewhere). */
export const invalidateCashDays = () => cashDaysApi.util.invalidateTags(['CashDay']);
