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

interface CartConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
}


const CartConfirmationModal  : React.FC<CartConfirmationModalProps> = ( {isOpen, onClose}) => {
    const { t } = useTranslation();
    const cartItems = useSelector(selectCartItems);
    const totalPrice = useSelector(selectTotalPrice);
    const totalItems = useSelector(selectTotalItems);

    const [addOrder] = useAddOrderMutation();
    const ordersQuery = useGetOrdersQuery();
    const dispatch = useDispatch();

    const onConfirm = async (cartItems : CartItemType[]) => {
        try {
            addOrder(cartItems).unwrap().then((id) => {
            dispatch(clear()); 
            ordersQuery.refetch();
            onClose();
            toast.success(t('order_placed', { id }));
            }).catch((error) => {
              toast.error(t(t('error_adding_order', { error: String(error?.data?.error) })));  
            });
        } catch (error) {
            toast.error(t(t('error_adding_order', { error: String(error) })));
        }
    }; 

    const modalFooter = <>
        <div className={styles.cartTotal}>
            <strong>{totalItems} {t('items', { count:totalItems })}</strong>
            <strong>{totalPrice} {t('tokens', { count:totalPrice})}</strong>
        </div> 
    </>

    return <ConfirmationModal
    isOpen={isOpen}
    title={t('cart_confirmation')}
    onClose={onClose}
    onConfirm={() => onConfirm(cartItems)}
    extraFooter={modalFooter}
    >
        <div>
            {cartItems.length === 0 ? (
                    <p className={styles.emptyCartMessage}>{t('your_cart_is_empty')}</p>
                  ) : (
                    <>
                      <ul className={styles.cartList}>
                        {cartItems.map((item, index) => (
                          <CartItem
                            key={index}
                            item={item}
                            />
                        ))}
                      </ul>
                    </>
                  )}
        </div>
    </ConfirmationModal>

}

export default CartConfirmationModal;