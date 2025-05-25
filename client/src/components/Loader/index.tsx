import React from 'react';
import styles from './Loader.module.css'; // CSS remains the same

interface Loader {
  isLoading: boolean;
  text?: string;
}

const Loader: React.FC<Loader> = ({
  isLoading,
  text, 
}) => {
  if (!isLoading) {
    return
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.spinner}></div>
        {text && <p className={styles.text}>{text}</p>}
      </div>
    </div>
  );
};

export default Loader;