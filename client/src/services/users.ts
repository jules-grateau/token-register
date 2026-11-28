import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  CreateUserRequestType,
  ResetPasswordRequestType,
  UpdateUserRequestType,
  UserAccountType,
} from 'shared-ts';
import { BASE_API_URL } from '../config';
import { authBaseQuery } from './baseQuery';

const API_URL = BASE_API_URL + '/users';

/**
 * Accounts (D-064), admin only. Every change invalidates the "User" tag: the list is read again
 * (order: active first, then by username, sorted by the API).
 */
export const usersApi = createApi({
  reducerPath: 'usersApi',
  tagTypes: ['User'],
  baseQuery: authBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  endpoints: (build) => ({
    getUsers: build.query<UserAccountType[], void>({
      query: () => ({ url: '', method: 'GET' }),
      providesTags: ['User'],
    }),
    createUser: build.mutation<UserAccountType, CreateUserRequestType>({
      query: (body) => ({ url: '', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    updateUser: build.mutation<UserAccountType, { id: number } & UpdateUserRequestType>({
      query: ({ id, ...body }) => ({ url: `/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
    resetUserPassword: build.mutation<UserAccountType, { id: number } & ResetPasswordRequestType>({
      query: ({ id, ...body }) => ({ url: `/${id}/reset-password`, method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useResetUserPasswordMutation,
} = usersApi;
