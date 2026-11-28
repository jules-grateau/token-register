import { isAnyOf } from '@reduxjs/toolkit';
import type { AppStartListening } from '.';
import { logOut, sessionExpired } from '../authSlice';
import { productsApi } from '../../services/product';
import { categoriesApi } from '../../services/categories';
import { ordersApi } from '../../services/orders';
import { cashDaysApi } from '../../services/cashDays';
import { usersApi } from '../../services/users';

/**
 * After a logout or an expired session (D-063), the data read with the previous session is
 * dropped: the next account reads it again. The cart is kept (point 5): it is not API data.
 */
export default function authListener(startListening: AppStartListening) {
  startListening({
    matcher: isAnyOf(logOut.pending, sessionExpired),
    effect: (_action, api) => {
      api.dispatch(productsApi.util.resetApiState());
      api.dispatch(categoriesApi.util.resetApiState());
      api.dispatch(ordersApi.util.resetApiState());
      api.dispatch(cashDaysApi.util.resetApiState());
      api.dispatch(usersApi.util.resetApiState());
    },
  });
}
