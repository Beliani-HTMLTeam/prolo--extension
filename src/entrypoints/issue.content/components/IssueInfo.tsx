import type { ReactNode } from 'react';
import styles from '../styles/header.module.scss';

type IssueInfoProps = {
  title: string;
  description: string;
  badges?: ReactNode;
};

const IssueInfo = ({ title, description, badges }: IssueInfoProps) => {
  return (
    <div className={styles.info}>
      <div className={styles.titleLine}>
        <span id={styles.issueId}>{title || 'Issue'}</span>
        {badges}
      </div>
      <span id={styles.issueTitle}>{description}</span>
    </div>
  );
};

export default IssueInfo;
