import styles from '../push.module.scss';

type FooterInfoProps = {
  totalRows: number;
  campaignTitle: string;
};

export const FooterInfo = ({ totalRows, campaignTitle }: FooterInfoProps) => {
  return (
    <div className={styles.footerInfo}>
      <span>Total rows: {totalRows}</span>
      <span>Campaign: {campaignTitle}</span>
    </div>
  );
};