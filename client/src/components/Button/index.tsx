import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    color?: 'success' | 'danger' | 'warning' | 'info' | 'primary';
    size?: 'small' | 'medium';
    fullHeight?: boolean
}

const Button = ({children, onClick, color = 'primary', fullHeight = false, size = 'medium'} : ButtonProps) => {
   const buttonClasses = [
    styles.button,
    styles[`button--${color}`],
    fullHeight ? styles['button--full-height'] : '',
    styles[`button--${size}`],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={buttonClasses}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;