import { isAnyOf } from '@reduxjs/toolkit';
import { productsApi } from '../../services/product';
import { categoriesApi } from '../../services/categories';
import { AppStartListening } from '.';

export default (startListening: AppStartListening) =>
  startListening({
    matcher: isAnyOf(
      productsApi.endpoints.createProduct.matchFulfilled,
      productsApi.endpoints.updateProduct.matchFulfilled,
      productsApi.endpoints.deleteProduct.matchFulfilled
    ),
    effect: (_action, store) => {
      store.dispatch(categoriesApi.util.invalidateTags(['Products']));
    },
  });
