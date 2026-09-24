import { type Commit } from './Commit';

export interface ProjectData {
  name: string;
  owner: string;
  repo: string;
  branch: string;
  url: string;
  commits: Commit[];
  commitActivity: number[];
  isLoading: boolean;
  error?: string;
  lastFetched?: number;
}
