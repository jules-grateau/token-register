import React from 'react';
import Modal from '../Modal'; // Assuming Modal.tsx is in 'client/src/components/Modal'
import Button from '../Button'; // Assuming Button.tsx is in 'client/src/components/Button'
import { useTranslation } from 'react-i18next';
import styles from './ConfirmationModal.module.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;       // Called when the modal should be dismissed (e.g., overlay click, 'X' button, or after confirm/cancel)
  onConfirm: () => void;     // Called when the "Confirm" button is clicked
  title: string;
  children: React.ReactNode; // Optional additional content to display below the message
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

  const footerContent = (
    <>
        {extraFooter}
        <div className={styles.confirmationFooterButtons}>
        <Button onClick={handleConfirm} color={'success'} fullWidth>
            {confirmButtonText || t('confirm')}
        </Button>
                <Button onClick={onClose} color={'danger'} fullWidth>
            {cancelButtonText || t('cancel')}
        </Button>
        </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || t('confirm_operation')}
      footer={footerContent}
    >
      {children}
    </Modal>
  );
};

export default ConfirmationModal;