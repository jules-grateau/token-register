import React from 'react';
import type { CartItemType } from 'shared-ts';
import { Group, Stack, Text, Menu, Paper, ActionIcon } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconDotsVertical } from '@tabler/icons-react';

interface CartItemProps {
  item: CartItemType;
  onRemove?: () => void;
  onDiscount?: (item: CartItemType) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onRemove, onDiscount }) => {
  const { t } = useTranslation();

  const handleDiscountClick = () => {
    onDiscount?.(item);
  };

  const handleRemoveClick = () => {
    onRemove?.();
  };

  return (
    <Paper p={0} m={0} radius={0} mb="xs" bg="transparent" pb="xs">
      <Group justify="space-between" align="flex-start" gap="sm">
        <Stack gap={1} style={{ flex: 1 }}>
          <Group gap={4} p={0}>
            <Text fw={600} size="sm">
              {item.product.name}
            </Text>
            <Text size="sm" c="dimmed">
              x{item.quantity}
            </Text>
          </Group>
          {item.product.price !== undefined && (
            <Group gap="xs">
              {item.discountedAmount != null && item.discountedAmount !== 0 && (
                <Text size="xs" style={{ textDecoration: 'line-through' }} c="dimmed">
                  {item.product.price * item.quantity} {t('tokens', { count: item.product.price })}
                </Text>
              )}
              <Text fw={600} size="sm">
                {item.product.price * item.quantity - item.discountedAmount}{' '}
                {t('tokens', { count: item.product.price })}
              </Text>
            </Group>
          )}
        </Stack>

        {/* Menu Button */}
        {(onRemove || onDiscount) && (
          <Menu position="bottom-start" shadow="md">
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
