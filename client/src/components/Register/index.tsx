import React, { useState } from 'react';
import { Box, Flex } from '@mantine/core';
import Catalog from '../Catalog';
import Cart from '../Cart';
import OrderHistoryModal from '../OrderHistoryModal';
import CartConfirmationModal from '../CartConfirmationModal';

export const Register: React.FC = () => {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCartConfirmationModalOpen, setIsCartConfrimationModalOpen] = useState(false);

  return (
    <>
      <Flex direction={{ base: 'column-reverse', sm: 'row-reverse' }} flex={1}>
        <Box flex={{ base: 1.5, sm: 2, md: 3 }} p={0} display="flex" mih={0}>
          <Cart
            onClickHistory={() => setIsOrderModalOpen(true)}
            onValidateCart={() => setIsCartConfrimationModalOpen(true)}
          />
        </Box>
        <Box flex={{ base: 2, sm: 3, md: 6 }} display="flex" mih={0}>
          <Catalog />
        </Box>
      </Flex>
      <OrderHistoryModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} />
      <CartConfirmationModal
        isOpen={isCartConfirmationModalOpen}
        onClose={() => setIsCartConfrimationModalOpen(false)}
      />
    </>
  );
};
