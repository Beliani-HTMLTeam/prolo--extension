'use client';

import { Icon } from '@iconify/react';
import { Comment } from '../../issue.content/api/comments';
import styles from './styles/RecentComments.module.scss';

export interface IssueWithComments {
  link: string;
  issue: string;
  id: string;
  comments: Comment[];
  totalComments: number;
  recentCommentsCount: number;
}

interface RecentCommentsProps {
  issues: IssueWithComments[];
  loading?: boolean;
  error?: string | null;
}

export default function RecentComments({ issues, loading = false, error = null }: RecentCommentsProps) {
  const recentIssues = issues.filter(issue => issue.recentCommentsCount > 0);

  // Sort by latest comment
  const sortedIssues = [...recentIssues].sort((a, b) => {
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
      <div className={styles.scrollWrapper}>
        <div className={styles.cardsFlex}>
          {sortedIssues.map(issue => {
            const sortedComments = [...issue.comments].sort(
              (a, b) => new Date(b.create_date).getTime() - new Date(a.create_date).getTime(),
            );

            return (
              <div className={styles.issueCard} key={issue.id}>
                {/* Issue Title Link */}
                <a href={issue.link} target="_blank" rel="noopener noreferrer" className={styles.issueLink}>
                  {issue.issue.substring(0, 50) + (issue.issue.length > 50 ? '...' : '')}
                  <Icon icon="gg:external" className={styles.externalIcon} />
                </a>

                {/* Comments Meta */}
                <div className={styles.commentsCount}>
                  <Icon icon="lucide:message-square" />
                  {issue.recentCommentsCount} recent comment
                  {issue.recentCommentsCount !== 1 ? 's' : ''}
                </div>

                {/* Nested Comments List */}
                <div className={styles.commentsList}>
                  {sortedComments
                    .filter(comment => comment.comment_type)
                    .map(comment => (
                      <div className={styles.commentItem} key={comment.id}>
                        <span className={styles.commentAuthor}>{comment.full_username}:</span>
                        <p className={styles.commentBody}>
                          {comment.comment.substring(0, 100)}
                          {comment.comment.length > 100 ? '...' : ''}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
