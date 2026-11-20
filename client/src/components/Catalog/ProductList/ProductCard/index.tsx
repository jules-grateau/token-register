import React from 'react';
import type { ProductType } from 'shared-ts';
import { useTranslation } from 'react-i18next';
import { Text, Stack, Group, Card, UnstyledButton, ActionIcon, Box } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useCurrency } from '../../../../hooks/useCurrency';
import { useLayoutMode, type LayoutMode } from '../../../../hooks/useLayoutMode';
import CatalogTile from '../../../CatalogIcon/CatalogTile';
import classes from './ProductCard.module.css';

// docs/design/spacing-layout.md: card min height and padding per layout mode.
export const CARD_MIN_HEIGHT: Record<LayoutMode, number> = {
  'phone-portrait': 144,
  'phone-landscape': 72,
  tablet: 144,
  desktop: 160,
};
export const CARD_PADDING: Record<LayoutMode, number> = {
  'phone-portrait': 12,
  'phone-landscape': 8,
  tablet: 12,
  desktop: 12,
};

interface ProductCardProps {
  product: ProductType;
  onClick: () => void;
  isEditMode?: boolean;
  onEdit?: (product: ProductType) => void;
  onDelete?: (product: ProductType) => void;
  /** Quantity of the product's cart line, remise included (D-048). 0: no badge. */
  quantityInCart?: number;
}

// docs/design/components.md, "Carte produit".
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClick,
  isEditMode = false,
  onEdit,
  onDelete,
  quantityInCart = 0,
}) => {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const mode = useLayoutMode();
  // Phone landscape: compact cards in a row, so that 8 to 9 products fit (docs/design).
  const isCompact = mode === 'phone-landscape';
  const isDeposit = product.price < 0;
  // D-048: the badge shows the quantity of the cart line; hidden in edit mode.
  const showBadge = !isEditMode && quantityInCart > 0;

  // D-022: in edit mode, touching the card opens its edit form.
  const handleMainClick = () => (isEditMode ? onEdit?.(product) : onClick());

  const label = isEditMode
    ? t('product_card.edit', { name: product.name })
    : showBadge
      ? t('product_card.add_in_cart', { name: product.name, count: quantityInCart })
      : t('product_card.add', { name: product.name });

  // D-021: a name is never cut, the card grows. A price never wraps.
  const text = (
    <Stack gap={2} miw={0}>
      <Text
        fw={600}
        size={mode === 'desktop' ? 'lg' : 'md'}
        lh={isCompact ? 1.25 : undefined}
        style={{ overflowWrap: 'anywhere' }}
      >
        {product.name}
      </Text>
      <Text
        fw={800}
        fz={isCompact ? 18 : 20}
        lh={isCompact ? 1.25 : undefined}
        className={classes.price}
        data-deposit={isDeposit || undefined}
      >
        {format(product.price)}
      </Text>
    </Stack>
  );

  return (
    <Card
      withBorder
      radius="lg"
      p={0}
      h="auto"
      mih={CARD_MIN_HEIGHT[mode]}
      className={classes.card}
      data-deposit={isDeposit || undefined}
      data-in-cart={showBadge || undefined}
    >
      <UnstyledButton
        onClick={handleMainClick}
        className={classes.main}
        flex={1}
        p={CARD_PADDING[mode]}
        aria-label={label}
      >
        {isCompact ? (
          <Group gap="xs" wrap="nowrap" align="center" h="100%" pr={showBadge ? 24 : 0}>
            <CatalogTile icon={product.icon} name={product.name} isDeposit={isDeposit} size="sm" />
            {text}
          </Group>
        ) : (
          <Stack gap="xs" align="flex-start" justify="space-between" h="100%">
            <CatalogTile icon={product.icon} name={product.name} isDeposit={isDeposit} />
            {text}
          </Stack>
        )}
      </UnstyledButton>

      {showBadge && (
        <Box aria-hidden className={classes.badge} data-testid="product-card-badge">
          {quantityInCart}
        </Box>
      )}

      {isEditMode && (
        <Group
          gap={0}
          grow
          h={48}
          wrap="nowrap"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <ActionIcon
            variant="subtle"
            radius={0}
            h={48}
            onClick={() => onEdit?.(product)}
            aria-label={t('actions.edit')}
            style={{ borderRight: '1px solid var(--color-border)' }}
          >
            <IconEdit size={22} color="var(--color-icon-accent)" />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            radius={0}
            h={48}
            onClick={() => onDelete?.(product)}
            aria-label={t('delete')}
          >
            <IconTrash size={22} color="var(--color-danger)" />
          </ActionIcon>
        </Group>
      )}
    </Card>
  );
};

export default ProductCard;
