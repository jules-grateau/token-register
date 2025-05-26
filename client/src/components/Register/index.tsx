import React, { useState } from 'react';

import Catalog from '../Catalog';
import Cart from '../Cart';
import OrderHistoryModal from '../OrderHistoryModal';
import CartConfirmationModal from '../CartConfirmationModal';
import styles from './Register.module.css';

export const Register: React.FC = () => {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCartConfirmationModalOpen, setIsCartConfrimationModalOpen] = useState(false);

  return (
    <div className={styles.registerContainer}>
      <Cart
        onClickHistory={() => setIsOrderModalOpen(true)}
        onValidateCart={() => setIsCartConfrimationModalOpen(true)}
      />
      <Catalog />
      <OrderHistoryModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} />
      <CartConfirmationModal
        isOpen={isCartConfirmationModalOpen}
        onClose={() => setIsCartConfrimationModalOpen(false)}
      />
    </div>
  );
};
