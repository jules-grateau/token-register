import React from 'react';

import Catalog from '../Catalog';
import Cart from '../Cart';
import OrderModal from '../OrderModal';
import styles from './Register.module.css';

export const Register: React.FC = () => {
  const [isOrderModalOpen, setIsOrderModalOpen] = React.useState(false);

  return (
    <div className={styles.registerContainer}>
      <Cart onClickHistory={() => setIsOrderModalOpen(true)}/>
      <Catalog />
      <OrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)}/>
    </div>
  )
}