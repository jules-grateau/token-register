import React, { useState } from 'react';
import styles from './OrderHistoryModal.module.css';
import { useGetOrdersQuery, useRemoveOrderMutation } from '../../services/orders';
import CartItem from '../Cart/CartItem';
import Button from '../Button';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Modal from '../Modal';
import ConfirmationModal from '../ConfirmationModal';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const ordersQuery = useGetOrdersQuery();
  const { data: ordersData, isLoading, error } = ordersQuery;
  const [removeOrder] = useRemoveOrderMutation();
  const [selectedOrder, setSelectedOrder] = useState(0);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false); 


  const onRemoveOrder = (id : number) => {
    setSelectedOrder(id);
    setIsConfirmationModalOpen(true);
  };

  const onConfirmRemoveOrder = async (id: number) => {
    try {
      await removeOrder(id).unwrap();
      toast.success(t('order_removed', { id }));
    } catch (error) {
      toast.error(t('error_removing_order', { error: String(error) }));
    }
    finally {
      ordersQuery.refetch();
    }
  }

  return (
    <>
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={t('order_history')} 
    >
        {isLoading && <p>{t('loading')}</p>}
        {error && <p>{t('error_loading_orders')}</p>}
        {ordersData && ordersData.length > 0 ? (
        <>
            <ul className={styles.orderList}>
                {ordersData.map((order, index) => 
                {
                var totalPrice = order.items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
                var totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0)
                return <div className={styles.order} key={index}>
                    <li key={index}>
                    <div className={styles.orderHeader}>
                        <h3 className={styles.orderNumber}>{t('order_number', { id: order.id, date: new Date(order.date).toLocaleString() })}</h3>
                        <Button
                        onClick={() => onRemoveOrder(order.id)}
                        color="danger"
                        > {t('delete')} </Button>
                    </div>
                        <ul className={styles.orderItems}>
                            {order.items.map((item, itemIndex) => (
                            <CartItem
                                key={itemIndex}
                                item={item}
                            />
                            ))}
                        </ul>
                    </li>
                <div className={styles.orderTotal}>
                    <span>{totalPrice} {t('tokens', { count:totalPrice })}</span>
                    <span>{totalItems} {t('items', { count:totalItems })}</span>
                </div>
                </div>
                })}
            </ul>
        </>
        ) : (
        <p>{t('no_orders')}</p>
        )}
    </Modal>
    <ConfirmationModal
      isOpen={isConfirmationModalOpen}
      onClose={() => setIsConfirmationModalOpen(false)}
      onConfirm={() => onConfirmRemoveOrder(selectedOrder)}
      title={t('confirmation')}
      >
      <p className={styles.confirmationMessage}>{t('order_removal_confirmation', { id: selectedOrder })} </p>
    </ConfirmationModal>
    </>
  );
};

export default OrderHistoryModal;