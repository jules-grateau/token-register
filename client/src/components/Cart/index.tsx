import React, { useState } from 'react';
import {
  Paper,
  Group,
  Text,
  Center,
  ScrollArea,
  Stack,
  Button,
  ActionIcon,
  Divider,
} from '@mantine/core';
import CartItem from './CartItem';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCartItems,
  selectTotalPrice,
  remove,
  selectTotalItems,
  addDiscount,
} from '../../redux/cartSlice';
import { useTranslation } from 'react-i18next';
import type { CartItemType } from 'shared-ts';
import DiscountModal, { type DiscountDetails } from '../DiscountModal';
import { IconCancel, IconHistory } from '@tabler/icons-react';

interface CartProps {
  onClickHistory: () => void;
  onValidateCart: () => void;
}

const Cart: React.FC<CartProps> = ({ onClickHistory, onValidateCart }: CartProps) => {
  const { t } = useTranslation();
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountModalTarget, setDiscountModalTarget] = useState<CartItemType>();
  const cartItems = useSelector(selectCartItems);
  const totalPrice = useSelector(selectTotalPrice);
  const totalItems = useSelector(selectTotalItems);
  const dispatch = useDispatch();

  const openDiscountModal = (cartItem: CartItemType) => {
    setIsDiscountModalOpen(true);
    setDiscountModalTarget(cartItem);
  };

  const handleConfirmDiscountModal = (discountDetails: DiscountDetails) => {
    setIsDiscountModalOpen(false);
    dispatch(
      addDiscount({
        productId: discountModalTarget?.product.id || 0,
        discountedAmount: discountDetails.discount,
      })
    );
  };

  return (
    <Paper
      radius={0}
      p={0}
      display="flex"
      flex={1}
      style={{
        borderLeft: '1px solid var(--mantine-color-default-border)',
      }}
    >
      <Stack flex={1} gap={0}>
        {/* Header */}
        <Group
          justify="flex-end"
          align="center"
          p={0}
          pr="sm"
          gap="xl"
          flex={1.5}
          m={0}
          style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
        >
          <ActionIcon onClick={onClickHistory} variant="transparent" radius={0} flex={1} h="100%">
            <IconHistory stroke={1.5} />
          </ActionIcon>
          <ActionIcon variant="transparent" radius={0} flex={1} h="100%">
            <IconCancel stroke={1.5} color="red" />
          </ActionIcon>
        </Group>

        {cartItems.length === 0 ? (
          <Center style={{ flex: 10 }} m={0}>
            <Text style={{ fontStyle: 'italic' }}>{t('your_cart_is_empty')}</Text>
          </Center>
        ) : (
          <>
            <ScrollArea type="auto" flex={8} m={0} p={0}>
              <Stack gap={0} p="xs" h="fit-content">
                {cartItems.map((item, index) => (
                  <>
                    <CartItem
                      key={index}
                      item={item}
                      onRemove={() => dispatch(remove(index))}
                      onDiscount={openDiscountModal}
                    />
                    <Divider my="xs" p={0} mb="xs" />
                  </>
                ))}
              </Stack>
            </ScrollArea>
            <Group flex={2} style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
              <Button onClick={onValidateCart} fullWidth radius={0} m={0} size="lg">
                {t('checkout')}
              </Button>
              <Stack gap="xs" align="center">
                <Text fw={700} size="sm" data-testid="cart-total-item">
                  {totalItems} {t('items', { count: totalItems })}
                </Text>
                <Text fw={700} size="sm" data-testid="item-total-price">
                  {totalPrice} {t('tokens', { count: totalPrice })}
                </Text>
              </Stack>
            </Group>
          </>
        )}
      </Stack>

      {/* Discount Modal */}
      {discountModalTarget && (
        <DiscountModal
          isOpen={isDiscountModalOpen}
          item={discountModalTarget}
          onClose={() => setIsDiscountModalOpen(false)}
          onConfirmDiscount={handleConfirmDiscountModal}
        />
      )}
    </Paper>
  );
};

export default Cart;
