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
  updateQuantity,
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

  const handleQuantityChange = (item: CartItemType, amount: number) => {
    dispatch(updateQuantity({ productId: item.product.id, amount }));
  };

  return (
    <Paper
      radius={0}
      p={0}
      display="flex"
      flex={1}
      style={{
        border: '1px solid var(--mantine-color-default-border)',
      }}
    >
      <Stack flex={1} gap={0}>
        {/* Header */}
        <Group
          justify="flex-end"
          p={0}
          gap="xl"
          flex={1}
          m={0}
          style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
        >
          <Divider orientation="vertical" />
          <ActionIcon
            onClick={onClickHistory}
            variant="transparent"
            radius={0}
            aria-label={t('history')}
            h="100%"
          >
            <IconHistory stroke={1.5} />
          </ActionIcon>
          <Divider orientation="vertical" />
          <ActionIcon variant="transparent" radius={0} h="100%">
            <IconCancel stroke={1.5} color="red" />
          </ActionIcon>
          <Divider orientation="vertical" />
        </Group>

        {cartItems.length === 0 ? (
          <Center style={{ flex: 10 }} m={0}>
            <Text style={{ fontStyle: 'italic' }}>{t('your_cart_is_empty')}</Text>
          </Center>
        ) : (
          <>
            <ScrollArea type="auto" flex={8} m={0} p={0}>
              <Stack gap="xs" p="xs" h="fit-content">
                {cartItems.map((item, index) => (
                  <>
                    <CartItem
                      key={index}
                      item={item}
                      onRemove={() => dispatch(remove(index))}
                      onDiscount={openDiscountModal}
                      onQuantityChange={handleQuantityChange}
                    />
                    <Divider my="xs" p={0} m={0} />
                  </>
                ))}
              </Stack>
            </ScrollArea>
            <Stack
              gap="md"
              p="md"
              style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
            >
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {t('total_items')}
                </Text>
                <Text fw={500} size="sm" data-testid="cart-total-item">
                  {totalItems} {t('items', { count: totalItems })}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="lg" fw={700}>
                  {t('total')}
                </Text>
                <Text fw={700} size="lg" data-testid="item-total-price">
                  {totalPrice} {t('tokens', { count: totalPrice })}
                </Text>
              </Group>
              <Button onClick={onValidateCart} fullWidth size="lg" mt="sm">
                {t('checkout')}
              </Button>
            </Stack>
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
