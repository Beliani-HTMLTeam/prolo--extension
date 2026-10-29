import type { ReactNode } from 'react';
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
  issueDate?: string;
  dueDate?: Date | null;
  dueDateName?: string | null;
  dueDateText?: string | null;
  issueCreatedAt?: string;
  tags?: string[];
  progress?: ReactNode;
  links?: ReactNode;
  action?: ReactNode;
  deadlineOnPreviousFriday?: boolean;
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
  issueDate,
  dueDate,
  dueDateName,
  dueDateText,
  issueCreatedAt,
  tags = [],
  progress,
  links,
  action,
  deadlineOnPreviousFriday = false,
}: HeaderProps) => {
  let titleDate: Date | null = null;
  if (issueDate) {
    const parts = issueDate.split('.');
    if (parts.length === 3) {
      titleDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
  }

  let titleDeadline = titleDate;
  if (titleDate && deadlineOnPreviousFriday) {
    const back = ((titleDate.getDay() - 5 + 7) % 7) || 7;
    titleDeadline = new Date(titleDate.getFullYear(), titleDate.getMonth(), titleDate.getDate() - back);
  }

  const calendarDate = dueDate ?? titleDate;
  // date shown in the deadline box: due date field, or the date from the issue title (newsletters, banners)
  // unless the due date field holds free text, which is then shown as-is
  const deadlineDate = dueDate ?? (dueDateText ? null : titleDeadline);
  const deadlineName = dueDate || dueDateText ? dueDateName : 'Deadline';

  const getCalendarDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  };

  return (
    <div className={styles.header}>
      <div className={styles.topRow}>
        <IssueInfo
          title={issueTitle}
          description={issueDescription}
          badges={
            <>
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
              {status && <span className={`${styles.metaBadge} ${styles[`status--${status}`]}`}>{status}</span>}
            </>
          }
        />
        {action && <div className={styles.topActions}>{action}</div>}
      </div>

      <div className={styles.deadlineAndActions}>
          {!deadlineDate && dueDateText && (
            <div className={styles.deadlineWrapper}>
              <div className={styles.deadlineInfo}>
                <span className={styles.deadlineName}>{deadlineName}</span>
              </div>
              <span className={styles.deadlineText} title={dueDateText}>
                {dueDateText}
              </span>
            </div>
          )}

          {deadlineDate && (
            <div className={styles.deadlineWrapper}>
              <div className={styles.deadlineInfo}>
                <span className={styles.deadlineName}>{deadlineName}</span>
                <span className={styles.deadlineDate}>
                  {deadlineDate.toLocaleDateString('pl-PL')}
                </span>
              </div>
              {dueDateText && (
                <span className={styles.deadlineText} title={dueDateText}>
                  {dueDateText}
                </span>
              )}
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const due = new Date(deadlineDate);
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
          {progress}
          {links}

          <div className={styles.stripMeta}>
            {issueTypes.length > 0 && (
              <div className={styles.headerCard}>
                <span className={styles.headerCardLabel}>Type</span>
                <div className={styles.headerCardBody}>
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
              </div>
            )}
            {tags.length > 0 && (
              <div className={styles.headerCard}>
                <span className={styles.headerCardLabel}>Tags</span>
                <div className={styles.headerCardBody}>
                  {tags.map(tag => (
                    <span key={`tag-${tag}`} className={styles.typeTag} title="Newsletter TAG">
                      <Icon icon="mdi:tag-outline" width="11" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(solvingUserName || boardColumnName) && (
              <div className={styles.headerCard}>
                <span className={styles.headerCardLabel}>Owner</span>
                <div className={styles.headerCardBody}>
                  {solvingUserName && (
                    <span className={styles.plainMeta}>
                      <Icon icon="mdi:account-outline" width="13" />
                      {solvingUserName}
                    </span>
                  )}
                  {boardColumnName && (
                    <span className={styles.plainMeta}>
                      <Icon icon="mdi:view-column-outline" width="13" />
                      {boardColumnName}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default Header;
