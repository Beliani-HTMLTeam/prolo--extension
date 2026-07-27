import { useState, useEffect } from 'react';
import axios from 'axios';
import { Comment } from '@/entrypoints/issue.content/api/comments';

export interface IssueWithComments {
  link: string;
  issue: string;
  id: string;
  comments: Comment[];
  totalComments: number;
  recentCommentsCount: number;
  isOther: boolean;
}

const filterCommentsByTime = (comments: Comment[], hours: number = 24): Comment[] => {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - hours);

  return comments.filter(comment => {
    const commentDate = new Date(comment.create_date);
    return commentDate >= cutoffTime;
  });
};

export function useIssuesWithComments() {
  const [issues, setIssues] = useState<IssueWithComments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const prolo = await axios.get('https://www.prologistics.info/');
        const parser = new DOMParser();
        const doc = parser.parseFromString(prolo.data, 'text/html');
        const username = doc.body.getAttribute('data-user');

        if (!username) {
          throw new Error('Username not found');
        }

        const baseIssuesUrl = 'https://www.prologistics.info/api/issueLog/list/';
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
        const otherResponses = await Promise.all(
          otherQueries.map(query => axios.get(`${baseIssuesUrl}?${new URLSearchParams(query).toString()}`)),
        );

        const mainIssueList = mainResponse.data.issue_list || [];
        const mainIds = new Set(mainIssueList.map((i: any) => i.id));

        const otherIssueList = Array.from(
          new Map(
            otherResponses.flatMap(response => response.data.issue_list).map((issue: any) => [issue.id, issue]),
          ).values(),
        ).filter((issue: any) => !mainIds.has(issue.id));

        const combinedList = [
          ...mainIssueList.map((issue: any) => ({ ...issue, isOther: false })),
          ...otherIssueList.map((issue: any) => ({ ...issue, isOther: true })),
        ];

        const issueIds = combinedList.map((issue: any) => issue.id);

        const commentsPromises = issueIds.map(async (id: number) => {
          const commentsResponse = await axios.get(
            `https://www.prologistics.info/api/issueLog/comments/?comment_type=issuelog&page_id=${id}`,
          );
          return { id, comments: commentsResponse.data.comments || [] };
        });

        const commentsData = await Promise.all(commentsPromises);
        const commentsMap = new Map(commentsData.map((item: any) => [item.id, item.comments]));

        const issuesWithComments: IssueWithComments[] = combinedList.map((issue: any) => {
          const allComments: Comment[] = commentsMap.get(issue.id) || [];
          const recentComments = filterCommentsByTime(allComments, 24);

          return {
            link: `https://www.prologistics.info/react/logs/issue_logs/${issue.id}/`,
            issue: issue.issue,
            id: issue.id,
            comments: recentComments,
            totalComments: allComments.length,
            recentCommentsCount: recentComments.length,
            isOther: issue.isOther,
          };
        });

        setIssues(issuesWithComments);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch issues');
        console.error('Error fetching issues:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Optional: Compute derived data
  const issuesWithRecentComments = issues.filter(issue => issue.recentCommentsCount > 0);
  const totalRecentComments = issues.reduce((sum, issue) => sum + issue.recentCommentsCount, 0);

  return {
    issues,
    loading,
    error,
    issuesWithRecentComments,
    totalRecentComments,
  };
}
