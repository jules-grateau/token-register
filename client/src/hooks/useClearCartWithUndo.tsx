import { useCallback } from 'react';
import { useDispatch, useStore } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Button, Group, Text } from '@mantine/core';
import type { CartItemType } from 'shared-ts';
import { clearCart, restoreCart, type CartState } from '../redux/cartSlice';

export const CART_CLEARED_TOAST_ID = 'cart-cleared';

interface CartClearedToastProps {
  onUndo: () => void;
}

function CartClearedToast({ onUndo }: CartClearedToastProps): React.ReactElement {
  const { t } = useTranslation();
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm" w="100%">
      <Text fw={600}>{t('cart_cleared')}</Text>
      <Button
        variant="outline"
        h={44}
        onClick={onUndo}
        styles={{
          root: { color: 'var(--color-info-text)', borderColor: 'var(--color-info-text)' },
        }}
      >
        {t('undo')}
      </Button>
    </Group>
  );
}

/**
 * D-019: empties the cart at once, then offers "Annuler" for 5 s in a toast.
 * "Annuler" merges the previous cart with what was added in the meantime.
 */
export function useClearCartWithUndo(): () => void {
  const dispatch = useDispatch();
  const store = useStore<{ cart: CartState }>();

  return useCallback(() => {
    const previous: CartItemType[] = store.getState().cart.items;
    if (previous.length === 0) return;
    dispatch(clearCart());

    const onUndo = () => {
      dispatch(restoreCart(previous));
      toast.dismiss(CART_CLEARED_TOAST_ID);
    };
    // No close button: it overlapped "Annuler" (the toast closes by itself after 5 s).
    const options = {
      autoClose: 5000,
      closeOnClick: false,
      pauseOnHover: true,
      closeButton: false,
    };
    // One toast at a time: a new clear replaces the previous undo offer.
    if (toast.isActive(CART_CLEARED_TOAST_ID)) {
      toast.update(CART_CLEARED_TOAST_ID, {
        ...options,
        render: <CartClearedToast onUndo={onUndo} />,
      });
    } else {
      toast.info(<CartClearedToast onUndo={onUndo} />, {
        ...options,
        toastId: CART_CLEARED_TOAST_ID,
      });
    }
  }, [dispatch, store]);
}
