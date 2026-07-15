'use client';

import { useState, useEffect } from 'react';

import '../../assets/styles/reset.css';

import logo_light from './img/Beliani_Icon_Brown_RGB.svg';
import logo_dark from './img/Beliani_Icon_Color_RGB.svg';
import styles from './Home.module.scss';
import { Icon } from '@iconify/react';
import LinksHub from './components/LinksHub';
import SearchBar from './components/SearchBar';
import Projects from './components/Projects.tsx';
import axios from 'axios';
import { Comment } from '../issue.content/api/comments.ts';
import RecentComments from './components/RecentComments.tsx';

interface IssueWithComments {
  link: string;
  issue: string;
  id: string;
  comments: Comment[];
  totalComments: number;
  recentCommentsCount: number;
}

const filterCommentsByTime = (comments: Comment[], hours: number = 24): Comment[] => {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - hours);

  return comments.filter(comment => {
    const commentDate = new Date(comment.create_date);
    return commentDate >= cutoffTime;
  });
};

export default function Home() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [issues, setIssues] = useState<IssueWithComments[]>([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const issues = await axios.get(
          'https://www.prologistics.info/api/issueLog/list/?status=open&view_type=list&board_sort=col_time_old_top&solving_resp_username%5B%5D=DmyKrapyvianskyi',
        );

        const issueList = issues.data.issue_list;
        const issueIds = issueList.map((issue: any) => issue.id);

        const commentsPromises = issueIds.map(async (id: number) => {
          const commentsResponse = await axios.get(
            `https://www.prologistics.info/api/issueLog/comments/?comment_type=issuelog&page_id=${id}`,
          );
          return { id, comments: commentsResponse.data.comments || [] };
        });

        const commentsData = await Promise.all(commentsPromises);

        const commentsMap = new Map(commentsData.map((item: any) => [item.id, item.comments]));

        const issuesWithComments: IssueWithComments[] = issueList.map((issue: any) => {
          const allComments: Comment[] = commentsMap.get(issue.id) || [];
          const recentComments = filterCommentsByTime(allComments, 24);

          return {
            link: `https://www.prologistics.info/react/logs/issue_logs/${issue.id}/`,
            issue: issue.issue,
            id: issue.id,
            comments: recentComments,
            totalComments: allComments.length,
            recentCommentsCount: recentComments.length,
          };
        });

        setIssues(issuesWithComments);
        console.log('issuesWithComments (filtered)', issuesWithComments);

        // Store in state
        // setIssues(issuesWithComments);
      } catch (error) {
        console.error('Error fetching issues:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [sbModalState, setSbModalState] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSbModalState(false);
        return;
      }

      if (e.key === '/') {
        setSbModalState(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={styles.home}>
      <div className={styles.floating}>
        {/* logo */}
        <img className={styles.logo} width={48} src={theme === 'light' ? logo_light : logo_dark} alt="Logo" />

        {/* theme toggle */}
        <div className={styles.toggleTheme}>
          <button
            title={'Switch theme to ' + (theme === 'light' ? 'dark' : 'light')}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? <Icon icon="si:sun-fill" /> : <Icon icon="si:moon-fill" />}
          </button>
        </div>
      </div>

      <RecentComments issues={issues} />

      <LinksHub />

      <SearchBar shown={sbModalState} />

      <Projects />
    </div>
  );
}
