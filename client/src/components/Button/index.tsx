import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    color?: 'success' | 'danger' | 'warning' | 'info' | 'primary';
    fullHeight?: boolean,
    fullWidth?: boolean
}

const Button = ({children, onClick, color = 'primary', fullHeight = false, fullWidth = false} : ButtonProps) => {
   const buttonClasses = [
    styles.button,
    styles[`button--${color}`],
    fullHeight ? styles['button--full-height'] : '',
    fullWidth ? styles['button--full-width'] : ''
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