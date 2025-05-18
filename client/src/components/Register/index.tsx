import React from 'react';

import ProductArea from '../ProductArea';
import Cart from '../Cart';
import OrderModal from '../OrderModal';

export const Register: React.FC = () => {
  const [isOrderModalOpen, setIsOrderModalOpen] = React.useState(false);

  return (
    <>
      <Cart onClickHistory={() => setIsOrderModalOpen(true)}/>
      <ProductArea />
      <OrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)}/>
    </>
  )
}