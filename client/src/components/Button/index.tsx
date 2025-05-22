import React, { forwardRef }from 'react';
import type { Ref } from 'react';
import styles from './Button.module.css';

interface ButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    color?: 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'secondary' | 'secondary-light';
    fullHeight?: boolean,
    fullWidth?: boolean,
}

const Button = ({children, onClick, color = 'primary', fullHeight = false, fullWidth = false} : ButtonProps, ref : Ref<HTMLButtonElement>) => {
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
      ref={ref}
    >
      {children}
    </button>
  );
};

export default forwardRef(Button);