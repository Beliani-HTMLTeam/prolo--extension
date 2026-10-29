import { useState, useEffect } from 'react';
import axios from 'axios';
import { type Comment } from '@/entrypoints/issue.content/api/comments';
import { config } from '@/config/prolo';

export interface IssueWithComments {
  link: string;
  issue: string;
  id: string;
  comments: Comment[];
  totalComments: number;
  recentCommentsCount: number;
  isOther: boolean;
}

const CACHE_KEY = 'local:recentCommentsCache';

interface CommentsCache {
  issues: IssueWithComments[];
  fetchedAt: number;
}

const filterCommentsByTime = (comments: Comment[], hours: number = 24): Comment[] => {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - hours);

  return comments.filter(comment => {
    const commentDate = new Date(comment.create_date);
    return commentDate >= cutoffTime;
  });
};

const dropExpiredComments = (issues: IssueWithComments[]): IssueWithComments[] =>
  issues.map(issue => {
    const recentComments = filterCommentsByTime(issue.comments, 24);
    return { ...issue, comments: recentComments, recentCommentsCount: recentComments.length };
  });

export function useIssuesWithComments() {
  const [issues, setIssues] = useState<IssueWithComments[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let hasData = false;

    const loadCache = async () => {
      const cache = await storage.getItem<CommentsCache>(CACHE_KEY);
      if (cache?.issues && !hasData) {
        hasData = true;
        setIssues(dropExpiredComments(cache.issues));
        setLoading(false);
      }
    };

    const fetchData = async () => {
      try {
        setRefreshing(true);
        setError(null);

        const prolo = await axios.get(config.prologisticsProdHost);
        const parser = new DOMParser();
        const doc = parser.parseFromString(prolo.data, 'text/html');
        const username = doc.body.getAttribute('data-user');

        if (!username) {
          throw new Error('Username not found');
        }

        const baseIssuesUrl = `${config.prologisticsProdHost}${config.paths.issueLogList}`;
        const baseIssueListQuery = {
          status: 'open',
          view_type: 'list',
          board_sort: 'col_time_old_top',
        };

        const mainQuery = { ...baseIssueListQuery, 'solving_resp_username[]': username };
        const otherQueries = [
          { ...baseIssueListQuery, issue_type: '982' },
          { ...baseIssueListQuery, resp_username: 'Graphics_HTML' },
          { ...baseIssueListQuery, solving_resp_username: 'Graphics_HTML' },
        ];

        const mainResponse = await axios.get(`${baseIssuesUrl}?${new URLSearchParams(mainQuery).toString()}`);
        const otherResults = await Promise.allSettled(
          otherQueries.map(query => axios.get(`${baseIssuesUrl}?${new URLSearchParams(query).toString()}`)),
        );
        const otherResponses = otherResults.flatMap(result => (result.status === 'fulfilled' ? [result.value] : []));

        const mainIssueList = mainResponse.data.issue_list || [];
        const mainIds = new Set(mainIssueList.map((i: any) => i.id));

        const otherIssueList = Array.from(
          new Map(
            otherResponses.flatMap(response => response.data.issue_list || []).map((issue: any) => [issue.id, issue]),
          ).values(),
        ).filter((issue: any) => !mainIds.has(issue.id));

        const combinedList = [
          ...mainIssueList.map((issue: any) => ({ ...issue, isOther: false })),
          ...otherIssueList.map((issue: any) => ({ ...issue, isOther: true })),
        ];

        const issueIds = combinedList.map((issue: any) => issue.id);

        const commentsPromises = issueIds.map(async (id: number) => {
          const commentsResponse = await axios.get(
            `${config.prologisticsProdHost}/api/issueLog/comments/?comment_type=issuelog&page_id=${id}`,
          );
          return { id, comments: commentsResponse.data.comments || [] };
        });

        const commentsResults = await Promise.allSettled(commentsPromises);
        const failedCount = commentsResults.filter(result => result.status === 'rejected').length;
        if (failedCount > 0) {
          console.warn(`Failed to load comments for ${failedCount} issue(s)`);
        }
        const commentsData = commentsResults.flatMap(result => (result.status === 'fulfilled' ? [result.value] : []));
        const commentsMap = new Map(commentsData.map((item: any) => [item.id, item.comments]));

        const issuesWithComments: IssueWithComments[] = combinedList.map((issue: any) => {
          const allComments: Comment[] = commentsMap.get(issue.id) || [];
          const recentComments = filterCommentsByTime(allComments, 24);

          return {
            link: `${config.prologisticsProdHost}/react/logs/issue_logs/${issue.id}/`,
            issue: issue.issue,
            id: issue.id,
            comments: recentComments,
            totalComments: allComments.length,
            recentCommentsCount: recentComments.length,
            isOther: issue.isOther,
          };
        });

        hasData = true;
        setIssues(issuesWithComments);
        storage.setItem<CommentsCache>(CACHE_KEY, { issues: issuesWithComments, fetchedAt: Date.now() });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch issues');
        console.error('Error fetching issues:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    loadCache().catch(err => console.error('Error reading comments cache:', err));
    fetchData();
  }, []);

  // Optional: Compute derived data
  const issuesWithRecentComments = issues.filter(issue => issue.recentCommentsCount > 0);
  const totalRecentComments = issues.reduce((sum, issue) => sum + issue.recentCommentsCount, 0);

  return {
    issues,
    loading,
    refreshing,
    error,
    issuesWithRecentComments,
    totalRecentComments,
  };
}
