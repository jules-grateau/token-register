import React from 'react';
import { Box, Text, Center } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface NewCategoryButtonProps {
  onClick: () => void;
}

export const NewCategoryButton: React.FC<NewCategoryButtonProps> = ({ onClick }) => {
  const { t } = useTranslation();

  return (
    <Box
      onClick={onClick}
      p="md"
      w="100%"
      role="button"
      tabIndex={0}
      aria-label={t('category_management.new')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="new-category-button"
      style={{
        cursor: 'pointer',
        borderRadius: '4px',
        border: '2px dashed var(--mantine-color-default-border)',
        transition: 'all 0.2s',
      }}
    >
      <Center>
        <IconPlus size={18} style={{ marginRight: '8px' }} />
        <Text fw={600} size="sm">
          {t('category_management.new')}
        </Text>
      </Center>
    </Box>
  );
};

export default NewCategoryButton;
