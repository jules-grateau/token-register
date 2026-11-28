import React from 'react';
import { Modal } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { isPhoneMode, useLayoutMode } from '../../hooks/useLayoutMode';
import ChangePasswordForm from './ChangePasswordForm';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ⚙️ "Changer mon mot de passe" (D-063 point 9, D-064): the current password, then the new one
 * twice. The other sessions of the account are closed, this one is kept (answer 4 a).
 */
const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const isPhone = isPhoneMode(useLayoutMode());
  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={t('auth.change_password.title')}
      centered
      fullScreen={isPhone}
      closeButtonProps={{ size: 44, 'aria-label': t('close') }}
    >
      {/* Mounted only while open: the fields are empty at each opening. */}
      {isOpen && (
        <ChangePasswordForm
          variant="own"
          autoFocus
          onSuccess={() => {
            toast.success(t('auth.change_password.done'));
            onClose();
          }}
        />
      )}
    </Modal>
  );
};

export default ChangePasswordModal;
