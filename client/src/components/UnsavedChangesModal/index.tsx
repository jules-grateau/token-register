import React, { useState } from 'react';
import { Modal, Button, Group, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { isPhoneMode, useLayoutMode } from '../../hooks/useLayoutMode';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  /** "Annuler", Escape, the cross or a click outside: back to the form (D-052). */
  onKeepEditing: () => void;
  /** "Ne pas enregistrer": close the form, the changes are lost. */
  onDiscard: () => void;
  /** "Enregistrer": submit the form (validation included). */
  onSave: () => void;
}

/**
 * Asked when a product / category form is closed with changes (D-052).
 * docs/design/components.md, "Modales (hors encaissement)": centered confirmation, never full
 * screen, "Annuler" on the left and the main action on the right (D-050).
 */
const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onKeepEditing,
  onDiscard,
  onSave,
}) => {
  const { t } = useTranslation();
  const isPhone = isPhoneMode(useLayoutMode());

  // Same weight on the three buttons, whatever the variant (DS-2 of PR #45).
  const buttons = (
    <>
      <Button variant="default" h={44} fw={600} onClick={onKeepEditing}>
        {t('cancel')}
      </Button>
      <Button variant="light" color="red" h={44} fw={600} onClick={onDiscard}>
        {t('unsaved_changes.discard')}
      </Button>
      <Button h={44} fw={600} onClick={onSave}>
        {t('actions.save')}
      </Button>
    </>
  );

  return (
    <Modal
      opened={isOpen}
      onClose={onKeepEditing}
      title={t('unsaved_changes.title')}
      centered
      closeButtonProps={{ size: 44, 'aria-label': t('close') }}
    >
      <Stack>
        <Text>{t('unsaved_changes.message')}</Text>
        {/* 360 px: three buttons do not fit on one line, they stack (main action last). */}
        {isPhone ? (
          <Stack gap={8} mt="md">
            {buttons}
          </Stack>
        ) : (
          <Group justify="flex-end" gap={8} mt="md">
            {buttons}
          </Group>
        )}
      </Stack>
    </Modal>
  );
};

/** Closing logic shared by the product and category forms (D-052). */
export function useUnsavedChangesGuard(hasChanges: () => boolean, onClose: () => void) {
  const [isPromptOpen, setIsPromptOpen] = useState(false);

  return {
    isPromptOpen,
    /** Every way of closing the form goes through here: cross, Escape, outside click, "Annuler". */
    requestClose: () => (hasChanges() ? setIsPromptOpen(true) : onClose()),
    keepEditing: () => setIsPromptOpen(false),
    discard: () => {
      setIsPromptOpen(false);
      onClose();
    },
  };
}

export default UnsavedChangesModal;
