'use client';

import type { CSSProperties } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion, type Transition } from 'motion/react';
import styles from './styles/RecentComments.module.scss';
import { type Comment } from '@/entrypoints/issue.content/api/comments';

export interface IssueWithComments {
  link: string;
  issue: string;
  id: string;
  comments: Comment[];
  totalComments: number;
  recentCommentsCount: number;
  isOther: boolean;
}

interface RecentCommentsProps {
  issues: IssueWithComments[];
  loading?: boolean;
  error?: string | null;
  highlightNewerThan?: number | null;
}

const CARD_SPRING: Transition = { type: 'spring', stiffness: 380, damping: 30 };

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getMarqueeDuration = (title: string): string => {
  const lengthBasedDuration = Math.max(12, Math.min(48, title.length * 0.45));
  return `${lengthBasedDuration}s`;
};

const handleScroll = (event: React.WheelEvent<HTMLDivElement>) => {
  event.preventDefault();
  event.currentTarget.scrollLeft += event.deltaY;
};

export default function RecentComments({
  issues,
  loading = false,
  error = null,
  highlightNewerThan = null,
}: RecentCommentsProps) {
  const recentIssues = issues.filter(issue => issue.recentCommentsCount > 0);

  const sortedIssues = [...recentIssues].sort((a, b) => {
    if (a.isOther !== b.isOther) {
      return a.isOther ? 1 : -1;
    }

    const aLatest = a.comments.reduce((latest, comment) => {
      return new Date(comment.create_date) > new Date(latest.create_date) ? comment : latest;
    }, a.comments[0]);

    const bLatest = b.comments.reduce((latest, comment) => {
      return new Date(comment.create_date) > new Date(latest.create_date) ? comment : latest;
    }, b.comments[0]);

    return new Date(bLatest.create_date).getTime() - new Date(aLatest.create_date).getTime();
  });

  if (loading) {
    return (
      <div className={styles.recentComments}>
        <div className={styles.loading}>Loading recent comments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.recentComments}>
        <div className={styles.error}>Error loading comments: {error}</div>
      </div>
    );
  }

  if (sortedIssues.length === 0) {
    return (
      <div className={styles.recentComments}>
        <div className={styles.noComments}>No recent comments in the last 24 hours</div>
      </div>
    );
  }

  return (
    <aside className={styles.recentCommentsContainer}>
      <motion.div className={styles.scrollWrapper} onWheel={handleScroll} layoutScroll>
        <div className={styles.cardsFlex}>
          <AnimatePresence mode="popLayout">
            {sortedIssues.map((issue, index) => {
              const sortedComments = [...issue.comments].sort(
                (a, b) => new Date(b.create_date).getTime() - new Date(a.create_date).getTime(),
              );
              const marqueeStyle = { '--marquee-duration': getMarqueeDuration(issue.issue) } as CSSProperties & {
                '--marquee-duration': string;
              };

              return (
                <motion.div
                  className={`${styles.issueCard} ${issue.isOther ? styles.isOther : ''}`.trim()}
                  key={issue.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.96 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { ...CARD_SPRING, delay: Math.min(index, 8) * 0.04 },
                  }}
                  exit={{ opacity: 0, scale: 0.9, transition: CARD_SPRING }}
                  whileHover={{ y: -3, transition: CARD_SPRING }}
                  transition={CARD_SPRING}
                >
                  <a href={issue.link} target="_blank" rel="noopener noreferrer" className={styles.issueLink}>
                    <div className={styles.marquee} style={marqueeStyle}>
                      <div className={styles.marquee__item}>{issue.issue}</div>

                      <div className={styles.marquee__item}>{issue.issue}</div>
                    </div>

                    <Icon icon="gg:external" className={styles.externalIcon} />
                  </a>

                  <div className={styles.commentsCount}>
                    <Icon icon="lucide:message-square" />
                    {issue.recentCommentsCount} recent comment
                    {issue.recentCommentsCount !== 1 ? 's' : ''}
                  </div>

                  <div className={styles.commentsList} onWheel={event => event.stopPropagation()}>
                    {sortedComments
                      .filter(comment => comment.comment_type)
                      .map(comment => (
                        <div
                          className={`${styles.commentItem} ${
                            highlightNewerThan !== null && new Date(comment.create_date).getTime() > highlightNewerThan
                              ? styles.isNew
                              : ''
                          }`.trim()}
                          key={comment.id}
                        >
                          <div className={styles.commentMeta}>
                            <span className={styles.commentAuthor}>{comment.full_username}</span>
                            <span className={styles.commentTime}>{formatRelativeTime(comment.create_date)}</span>
                          </div>
                          <p className={styles.commentBody}>
                            {comment.comment.substring(0, 100)}
                            {comment.comment.length > 100 ? '...' : ''}
                          </p>
                        </div>
                      ))}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </aside>
  );
}
