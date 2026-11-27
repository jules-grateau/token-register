import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../redux/store';
import { checkSession, selectAuthStatus } from '../../redux/authSlice';
import Login, { AuthSplash } from '../Login';

/**
 * D-063: the register is shown only with an open session. While GET /auth/me runs, a neutral
 * screen; without a session, the login screen. Nothing of the register mounts before, so no API
 * call is made without a session.
 */
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const status = useSelector(selectAuthStatus);

  useEffect(() => {
    void dispatch(checkSession());
  }, [dispatch]);

  if (status === 'checking') return <AuthSplash />;
  if (status === 'anonymous') return <Login />;
  return <>{children}</>;
};

export default AuthGate;
