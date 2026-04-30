import { PlanningButtonProps } from '@/entrypoints/newtab/types/Planning';
import styles from '../../styles/forms.module.scss';
import { Icon } from '@iconify/react';
import clsx from 'clsx';

const PlanningButton = ({ isPrimary, onClick, disabled, icon, label }: PlanningButtonProps) => {
  const buttonClass = isPrimary ? styles['btn--primary'] : styles['btn--ghost'];

  return (
    <button className={clsx(styles.btn, buttonClass)} onClick={onClick} disabled={disabled}>
      {icon && <Icon icon={icon} />}
      {label}
    </button>
  );
};

export default PlanningButton;
