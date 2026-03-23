import styles from '../styles/header.module.scss';

type IssueInfoProps = {
  title: string;
  description: string;
};

const IssueInfo = ({ title, description }: IssueInfoProps) => {
  return (
    <div className={styles.info}>
      <span id={styles.issueId}>{title || 'Issue'}</span>
      <span id={styles.issueTitle}>{description}</span>
    </div>
  );
};

export default IssueInfo;
