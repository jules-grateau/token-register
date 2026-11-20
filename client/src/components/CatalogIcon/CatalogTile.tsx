import React from 'react';
import { Box, Text } from '@mantine/core';
import { DEPOSIT_ICON_KEY, getCatalogIcon, getInitial } from '../../config/catalogIcons';
import classes from './CatalogIcon.module.css';

interface CatalogTileProps {
  /** Stored icon key; null, missing or unknown = no icon. */
  icon?: string | null;
  /** Name of the product: its initial is shown when there is no icon (D-046). */
  name: string;
  /** Negative price: danger tile, deposit icon when none is chosen (D-046). */
  isDeposit?: boolean;
  /** 48 px (phone portrait, tablet, desktop, picker) or 32 px (phone landscape). */
  size?: 'md' | 'sm';
}

const ICON_SIZE = { md: 26, sm: 20 } as const;

/**
 * "Pastille-icône" of a product: docs/design/icons.md. Decorative (aria-hidden): the name and
 * the price carry the information.
 */
export const CatalogTile: React.FC<CatalogTileProps> = ({
  icon,
  name,
  isDeposit = false,
  size = 'md',
}) => {
  const IconComponent =
    getCatalogIcon(icon) ?? (isDeposit ? getCatalogIcon(DEPOSIT_ICON_KEY) : null);

  return (
    <Box
      aria-hidden
      className={classes.tile}
      data-size={size}
      data-deposit={isDeposit || undefined}
      data-testid="catalog-tile"
    >
      {IconComponent ? (
        <IconComponent size={ICON_SIZE[size]} stroke={2} />
      ) : (
        <Text component="span" fz={size === 'sm' ? 16 : 22} fw={800} lh={1} c="inherit">
          {getInitial(name)}
        </Text>
      )}
    </Box>
  );
};

export default CatalogTile;
