import { Icon } from '@iconify/react';
import clsx from 'clsx';
import styles from '../../styles/FamilyTable.module.scss';

export const StatusIcon = ({ status, iconOverride }: { status: number; iconOverride?: string }) => {
  // status: 0 = not done, 1 = done, 2 = pending/changing

  const getIcon = () => {
    if (iconOverride) return iconOverride;
    if (status === 1) return 'charm:circle-tick';
    if (status === 2) return 'charm:circle-minus';
    return 'charm:circle-cross';
  };

  return (
    <Icon
      icon={getIcon()}
      className={clsx(styles.icon, {
        [styles.done]: status === 1,
        [styles.pending]: status === 2,
        [styles.missing]: status === 0,
      })}
    />
  );
};
