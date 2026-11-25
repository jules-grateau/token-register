import React from 'react';
import type { CartItemType } from 'shared-ts';
import { Group, Text, Menu, ActionIcon, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import {
  IconDiscount,
  IconDotsVertical,
  IconMinus,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import { useCurrency } from '../../../hooks/useCurrency';

interface CartItemProps {
  item: CartItemType;
  onRemove?: () => void;
  onDiscount?: (item: CartItemType) => void;
  onQuantityChange?: (item: CartItemType, quantity: number) => void;
  /** Read-only lines: prefix the name with the quantity, "2 × Name" (D-023). */
  showQuantity?: boolean;
}

// docs/design/components.md, "Ligne de panier".
const CartItem: React.FC<CartItemProps> = ({
  item,
  onRemove,
  onDiscount,
  onQuantityChange,
  showQuantity = false,
}) => {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const calcPrice = item.product.price * item.quantity - item.discountedAmount;
  const name = showQuantity
    ? t('order_line', { quantity: item.quantity, name: item.product.name })
    : item.product.name;
  const hasActions = !!(onQuantityChange || onRemove || onDiscount);

  return (
    <Stack gap="xs" py="xs">
      {/* A price is never truncated, a name is never cut: the name wraps. */}
      <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
        <Text fw={600} size="md" flex={1} miw={0} style={{ overflowWrap: 'anywhere' }}>
          {name}
        </Text>
        <Stack gap={2} align="flex-end" style={{ flex: 'none' }}>
          <Text
            fw={700}
            size="md"
            style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}
          >
            {format(calcPrice)}
          </Text>
          {item.discountedAmount > 0 && (
            <Group gap={4} wrap="nowrap" c="var(--color-success)" data-testid="cart-item-discount">
              <IconDiscount size={16} aria-hidden />
              <Text
                size="sm"
                fw={600}
                c="var(--color-success)"
                style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}
              >
                {format(-item.discountedAmount)}
              </Text>
            </Group>
          )}
        </Stack>
      </Group>

      {hasActions && (
        <Group justify="space-between" wrap="nowrap" gap="sm">
          {onQuantityChange ? (
            <Group gap="xs" wrap="nowrap">
              <ActionIcon
                size={44}
                radius={14}
                variant="light"
                // D-062: at 1, "−" removes the line (with its discount).
                onClick={() => onQuantityChange(item, -1)}
                aria-label={t('minus')}
              >
                <IconMinus size={20} />
              </ActionIcon>
              <Text
                fz={18}
                fw={800}
                miw={32}
                ta="center"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {item.quantity}
              </Text>
              <ActionIcon
                size={44}
                radius={14}
                variant="filled"
                onClick={() => onQuantityChange(item, 1)}
                aria-label={t('plus')}
              >
                <IconPlus size={20} />
              </ActionIcon>
            </Group>
          ) : (
            <span />
          )}

          {(onRemove || onDiscount) && (
            <Menu position="bottom-end" width={220} radius={14}>
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size={44}
                  radius={14}
                  aria-label={t('cart_item_actions')}
                >
                  <IconDotsVertical size={20} color="var(--color-text-2)" />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {onDiscount && (
                  <Menu.Item
                    py="md"
                    fz="md"
                    leftSection={<IconDiscount size={20} color="var(--color-success)" />}
                    onClick={() => onDiscount(item)}
                  >
                    {t('apply_discount')}
                  </Menu.Item>
                )}
                {onRemove && (
                  <Menu.Item
                    py="md"
                    fz="md"
                    color="red"
                    leftSection={<IconTrash size={20} />}
                    onClick={onRemove}
                  >
                    {t('delete')}
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      )}
    </Stack>
  );
};

export default CartItem;
