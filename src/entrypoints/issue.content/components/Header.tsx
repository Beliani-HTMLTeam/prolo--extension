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
  issueDate?: string;
  dueDate?: Date | null;
  dueDateName?: string | null;
  issueCreatedAt?: string;
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
  issueDate,
  dueDate,
  dueDateName,
  issueCreatedAt,
}: HeaderProps) => {
  let calendarDate: Date | null = null;
  if (dueDate) {
    calendarDate = dueDate;
  } else if (issueDate) {
    const parts = issueDate.split('.');
    if (parts.length === 3) {
      calendarDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
  }

  const getCalendarDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  };

  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <IssueInfo title={issueTitle} description={issueDescription} />
        <div className={styles.deadlineAndActions}>
          {dueDate && (
            <div className={styles.deadlineWrapper}>
              <div className={styles.deadlineInfo}>
                <span className={styles.deadlineName}>{dueDateName}:</span>
                <span className={styles.deadlineDate}>
                  {dueDate.toLocaleDateString('pl-PL')}
                </span>
              </div>
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const due = new Date(dueDate);
                due.setHours(0, 0, 0, 0);
                const created = new Date(issueCreatedAt || new Date());
                created.setHours(0, 0, 0, 0);

                const totalTime = due.getTime() - created.getTime();
                const remainingTime = due.getTime() - today.getTime();
                
                const totalDays = Math.ceil(totalTime / (1000 * 60 * 60 * 24));
                const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
                
                let progressValue = 0;
                if (totalDays > 0) {
                  progressValue = Math.max(0, Math.min(100, ((totalDays - remainingDays) / totalDays) * 100));
                }

                const isOverdue = remainingDays < 0;
                
                return (
                  <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                      <div 
                        className={`${styles.progressFill} ${isOverdue ? styles.progressOverdue : ''} ${remainingDays <= 2 && !isOverdue ? styles.progressWarning : ''}`}
                        style={{ width: `${isOverdue ? 100 : progressValue}%` }}
                      />
                    </div>
                    <span className={styles.progressText}>
                      {isOverdue 
                        ? `Overdue by ${Math.abs(remainingDays)} days` 
                        : `${remainingDays} days left`}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {calendarDate && (
            <div className={styles.actionsRow}>
              {(() => {
                const dateStr = getCalendarDateString(calendarDate);
                const endDate = new Date(calendarDate);
                endDate.setDate(endDate.getDate() + 1);
                const endDateStr = getCalendarDateString(endDate);
                const titleForCal = issueTitle.split('\n')[0].trim();
                const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titleForCal)}&dates=${dateStr}/${endDateStr}&details=${encodeURIComponent(window.location.href)}`;
                
                return (
                  <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className={styles.actionBtn}>
                    <Icon icon="mdi:calendar-plus" width="18" />
                    <span>Add to Calendar</span>
                  </a>
                );
              })()}
            </div>
          )}
        </div>
      </div>

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
            <span title={`${checkpointsTotal - checkpointsDone} missing banners`} className={styles.metaBadge}>
              <Icon icon="mdi:checkbox-marked-outline" width="13" />
              Campaign Banners: {checkpointsDone}/{checkpointsTotal}
            </span>
          )}
          {status && <span className={`${styles.metaBadge} ${styles[`status--${status}`]}`}>{status}</span>}
        </div>
      </div>
    </div>
  );
};

export default Header;
