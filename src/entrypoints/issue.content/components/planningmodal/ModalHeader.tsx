import { Icon } from '@iconify/react';
import formStyles from '../../styles/forms.module.scss';

type ModalHeaderProps = {
  title: string;
  onClose: () => void;
};

export const ModalHeader = ({ title, onClose }: ModalHeaderProps) => (
  <div className={formStyles.modalHeader}>
    <h2>{title}</h2>
    <button className={formStyles.closeBtn} onClick={onClose}>
      <Icon icon="mdi:close" width="20" height="20" />
    </button>
  </div>
);
