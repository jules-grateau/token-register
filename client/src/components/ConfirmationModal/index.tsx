import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Group, Stack } from '@mantine/core';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string;
  extraFooter?: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmButtonText,
  cancelButtonText,
  extraFooter,
}) => {
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal opened={isOpen} onClose={onClose} title={title || t('confirm_operation')} centered>
      <Stack>
        {children}
        {extraFooter}
        <Group grow mt="md">
          <Button onClick={handleConfirm}>{confirmButtonText || t('confirm')}</Button>
          <Button onClick={onClose} color="red" variant="outline">
            {cancelButtonText || t('cancel')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default ConfirmationModal;
