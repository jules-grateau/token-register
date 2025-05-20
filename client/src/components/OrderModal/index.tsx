import React from 'react';
import styles from './OrderModal.module.css';
import { useGetOrdersQuery, useRemoveOrderMutation } from '../../services/orders';
import CartItem from '../Cart/CartItem';
import Button from '../Button';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const ordersQuery = useGetOrdersQuery();
  const { data: ordersData, isLoading, error } = ordersQuery;
  const [removeOrder] = useRemoveOrderMutation();


  const onRemoveOrder = async (id : number) => {
    try {
      await removeOrder(id).unwrap();
      toast.success(t('order_removed', { id }));
    } catch (error) {
      toast.error(t('error_removing_order', { error: String(error) }));
    }
    finally {
      ordersQuery.refetch();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{t('order_history')}</h2>
          <button onClick={onClose} className={styles.closeButton} aria-label={t('close')}>
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
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
        </div>
        <div className={styles.modalFooter}>
          <Button onClick={onClose} color='danger'> {t('close')} </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;