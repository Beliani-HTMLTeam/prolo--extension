import { Icon } from '@iconify/react';
import IssueInfo from './IssueInfo';
import styles from '../styles/header.module.scss';
import type { IssueTypeInfo } from '../lib/types';

type HeaderProps = {
  issueTitle: string;
  issueDescription: string;
  issueTypes: IssueTypeInfo[];
  solvingUserName: string;
  status: string;
  priorityName: string;
  priorityColor: string;
  boardColumnName: string;
  checkpointsDone: number;
  checkpointsTotal: number;
};

const Header = ({
  issueTitle,
  issueDescription,
  issueTypes,
  solvingUserName,
  status,
  priorityName,
  priorityColor,
  boardColumnName,
  checkpointsDone,
  checkpointsTotal,
}: HeaderProps) => {
  return (
    <div className={styles.header}>
      <IssueInfo title={issueTitle} description={issueDescription} />

      <div className={styles.meta}>
        {issueTypes.length > 0 && (
          <div className={styles.typeTags}>
            {issueTypes.map(type => (
              <span
                key={type.id}
                className={styles.typeTag}
                style={{ '--type-color': type.color ?? '#ebf5ff' } as React.CSSProperties}
              >
                {type.name}
              </span>
            ))}
          </div>
        )}

        <div className={styles.metaRow}>
          {solvingUserName && (
            <span className={styles.metaBadge}>
              <Icon icon="mdi:account-outline" width="13" />
              {solvingUserName}
            </span>
          )}
          {priorityName &&
            (() => {
              const isHighSeverity = /high|urgent|critical/i.test(priorityName);
              return (
                <span
                  className={`${styles.metaBadge} ${isHighSeverity ? styles.priorityHigh : ''}`}
                  style={
                    isHighSeverity
                      ? { backgroundColor: priorityColor, borderColor: priorityColor }
                      : { borderColor: priorityColor }
                  }
                >
                  <Icon
                    icon={isHighSeverity ? 'mdi:flag' : 'mdi:flag-outline'}
                    width="13"
                    style={isHighSeverity ? {} : { color: priorityColor }}
                  />
                  {priorityName}
                </span>
              );
            })()}
          {boardColumnName && (
            <span className={styles.metaBadge}>
              <Icon icon="mdi:view-column-outline" width="13" />
              {boardColumnName}
            </span>
          )}
          {checkpointsTotal > 0 && (
            <span className={styles.metaBadge}>
              <Icon icon="mdi:checkbox-marked-outline" width="13" />
              {checkpointsDone}/{checkpointsTotal}
            </span>
          )}
          {status && <span className={`${styles.metaBadge} ${styles[`status--${status}`]}`}>{status}</span>}
        </div>
      </div>
    </div>
  );
};

export default Header;
