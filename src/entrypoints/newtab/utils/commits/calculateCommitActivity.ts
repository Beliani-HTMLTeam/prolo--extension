import { Commit } from '../../types/Commit';

// Calculate commit activity for the configured date range
export function calculateCommitActivity(commitsList: Commit[], sinceWhenDays: number): number[] {
  const activity = new Array(sinceWhenDays).fill(0);
  
  // Get today's date in local timezone (start of day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  commitsList.forEach(commit => {
    const commitDate = new Date(commit.commit.author.date);
    // Get the commit date in local timezone (start of day)
    commitDate.setHours(0, 0, 0, 0);
    const commitTime = commitDate.getTime();
    
    const daysAgo = Math.floor((todayTime - commitTime) / (24 * 60 * 60 * 1000));

    if (daysAgo >= 0 && daysAgo < sinceWhenDays) {
      // Index 0 is oldest day, index (sinceWhenDays - 1) is today
      activity[sinceWhenDays - 1 - daysAgo]++;
    }
  });

  return activity;
}
