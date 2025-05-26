import React, { useEffect, useState } from 'react';
import styles from './OrderHistoryModal.module.css';
import { useGetOrdersQuery, useRemoveOrderMutation } from '../../services/orders';
import CartItem from '../Cart/CartItem';
import Button from '../Button';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Modal from '../Modal';
import ConfirmationModal from '../ConfirmationModal';
import Loader from '../Loader';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const ordersQuery = useGetOrdersQuery();
  const { data: ordersData, isFetching, error } = ordersQuery;
  const [removeOrder, { isLoading: isRemoveLoading }] = useRemoveOrderMutation();
  const [selectedOrder, setSelectedOrder] = useState(0);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) void ordersQuery.refetch();
  }, [isOpen]);

  const onRemoveOrder = (id: number) => {
    setSelectedOrder(id);
    setIsConfirmationModalOpen(true);
  };

  const onConfirmRemoveOrder = async (id: number) => {
    if (isRemoveLoading) return;
    try {
      await removeOrder(id).unwrap();
      toast.success(t('order_removed', { id }));
      setIsConfirmationModalOpen(false);
    } catch (error) {
      toast.error(t('error_removing_order', { error: String(error) }));
    } finally {
      await ordersQuery.refetch();
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={t('order_history')}>
        {isFetching && <p>{t('loading')}</p>}
        {error && <p>{t('error_loading_orders')}</p>}
        {ordersData && ordersData.length > 0 ? (
          <>
            <Loader isLoading={isFetching} />
            <ul className={styles.orderList}>
              {ordersData.map((order, index) => {
                const totalPrice = order.items.reduce(
                  (acc, item) => acc + (item.product.price * item.quantity - item.discountedAmount),
                  0
                );
                const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);
                return (
                  <div className={styles.order} key={index}>
                    <li key={index}>
                      <div className={styles.orderHeader}>
                        <h3 className={styles.orderNumber}>
                          {t('order_number', {
                            id: order.id,
                            date: new Date(order.date).toLocaleString(),
                          })}
                        </h3>
                        <Button onClick={() => onRemoveOrder(order.id)} color="danger">
                          {' '}
                          {t('delete')}{' '}
                        </Button>
                      </div>
                      <ul className={styles.orderItems}>
                        {order.items.map((item, itemIndex) => (
                          <CartItem key={itemIndex} item={item} />
                        ))}
                      </ul>
                    </li>
                    <div className={styles.orderTotal}>
                      <span>
                        {totalPrice} {t('tokens', { count: totalPrice })}
                      </span>
                      <span>
                        {totalItems} {t('items', { count: totalItems })}
                      </span>
                    </div>
                  </div>
                );
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
        onConfirm={() => void onConfirmRemoveOrder(selectedOrder)}
        title={t('confirmation')}
      >
        <Loader isLoading={isRemoveLoading}></Loader>
        <p className={styles.confirmationMessage}>
          {t('order_removal_confirmation', { id: selectedOrder })}{' '}
        </p>
      </ConfirmationModal>
    </>
  );
};

export default OrderHistoryModal;
