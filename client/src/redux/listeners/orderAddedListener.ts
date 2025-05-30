import { isAnyOf } from '@reduxjs/toolkit';
import { ordersApi } from '../../services/orders';
import { resetSelectedCategory } from '../selectedCategorySlice';
import { AppStartListening } from '.';

export default (startListening: AppStartListening) =>
  startListening({
    matcher: isAnyOf(ordersApi.endpoints.addOrder.matchFulfilled),
    effect: (_action, store) => {
      store.dispatch(resetSelectedCategory());
    },
  });
