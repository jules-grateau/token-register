import { Button, Group, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface NewCategoryButtonProps {
  onClick: () => void;
}

function NewCategoryButton({ onClick }: NewCategoryButtonProps): React.ReactElement {
  const { t } = useTranslation();

  // Column of tabs (tablet >= 768, desktop): rounded like the tab rows (--radius-control), dashed
  // like "Nouveau produit" (docs/design/components.md, "Onglets catégorie").
  return (
    <Button
      onClick={onClick}
      variant="default"
      radius="md"
      w="100%"
      h="auto"
      mih={60}
      aria-label={t('category_management.new')}
      styles={{
        root: {
          border: '1.5px dashed var(--color-border-strong)',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        },
      }}
    >
      <Group gap="sm" justify="center">
        <IconPlus size={24} stroke={1.5} color="var(--color-icon-accent)" />
        <Text fw={600} size="md">
          {t('category_management.new')}
        </Text>
      </Group>
    </Button>
  );
}

export default NewCategoryButton;
