import { useState, useEffect } from 'react';

import styles from "./SwitchActions.module.css";

export const SwitchActions = ({ data = [], value, onChange }) => {
  const [currentValue, setCurrentValue] = useState(value || data[0]?.value);

  useEffect(() => {
    if (onChange) {
      onChange(currentValue);
    }
  }, [currentValue]);

  if (data.length === 0) return null;

  return <div className={styles.switch}>
    {data.map(({ text, value }) => <span key={value} onClick={() => setCurrentValue(value)} className={`${styles.switchItem} ${currentValue === value ? styles.switchActive : ""}`}>{text}</span>)}
  </div>
}