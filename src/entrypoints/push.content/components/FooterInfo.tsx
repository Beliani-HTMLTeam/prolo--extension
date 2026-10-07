import styles from '../push.module.scss';
import { type FooterInfoProps } from '../types/push';

export const FooterInfo = ({ totalRows, campaignTitle }: FooterInfoProps) => {
  return (
    <div className={styles.footerInfo}>
      <span>Total rows: {totalRows}</span>
      <span>Campaign: {campaignTitle}</span>
    </div>
  );
};
