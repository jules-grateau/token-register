import React from 'react';

import Catalog from '../Catalog';
import Cart from '../Cart';
import OrderModal from '../OrderModal';

export const Register: React.FC = () => {
  const [isOrderModalOpen, setIsOrderModalOpen] = React.useState(false);

  return (
    <>
      <Cart onClickHistory={() => setIsOrderModalOpen(true)}/>
      <Catalog />
      <OrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)}/>
    </>
  )
}