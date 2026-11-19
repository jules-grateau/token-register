import React from 'react';
import type { ProductType } from 'shared-ts';
import { useTranslation } from 'react-i18next';
import { Text, Stack, Group, Button } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useCurrency } from '../../../../hooks/useCurrency';

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

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(product);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(product);
  };

  return (
    <Button
      onClick={onClick}
      mih={{ base: 100, md: 200 }}
      variant="default"
      radius="sm"
      p={0}
      styles={{
        label: { whiteSpace: 'normal', height: '100%', width: '100%' },
        inner: { height: '100%', width: '100%' },
      }}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <Stack
        gap={0}
        align="center"
        justify="space-between"
        style={{ width: '100%', height: '100%' }}
      >
        <Stack
          gap="sm"
          align="center"
          justify="center"
          p={{ base: 'sm', md: 'lg' }}
          style={{ flex: 1, maxWidth: '100%' }}
        >
          {/* A price is never truncated: the name gives way (2 lines max). */}
          <Text fw={700} size="lg" ta="center" lineClamp={2}>
            {product.name}
          </Text>
          {product.price !== undefined && (
            <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>
              {format(product.price)}
            </Text>
          )}
        </Stack>

        {isEditMode && (
          <Group
            gap={0}
            w="100%"
            grow
            style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
          >
            <Button
              variant="default"
              onClick={handleEdit}
              aria-label={t('actions.edit')}
              radius={0}
              style={{
                flex: 1,
                borderRight: '1px solid var(--mantine-color-default-border)',
                height: '56px',
              }}
            >
              <IconEdit size={20} color="var(--mantine-primary-color-filled)" />
            </Button>
            <Button
              variant="default"
              onClick={handleDelete}
              aria-label={t('delete')}
              radius={0}
              style={{
                flex: 1,
                height: '56px',
              }}
            >
              <IconTrash size={20} color="var(--mantine-color-red-6)" />
            </Button>
          </Group>
        )}
      </Stack>
    </Button>
  );
};

export default ProductCard;
