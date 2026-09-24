import { Dispatch } from 'react';
import { calculateCommitActivity } from './calculateCommitActivity';
import { type ProjectData } from '../../types/ProjectData';

export async function fetchProjectData(
  project: ProjectData,
  index: number,
  sinceWhenDays: number,
  setProjects: Dispatch<React.SetStateAction<ProjectData[]>>,
) {
  try {
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
    };

    // Add GitHub token if available
    const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`;
    }

    const since = Date.now() - sinceWhenDays * 24 * 60 * 60 * 1000;
    const commitsResponse = await fetch(
      `https://api.github.com/repos/${project.owner}/${project.repo}/commits?sha=${project.branch}&since=${new Date(since).toISOString()}`,
      { headers },
    );

    if (!commitsResponse.ok) {
      throw new Error('Failed to fetch commits');
    }

    const commits = await commitsResponse.json();

    // Calculate commit activity based on fetched commits (last 14 days)
    const commitActivity = calculateCommitActivity(commits, sinceWhenDays);

    setProjects(prev => {
      const newProjects = [...prev];
      newProjects[index] = {
        ...newProjects[index],
        commits,
        commitActivity,
        isLoading: false,
        lastFetched: Date.now(),
      };
      return newProjects;
    });
  } catch (error) {
    setProjects(prev => {
      const newProjects = [...prev];
      newProjects[index] = {
        ...newProjects[index],
        isLoading: false,
        error: 'Failed to load data',
      };
      return newProjects;
    });
  }
}
