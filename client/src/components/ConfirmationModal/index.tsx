import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Group, Stack } from '@mantine/core';
import classes from './ConfirmationModal.module.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string;
  extraFooter?: React.ReactNode;
  /** Deletion: the confirm button is filled red instead of ink (D-050). */
  destructive?: boolean;
  /** Phone forms (discount): full screen like the other form modals. Confirmations stay centered. */
  fullScreen?: boolean;
  /** Request in progress: both buttons are disabled, the confirm one shows a loader (no double tap). */
  loading?: boolean;
}

// docs/design/components.md, "Modales (hors encaissement)": "Annuler" on the left, the main
// action on the right (D-050), buttons >= 44 px, 8 px apart.
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmButtonText,
  cancelButtonText,
  extraFooter,
  destructive = false,
  fullScreen = false,
  loading = false,
}) => {
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={title || t('confirm_operation')}
      centered
      fullScreen={fullScreen}
      closeButtonProps={{ size: 44, 'aria-label': t('close') }}
    >
      <Stack>
        {children}
        {extraFooter}
        <Group grow gap={8} mt="md">
          <Button onClick={onClose} variant="default" size="md" h={44} disabled={loading}>
            {cancelButtonText || t('cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            size="md"
            h={44}
            loading={loading}
            color={destructive ? 'red' : undefined}
            data-destructive={destructive || undefined}
            className={destructive ? classes.destructive : undefined}
          >
            {confirmButtonText || t('confirm')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default ConfirmationModal;
