import React from 'react';
import { Button, Stack, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface NewProductCardProps {
  onClick: () => void;
}

export const NewProductCard: React.FC<NewProductCardProps> = ({ onClick }) => {
  const { t } = useTranslation();

  return (
    <Button
      onClick={onClick}
      h={{ base: 100, md: 200 }}
      variant="default"
      radius="sm"
      p="lg"
      aria-label={t('product_management.new')}
      styles={{
        root: { borderStyle: 'dashed' },
        label: { whiteSpace: 'normal', height: '100%' },
        inner: { height: '100%' },
      }}
    >
      <Stack gap="sm" align="center" justify="center">
        <IconPlus size={48} stroke={1.5} />
        <Text fw={700} size="lg" ta="center">
          {t('product_management.new')}
        </Text>
      </Stack>
    </Button>
  );
};

export default NewProductCard;
