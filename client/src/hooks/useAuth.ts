import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AuthUserType } from 'shared-ts';
import type { AppDispatch } from '../redux/store';
import { logOut, selectAuthUser } from '../redux/authSlice';

/** The logged-in user and "Se déconnecter" (D-063, answer 8 a: no confirmation). */
export function useAuth(): { user: AuthUserType | null; logOut: () => void } {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectAuthUser);
  const handleLogOut = useCallback(() => void dispatch(logOut()), [dispatch]);
  return { user, logOut: handleLogOut };
}
