import React from 'react';
import styles from './ClickableCard.module.css';

interface ClickableCardProps {
  title: string;
  onClick: () => void;
  children?: React.ReactNode;
}

export const ClickableCard: React.FC<ClickableCardProps> = ({ title, onClick, children }) => {
  return (
    <button className={styles.clickableCard} onClick={() => onClick()}>
      <span className={styles.cardTitle}>{title}</span>
      {children}
    </button>
  );
};

export default ClickableCard;
