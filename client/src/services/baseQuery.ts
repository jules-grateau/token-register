import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { passwordChangeRequired, sessionExpired } from '../redux/authSlice';
import { extractApiErrorCode } from '../utils/extractApiError';

/**
 * fetchBaseQuery of the app's APIs, with the session cookie (D-063). A 401 means the session
 * ended (expired, revoked, account disabled): back to the login screen with "Votre session a
 * expiré" (answer 7 a). sessionExpired only acts while logged in, so this never loops; the
 * login and /auth/me calls do not go through here (services/auth.ts).
 * A 403 PASSWORD_CHANGE_REQUIRED (D-064) is not an expired session: the session stays, and the
 * screen asking for a new password takes the place of the register.
 */
export function authBaseQuery(
  options: FetchBaseQueryArgs
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> {
  const baseQuery = fetchBaseQuery({ credentials: 'include', ...options });
  return async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);
    if (result.error?.status === 401) api.dispatch(sessionExpired());
    else if (
      result.error?.status === 403 &&
      extractApiErrorCode(result.error) === 'PASSWORD_CHANGE_REQUIRED'
    ) {
      api.dispatch(passwordChangeRequired());
    }
    return result;
  };
}
