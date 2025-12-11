import React from 'react';
import type { CartItemType } from 'shared-ts';
import { Group, Text, Menu, Paper, ActionIcon, Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconDotsVertical, IconDiscount2 } from '@tabler/icons-react';

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
    <Paper p={0} m={0} radius="sm" bg="transparent">
      <Group justify="flex-end" gap="sm" wrap="nowrap">
        <Group gap="xs" style={{ flex: 1 }} wrap="nowrap">
          <Text fw={600} size="sm" c="yellow" truncate>
            {item.product.name}
          </Text>
          <Text size="sm" c="dimmed">
            x{item.quantity}
          </Text>
        </Group>

        <Group gap={0} justify="flex-end" wrap="nowrap">
          {item.discountedAmount > 0 && (
            <Badge
              leftSection={<IconDiscount2 size={14} />}
              variant="outline"
            >{`-${item.discountedAmount}`}</Badge>
          )}
          <Text fw={600} size="sm" c={item.discountedAmount > 0 ? 'teal.8' : undefined}>
            {item.product.price * item.quantity - item.discountedAmount}{' '}
            {t('tokens', { count: item.product.price })}
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
