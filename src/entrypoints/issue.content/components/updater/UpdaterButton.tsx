import styles from '@/assets/styles/forms.module.scss';
import { Icon } from '@iconify/react';
import clsx from 'clsx';
import { UpdaterButtonProps } from '@/entrypoints/newtab/types/Updater';

const UpdaterButton = ({ isPrimary, onClick, disabled, icon, label }: UpdaterButtonProps) => {
  const buttonClass = isPrimary ? styles['btn--primary'] : styles['btn--ghost'];

  return (
    <button className={clsx(styles.btn, buttonClass)} onClick={onClick} disabled={disabled}>
      {icon && <Icon icon={icon} />}
      {label}
    </button>
  );
};

export default UpdaterButton;
