import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../redux/store';
import { checkSession, selectAuthStatus, selectMustChangePassword } from '../../redux/authSlice';
import Login, { AuthSplash } from '../Login';
import ForcedPasswordChange from '../ChangePassword/ForcedPasswordChange';

/**
 * D-063: the register is shown only with an open session. While GET /auth/me runs, a neutral
 * screen; without a session, the login screen. Nothing of the register mounts before, so no API
 * call is made without a session. D-064: with a temporary password (known from the login or
 * from /auth/me, also after a reload), the screen asking for a new one, never the register.
 */
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const status = useSelector(selectAuthStatus);
  const mustChangePassword = useSelector(selectMustChangePassword);

  useEffect(() => {
    void dispatch(checkSession());
  }, [dispatch]);

  if (status === 'checking') return <AuthSplash />;
  if (status === 'anonymous') return <Login />;
  if (mustChangePassword) return <ForcedPasswordChange />;
  return <>{children}</>;
};

export default AuthGate;
