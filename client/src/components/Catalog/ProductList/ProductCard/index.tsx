import React from 'react';
import type { ProductType } from 'shared-ts';
import { useTranslation } from 'react-i18next';
import { Text, Stack, Group, Card, UnstyledButton, ActionIcon } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useCurrency } from '../../../../hooks/useCurrency';
import { useLayoutMode, type LayoutMode } from '../../../../hooks/useLayoutMode';
import classes from './ProductCard.module.css';

// docs/design/spacing-layout.md: card min height and padding per layout mode.
export const CARD_MIN_HEIGHT: Record<LayoutMode, number> = {
  'phone-portrait': 96,
  'phone-landscape': 72,
  tablet: 120,
  desktop: 200,
};
export const CARD_PADDING: Record<LayoutMode, 'xs' | 'sm' | 'lg'> = {
  'phone-portrait': 'sm',
  'phone-landscape': 'xs',
  tablet: 'sm',
  desktop: 'lg',
};

interface ProductCardProps {
  product: ProductType;
  onClick: () => void;
  isEditMode?: boolean;
  onEdit?: (product: ProductType) => void;
  onDelete?: (product: ProductType) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClick,
  isEditMode = false,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const mode = useLayoutMode();
  // Phone landscape: compact cards, so that 8 to 9 products fit (docs/design).
  const isCompact = mode === 'phone-landscape';
  const lineHeight = isCompact ? 1.25 : undefined;

  // D-022: in edit mode, touching the card opens its edit form.
  const handleMainClick = () => (isEditMode ? onEdit?.(product) : onClick());

  return (
    <Card withBorder radius="sm" p={0} h="auto" mih={CARD_MIN_HEIGHT[mode]}>
      <UnstyledButton
        onClick={handleMainClick}
        className={classes.main}
        flex={1}
        p={CARD_PADDING[mode]}
        aria-label={t(isEditMode ? 'product_card.edit' : 'product_card.add', {
          name: product.name,
        })}
      >
        <Stack gap={isCompact ? 4 : 'xs'} align="center" justify="center" h="100%">
          {/* D-021: a name is never cut, the card grows. A price never wraps. */}
          <Text
            fw={700}
            size={mode === 'desktop' ? 'lg' : 'md'}
            ta="center"
            lh={lineHeight}
            style={{ overflowWrap: 'anywhere' }}
          >
            {product.name}
          </Text>
          {product.price !== undefined && (
            <Text fw={700} size="lg" lh={lineHeight} style={{ whiteSpace: 'nowrap' }}>
              {format(product.price)}
            </Text>
          )}
        </Stack>
      </UnstyledButton>

      {isEditMode && (
        <Group
          gap={0}
          grow
          h={48}
          wrap="nowrap"
          style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
        >
          <ActionIcon
            variant="subtle"
            radius={0}
            h={48}
            onClick={() => onEdit?.(product)}
            aria-label={t('actions.edit')}
            style={{ borderRight: '1px solid var(--mantine-color-default-border)' }}
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
            <IconTrash size={22} color="var(--mantine-color-red-6)" />
          </ActionIcon>
        </Group>
      )}
    </Card>
  );
};

export default ProductCard;
