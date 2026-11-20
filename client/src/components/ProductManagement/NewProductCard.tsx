import React from 'react';
import { Card, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useLayoutMode } from '../../hooks/useLayoutMode';
import { CARD_MIN_HEIGHT, CARD_PADDING } from '../Catalog/ProductList/ProductCard';
import classes from '../Catalog/ProductList/ProductCard/ProductCard.module.css';

interface NewProductCardProps {
  onClick: () => void;
}

// docs/design/components.md, "Nouveau produit": same size as a product card, never cut.
export const NewProductCard: React.FC<NewProductCardProps> = ({ onClick }) => {
  const { t } = useTranslation();
  const mode = useLayoutMode();
  const isDesktop = mode === 'desktop';

  return (
    <Card
      withBorder
      radius="lg"
      p={0}
      h="auto"
      mih={CARD_MIN_HEIGHT[mode]}
      className={classes.newCard}
    >
      <UnstyledButton
        onClick={onClick}
        className={classes.main}
        flex={1}
        p={CARD_PADDING[mode]}
        aria-label={t('product_management.new')}
      >
        <Stack gap="xs" align="center" justify="center" h="100%">
          <IconPlus size={isDesktop ? 48 : 32} stroke={1.5} color="var(--color-icon-accent)" />
          <Text fw={700} size={isDesktop ? 'lg' : 'md'} ta="center">
            {t('product_management.new')}
          </Text>
        </Stack>
      </UnstyledButton>
    </Card>
  );
};

export default NewProductCard;
