import { type Commit } from './Commit';

export interface CommitsByDate {
  date: string;
  projectCommits: {
    projectName: string;
    projectUrl: string;
    commits: Commit[];
  }[];
}
