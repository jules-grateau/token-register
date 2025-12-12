import React from 'react';
import type { CartItemType } from 'shared-ts';
import { Group, Text, Menu, Paper, ActionIcon } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconDotsVertical, IconMinus, IconPlus } from '@tabler/icons-react';

interface CartItemProps {
  item: CartItemType;
  onRemove?: () => void;
  onDiscount?: (item: CartItemType) => void;
  onQuantityChange?: (item: CartItemType, quantity: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onRemove, onDiscount, onQuantityChange }) => {
  const { t } = useTranslation();

  const handleDiscountClick = () => {
    onDiscount?.(item);
  };

  const handleRemoveClick = () => {
    onRemove?.();
  };

  const handleIncrement = () => {
    onQuantityChange?.(item, 1);
  };

  const handleDecrement = () => {
    onQuantityChange?.(item, -1);
  };

  const calcPrice = item.product.price * item.quantity - item.discountedAmount;

  return (
    <Paper p={0} m={0} radius="sm" bg="transparent">
      <Group justify="flex-end" gap="sm" wrap="nowrap">
        <Group gap="xs" style={{ flex: 1 }} wrap="nowrap">
          <Text fw={600} size="sm" flex={1}>
            {item.product.name}
          </Text>
          {onQuantityChange && (
            <Group gap="xs" wrap="nowrap" flex={1}>
              <ActionIcon
                size="lg"
                variant="outline"
                onClick={handleDecrement}
                disabled={item.quantity <= 0}
                aria-label={t('minus')}
              >
                <IconMinus size={14} />
              </ActionIcon>
              <Text size="sm" style={{ minWidth: 20, textAlign: 'center' }}>
                {item.quantity}
              </Text>
              <ActionIcon
                size="lg"
                variant="outline"
                onClick={handleIncrement}
                aria-label={t('plus')}
              >
                <IconPlus size={14} />
              </ActionIcon>
            </Group>
          )}
        </Group>

        <Group gap={0} justify="flex-end" wrap="nowrap" flex={1}>
          <Text fw={600} size="sm" c={item.discountedAmount > 0 ? 'teal.8' : undefined}>
            {calcPrice} {t('tokens', { count: calcPrice })}
          </Text>
        </Group>

        {/* Menu Button */}
        {(onRemove || onDiscount) && (
          <Menu position="bottom-end" shadow="md" withArrow>
            <Menu.Target>
              <ActionIcon variant="transparent" color="gray" size="lg" h="100%">
                <IconDotsVertical stroke={1.5} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {onDiscount && (
                <Menu.Item onClick={handleDiscountClick}>{t('apply_discount')}</Menu.Item>
              )}
              {onRemove && (
                <Menu.Item onClick={handleRemoveClick} color="red">
                  {t('delete')}
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </Paper>
  );
};

export default CartItem;
