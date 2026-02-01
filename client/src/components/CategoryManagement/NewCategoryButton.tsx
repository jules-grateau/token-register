import { Button, Group, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface NewCategoryButtonProps {
  onClick: () => void;
}

function NewCategoryButton({ onClick }: NewCategoryButtonProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Button
      onClick={onClick}
      variant="default"
      radius={0}
      w="100%"
      h={60}
      aria-label={t('category_management.new')}
      styles={{
        root: { borderStyle: 'dashed' },
      }}
    >
      <Group gap="sm" justify="center">
        <IconPlus size={24} stroke={1.5} />
        <Text fw={600} size="md">
          {t('category_management.new')}
        </Text>
      </Group>
    </Button>
  );
}

export default NewCategoryButton;
