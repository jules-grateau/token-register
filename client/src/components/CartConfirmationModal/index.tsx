import React from 'react';
import styles from './CartConfirmationModal.module.css';
import CartItem from '../Cart/CartItem';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { selectCartItems, selectTotalPrice, selectTotalItems, clear } from '../../redux/cartSlice';
import { useAddOrderMutation, useGetOrdersQuery } from '../../services/orders';
import type { CartItemType } from 'shared-ts';
import { toast } from 'react-toastify';
import ConfirmationModal from '../ConfirmationModal';
import Loader from '../Loader';

interface CartConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartConfirmationModal: React.FC<CartConfirmationModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const cartItems = useSelector(selectCartItems);
  const totalPrice = useSelector(selectTotalPrice);
  const totalItems = useSelector(selectTotalItems);

  const [addOrder, { isLoading }] = useAddOrderMutation();
  const ordersQuery = useGetOrdersQuery();
  const dispatch = useDispatch();

  const handleConfirm = (cartItems: CartItemType[]) => {
    if (isLoading) return;
    try {
      addOrder(cartItems)
        .unwrap()
        .then((id) => {
          dispatch(clear());
          void ordersQuery.refetch();
          toast.success(t('order_placed', { id }));
          onClose();
        })
        .catch((error) => {
          toast.error(t(t('error_adding_order', { error: String(error) })));
        });
    } catch (error) {
      toast.error(t(t('error_adding_order', { error: String(error) })));
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const modalFooter = (
    <>
      <div className={styles.cartTotal}>
        <strong>
          {totalItems} {t('items', { count: totalItems })}
        </strong>
        <strong>
          {totalPrice} {t('tokens', { count: totalPrice })}
        </strong>
      </div>
    </>
  );

  return (
    <ConfirmationModal
      isOpen={isOpen}
      title={t('cart_confirmation')}
      onClose={handleClose}
      onConfirm={() => void handleConfirm(cartItems)}
      extraFooter={modalFooter}
    >
      <>
        <div>
          {<Loader isLoading={isLoading} />}
          {cartItems.length === 0 ? (
            <p className={styles.emptyCartMessage}>{t('your_cart_is_empty')}</p>
          ) : (
            <>
              <ul className={styles.cartList}>
                {cartItems.map((item, index) => (
                  <CartItem key={index} item={item} />
                ))}
              </ul>
            </>
          )}
        </div>
      </>
    </ConfirmationModal>
  );
};

export default CartConfirmationModal;
