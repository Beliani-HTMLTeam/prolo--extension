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
}

export default function RecentComments({ issues }: RecentCommentsProps) {
  const activeIssues = issues.filter((issue) => issue.recentCommentsCount > 0);

  return (
    <aside className={styles.recentCommentsContainer}>
     

      <div className={styles.scrollWrapper}>
        <div className={styles.cardsFlex}>
          {activeIssues.map((issue) => (
            <div className={styles.issueCard} key={issue.id}>
              {/* Issue Title Link */}
              <a
                href={issue.link}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.issueLink}
              >
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
                {issue.comments
                  .filter((comment) => comment.comment_type)
                  .map((comment) => (
                    <div className={styles.commentItem} key={comment.id}>
                      <span className={styles.commentAuthor}>
                        {comment.full_username}:
                      </span>
                      <p className={styles.commentBody}>
                        {comment.comment.substring(0, 100)}
                        {comment.comment.length > 100 ? '...' : ''}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}