import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { sessionExpired } from '../redux/authSlice';

/**
 * fetchBaseQuery of the app's APIs, with the session cookie (D-063). A 401 means the session
 * ended (expired, revoked, account disabled): back to the login screen with "Votre session a
 * expiré" (answer 7 a). sessionExpired only acts while logged in, so this never loops; the
 * login and /auth/me calls do not go through here (services/auth.ts).
 */
export function authBaseQuery(
  options: FetchBaseQueryArgs
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> {
  const baseQuery = fetchBaseQuery({ credentials: 'include', ...options });
  return async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);
    if (result.error?.status === 401) api.dispatch(sessionExpired());
    return result;
  };
}
