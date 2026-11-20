import React, { useId, useState } from 'react';
import { Button, Group, Input, SimpleGrid, Text, UnstyledButton } from '@mantine/core';
import { IconBan, IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { CatalogIconKey } from 'shared-ts';
import { CATALOG_ICON_KEYS, getCatalogIcon, isCatalogIconKey } from '../../config/catalogIcons';
import { useLayoutMode } from '../../hooks/useLayoutMode';
import CatalogTile from './CatalogTile';
import classes from './CatalogIcon.module.css';

interface CatalogIconPickerProps {
  value: CatalogIconKey | null;
  onChange: (value: CatalogIconKey | null) => void;
  /**
   * Product form: name used by the preview, which shows the initial without icon (D-046).
   * Missing (category form): no preview tile without icon, a category shows its name only (D-047).
   */
  previewName?: string;
  /** Product with a negative price: the preview is the deposit tile (D-046). */
  isDeposit?: boolean;
}

/**
 * Icon field of the product and category forms: docs/design/icons.md, "Sélecteur d'icône".
 * A preview + a button that unfolds the grid inline (no second modal), "Aucune" first.
 */
export const CatalogIconPicker: React.FC<CatalogIconPickerProps> = ({
  value,
  onChange,
  previewName,
  isDeposit = false,
}) => {
  const { t } = useTranslation();
  const mode = useLayoutMode();
  const [isOpen, setIsOpen] = useState(false);
  const gridId = useId();
  const labelId = useId();
  const selected = isCatalogIconKey(value) ? value : null;
  const showPreviewTile = previewName !== undefined || selected !== null;

  return (
    <Input.Wrapper label={t('icon_picker.label')} labelProps={{ id: labelId }}>
      <Group gap="sm" wrap="nowrap" mt={4}>
        {showPreviewTile && (
          <CatalogTile icon={selected} name={previewName ?? ''} isDeposit={isDeposit} />
        )}
        <Text size="md" fw={600} flex={1} miw={0} data-testid="icon-picker-current">
          {selected ? t(`catalog_icons.${selected}`) : t('icon_picker.none')}
        </Text>
        <Button
          variant="light"
          h={44}
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls={gridId}
          style={{ flex: 'none' }}
        >
          {isOpen ? t('icon_picker.hide') : t('icon_picker.choose')}
        </Button>
      </Group>

      {isOpen && (
        <SimpleGrid
          id={gridId}
          role="group"
          aria-labelledby={labelId}
          cols={mode === 'phone-portrait' ? 5 : 7}
          spacing={8}
          verticalSpacing={8}
          mt="sm"
          pt={6}
          pr={6}
        >
          <UnstyledButton
            className={`${classes.option} ${classes.none}`}
            aria-pressed={selected === null}
            onClick={() => onChange(null)}
          >
            <IconBan size={20} aria-hidden />
            {t('icon_picker.none')}
            {selected === null && (
              <span className={classes.check} aria-hidden>
                <IconCheck size={14} />
              </span>
            )}
          </UnstyledButton>
          {CATALOG_ICON_KEYS.map((key) => {
            const IconComponent = getCatalogIcon(key)!;
            const label = t(`catalog_icons.${key}`);
            const isSelected = selected === key;
            return (
              <UnstyledButton
                key={key}
                className={classes.option}
                aria-pressed={isSelected}
                aria-label={label}
                title={label}
                onClick={() => onChange(key)}
              >
                <IconComponent size={26} stroke={2} aria-hidden />
                {isSelected && (
                  <span className={classes.check} aria-hidden>
                    <IconCheck size={14} />
                  </span>
                )}
              </UnstyledButton>
            );
          })}
        </SimpleGrid>
      )}
    </Input.Wrapper>
  );
};

export default CatalogIconPicker;
