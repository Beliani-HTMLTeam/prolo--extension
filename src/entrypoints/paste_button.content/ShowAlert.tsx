import { useState, useEffect } from 'react';
import styles from './ShowAlert.module.scss';

type AlertType = 'danger' | 'success';

type ShowAlertProps = {
  type: AlertType;
  msg: String;
  duration: number;
};

export const ShowAlert = ({ type, msg, duration }: ShowAlertProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return <div className={`${styles.alertContainer} ${styles[type]}`}>{msg}</div>;
};
