import { isAnyOf } from '@reduxjs/toolkit';
import { ordersApi } from '../../services/orders';
import { invalidateCashDays } from '../../services/cashDays';
import { AppStartListening } from '.';

/**
 * D-061: the open day's totals follow every sale and deletion made here. A refused sale also
 * refreshes them: CASH_DAY_REQUIRED means another register closed the day.
 */
export default (startListening: AppStartListening) =>
  startListening({
    matcher: isAnyOf(
      ordersApi.endpoints.addOrder.matchFulfilled,
      ordersApi.endpoints.addOrder.matchRejected,
      ordersApi.endpoints.removeOrder.matchFulfilled
    ),
    effect: (_action, store) => {
      store.dispatch(invalidateCashDays());
    },
  });
