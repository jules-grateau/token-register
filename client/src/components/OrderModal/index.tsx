import React from 'react';
import styles from './OrderModal.module.css';
import { useGetOrdersQuery, useRemoveOrderMutation } from '../../services/orders';
import CartItem from '../Cart/CartItem';
import Button from '../Button';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose
}) => {
  const ordersQuery = useGetOrdersQuery();
  const { data: ordersData, isLoading, error } = ordersQuery;
  const [removeOrder] = useRemoveOrderMutation();


  const onRemoveOrder = async (id : number) => {
    try {
      const response = await removeOrder(id).unwrap();
      console.log('Order removed:', response);
    } catch (error) {
      console.error('Error removing order:', error);
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
          <h2 className={styles.modalTitle}> Order History</h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close modal">
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
            {isLoading && <p>Loading...</p>}
            {error && <p>Error loading orders</p>}
          {ordersData && ordersData.length > 0 ? (
            <>
              <ul className={styles.orderList}>
                  {ordersData.map((order, index) => (
                    <div className={styles.order} key={index}>
                      <li key={index}>
                        <div className={styles.orderHeader}>
                          <h3 className={styles.orderNumber}>Order #{order.id} - {new Date(order.date).toLocaleString('fr-FR')}</h3>
                           <Button
                            onClick={() => onRemoveOrder(order.id)}
                            color="danger"
                          > Delete </Button>
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
                      <span>{order.items.reduce((acc, item) => acc + item.product.price * item.quantity, 0)} Tokens</span>
                      <span>{order.items.reduce((acc, item) => acc + item.quantity, 0)} Items</span>
                    </div>
                  </div>
                  ))}
              </ul>
            </>
          ) : (
            <p>No orders to display.</p>
          )}
        </div>
        <div className={styles.modalFooter}>
          <Button onClick={onClose} color='danger'> Close </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;