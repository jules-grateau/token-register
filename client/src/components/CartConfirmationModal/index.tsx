import React from 'react';
import CartItem from '../Cart/CartItem';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCartItems,
  selectTotalPrice,
  selectTotalItems,
  clearCart,
} from '../../redux/cartSlice';
import { useAddOrderMutation, useGetOrdersQuery } from '../../services/orders';
import type { CartItemType } from 'shared-ts';
import { toast } from 'react-toastify';
import { Group, Stack, Text, ScrollArea } from '@mantine/core';
import ConfirmationModal from '../ConfirmationModal';
import Loader from '../Loader';
import { useCurrency } from '../../hooks/useCurrency';

interface CartConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after the order is saved (e.g. to collapse the phone cart Drawer). */
  onOrderPlaced?: () => void;
}

const CartConfirmationModal: React.FC<CartConfirmationModalProps> = ({
  isOpen,
  onClose,
  onOrderPlaced,
}) => {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const cartItems = useSelector(selectCartItems);
  const totalPrice = useSelector(selectTotalPrice);
  const totalItems = useSelector(selectTotalItems);

  const [addOrder, { isLoading }] = useAddOrderMutation();
  const ordersQuery = useGetOrdersQuery();
  const dispatch = useDispatch();

  const handleConfirm = async (cartItems: CartItemType[]) => {
    if (isLoading) return;
    try {
      const id = await addOrder(cartItems).unwrap();
      dispatch(clearCart());
      void ordersQuery.refetch();
      toast.success(t('order_placed', { id }));
      onClose();
      onOrderPlaced?.();
    } catch (error) {
      toast.error(t('error_adding_order', { error: String(error) }), { autoClose: 5000 });
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const modalFooter = (
    <Group justify="space-between">
      <Text fw={700}>{`${totalItems} ${t('items', { count: totalItems })}`}</Text>
      <Text fw={700} style={{ whiteSpace: 'nowrap' }}>
        {format(totalPrice)}
      </Text>
    </Group>
  );

  return (
    <ConfirmationModal
      isOpen={isOpen}
      title={t('cart_confirmation')}
      onClose={handleClose}
      onConfirm={() => void handleConfirm(cartItems)}
      extraFooter={modalFooter}
    >
      <Stack>
        {isLoading && <Loader isLoading={isLoading} />}
        {cartItems.length === 0 && !isLoading ? (
          <Text>{t('your_cart_is_empty')}</Text>
        ) : (
          <ScrollArea.Autosize mah={300}>
            <Stack>
              {cartItems.map((item, index) => (
                <CartItem key={index} item={item} />
              ))}
            </Stack>
          </ScrollArea.Autosize>
        )}
      </Stack>
    </ConfirmationModal>
  );
};

export default CartConfirmationModal;
