import clsx from 'clsx';
import formStyles from '../styles/forms.module.scss';
import { Icon } from '@iconify/react';

type ActionButtonsProps = {
  mode: 'planning' | 'results';
  loading?: boolean;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
  primaryLabel: string;
  secondaryLabel?: string;
  showCopyButton?: boolean;
  onCopyClick?: () => void;
};

export const ActionButtons = ({
  mode,
  loading = false,
  onPrimaryClick,
  onSecondaryClick,
  primaryLabel,
  secondaryLabel = 'Cancel',
  showCopyButton,
  onCopyClick,
}: ActionButtonsProps) => (
  <div className={formStyles.modalButtons}>
    {mode === 'results' && showCopyButton && onCopyClick && (
      <button className={clsx(formStyles.btn, formStyles['btn--primary'])} onClick={onCopyClick}>
        <Icon icon="mdi:content-copy" width="14" height="14" />
        Copy Results
      </button>
    )}
    <button className={clsx(formStyles.btn, formStyles['btn--primary'])} onClick={onPrimaryClick} disabled={loading}>
      <Icon
        icon={loading ? 'mdi:loading' : 'mdi:playlist-plus'}
        width="14"
        height="14"
        className={loading ? formStyles.spinning : ''}
      />
      {primaryLabel}
    </button>
    <button className={clsx(formStyles.btn, formStyles['btn--ghost'])} onClick={onSecondaryClick} disabled={loading}>
      {secondaryLabel}
    </button>
  </div>
);
