import { Icon } from '@iconify/react';
import formStyles from '@/assets/styles/forms.module.scss';
import clsx from 'clsx';

type ActionButtonProps = {
  label: string;
  icon?: string;
  onClick: (e?: any) => void;
  variant?: 'primary' | 'ghost' | 'planning';
  span?: boolean;
  copied?: boolean;
  disabled?: boolean;
  additionalClasses?: string | string[];
};

const ActionButton = ({
  label,
  icon,
  onClick,
  disabled,
  variant,
  span,
  copied,
  additionalClasses,
}: ActionButtonProps) => (
  <button
    className={clsx(
      formStyles.btn,
      variant && formStyles[`btn--${variant}`],
      span && formStyles.span2,
      additionalClasses,
    )}
    onClick={onClick}
    disabled={disabled}
  >
    {icon && <Icon icon={copied ? 'mdi:check' : icon} width="14" height="14" />}
    {copied ? 'Copied!' : label}
  </button>
);

export default ActionButton;
