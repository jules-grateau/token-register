import React from 'react';
import styles from './Modal.module.css';
import Button from '../Button';
import { useTranslation } from 'react-i18next';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 id={'modal-title'} className={styles.modalTitle}>
            {title}
          </h2>
        </div>
        <div className={styles.modalBody}>{children}</div>
        <div className={styles.modalFooter}>
          {footer}
          {!footer && (
            <Button onClick={onClose} color="danger">
              {' '}
              {t('close')}{' '}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
