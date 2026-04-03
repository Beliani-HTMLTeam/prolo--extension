import styles from './styles/Projects.module.scss';
import { Icon } from '@iconify/react';
import { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  ChartOptions,
} from 'chart.js';
import { fetchProjectData } from '../utils/commits/fetchProjectData';
import { ProjectData } from '../types/ProjectData';
import { CommitsByDate } from '../types/CommitsByDate';
import { formatDateShort } from '../utils/formatDateShort';
import { truncateMessage } from '../utils/truncateMessage';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const projectsConfig = [
  { name: 'Constructor', user: 'Beliani-HTMLTeam', repo: 'constructor', branch: 'playground' },
  { name: 'Translations API', user: 'Beliani-HTMLTeam', repo: 'translations-api', branch: 'main' },
  { name: 'Extension - Rewritten', user: 'Beliani-HTMLTeam', repo: 'prolo--extension', branch: 'dev' },
  { name: 'Extension - Legacy', user: 'Beliani-HTMLTeam', repo: 'prolo--extension-legacy', branch: 'future' },
  { name: 'Extension for Graphics', user: 'Beliani-HTMLTeam', repo: 'prolo--extension-for-graphics', branch: 'dev' },
  { name: 'Top Image Generator', user: 'Beliani-HTMLTeam', repo: 'figma--top-image-title-generator', branch: 'main' },
];

const DAYS_SINCE = 14;

function getChartColor() {
  let chartColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-accent-color');

  // https://stackoverflow.com/questions/72316064/apexcharts-cannot-use-css-variables-as-fill-colors
  // Helper function to clean up color values
  function cleanColor(color: string) {
    // remove any leading or trailing whitespace
    color = color.trim();
    // remove any leading # characters
    color = color.replace(/^#+/, '');
    // ensure the color string is exactly 6 characters long
    if (color.length < 6) {
      color = color.padStart(6, '0');
    } else if (color.length > 6) {
      color = color.slice(0, 6);
    }
    // add a leading # character
    color = '#' + color;
    return color;
  }

  return cleanColor(chartColor);
}

export default function Projects() {
  const [chartColor, setChartColor] = useState(getChartColor());
  const [projects, setProjects] = useState<ProjectData[]>(() => {
    return projectsConfig.map(project => {
      const owner = project.user;
      const repo = project.repo;
      const branch = project.branch || 'main';

      return {
        name: project.name,
        owner,
        repo,
        branch,
        url: `https://github.com/${owner}/${repo}/tree/${branch}`,
        commits: [],
        commitActivity: [],
        isLoading: true,
      };
    });
  });

  // Watch for theme changes by observing the data-theme attribute
  useEffect(() => {
    const updateChartColor = () => {
      setChartColor(getChartColor());
    };

    // Update color on mount
    updateChartColor();

    // Watch for changes to the HTML element's attributes (theme changes)
    const observer = new MutationObserver(updateChartColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    projects.forEach((project, index) => {
      if (project.owner && project.repo && project.branch) {
        fetchProjectData(project, index, DAYS_SINCE, setProjects);
      }
    });
  }, []);

  // Group commits by date
  function groupCommitsByDate(): CommitsByDate[] {
    const commitsByDate: Map<string, CommitsByDate['projectCommits']> = new Map();

    projects.forEach(project => {
      if (!project.isLoading && !project.error && project.commits.length > 0) {
        project.commits.forEach(commit => {
          const commitDate = new Date(commit.commit.author.date);
          const dateKey = commitDate.toDateString();

          if (!commitsByDate.has(dateKey)) {
            commitsByDate.set(dateKey, []);
          }

          const projectCommits = commitsByDate.get(dateKey)!;
          let projectGroup = projectCommits.find(pc => pc.projectName === project.name);

          if (!projectGroup) {
            projectGroup = {
              projectName: project.name,
              projectUrl: project.url,
              commits: [],
            };
            projectCommits.push(projectGroup);
          }

          projectGroup.commits.push(commit);
        });
      }
    });

    // Convert to array and sort by date (newest first)
    const result: CommitsByDate[] = Array.from(commitsByDate.entries())
      .map(([date, projectCommits]) => ({
        date,
        projectCommits: projectCommits.map(pc => ({
          ...pc,
          commits: pc.commits.sort(
            (a, b) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime(),
          ),
        })),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }

  function createChartData(commitActivity: number[]) {
    const labels = Array.from({ length: DAYS_SINCE }, (_, i) => {
      const date = new Date(Date.now() - (DAYS_SINCE - 1 - i) * 24 * 60 * 60 * 1000);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return {
      labels,
      datasets: [
        {
          data: commitActivity,
          fill: true,
          borderColor: chartColor,
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, chartColor);
            gradient.addColorStop(1, 'rgba(255, 47, 0, 0)');
            return gradient;
          },
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: chartColor,
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
        },
      ],
    };
  }

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(10, 10, 10, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: chartColor,
        borderWidth: 2,
        padding: 12,
        displayColors: false,
        titleFont: {
          size: 13,
          weight: 'bold',
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          title: context => {
            return context[0].label;
          },
          label: context => {
            return `${context.parsed.y} commit${context.parsed.y !== 1 ? 's' : ''}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: false,
        grid: {
          display: false,
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
        beginAtZero: true,
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  const commitsByDate = groupCommitsByDate();
  const activeProjects = projects.filter(p => !p.isLoading && !p.error && p.commits.length > 0);

  return (
    <>
      <div className={styles.projectsWrapper}>
        <div className={styles.commitsTimelineWrapper}>
          <div className={styles.commitsTimeline}>
            {commitsByDate.length === 0 ? (
              <div className={styles.emptyState}>No recent commits</div>
            ) : (
              commitsByDate.map(dateGroup => (
                <div key={dateGroup.date} className={styles.dateGroup}>
                  <div className={styles.dateHeader}>{formatDateShort(dateGroup.date)}</div>
                  {dateGroup.projectCommits.map(projectGroup => (
                    <div key={projectGroup.projectName} className={styles.projectGroup}>
                      <div className={styles.projectGroupName}>
                        <a href={projectGroup.projectUrl} target="_blank" rel="noopener noreferrer">
                          {projectGroup.projectName}
                        </a>
                      </div>
                      {projectGroup.commits.map(commit => (
                        <div key={commit.sha} className={styles.commitEntry}>
                          <a
                            href={commit.author?.login ? `https://github.com/${commit.author.login}` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.commitAuthor}
                          >
                            {commit.author?.login || commit.commit.author.name}
                            {commit.author?.login && <Icon icon="gg:external" />}
                          </a>

                          <a
                            href={`https://github.com/${projectGroup.projectUrl.match(/github\.com\/([^\/]+\/[^\/]+)/)?.[1]}/commit/${commit.sha}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.commitDescription}
                          >
                            {truncateMessage(commit.commit.message, 80)} <Icon icon="gg:external" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.chartsGridWrapper}>
          <div className={styles.chartsGrid}>
            {activeProjects.map(project => (
              <div key={project.name} className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h3 className={styles.chartProjectName}>
                    <a href={project.url} target="_blank" rel="noopener noreferrer">
                      {project.name} <Icon icon="gg:external" />
                    </a>
                  </h3>
                </div>
                <div className={styles.chartContainer}>
                  <Line data={createChartData(project.commitActivity)} options={chartOptions} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', whiteSpace: 'nowrap' }}>
        <span style={{ display: 'flex', flexDirection: 'row', gap: '32px' }}>
          Projects tracked (gray - no commits in last {DAYS_SINCE} days):
          {projects.map(project => (
            <a
              key={project.name}
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '8px',
                color: activeProjects.includes(project)
                  ? 'var(--theme-text-color)'
                  : 'var(--theme-text-color-secondary)',
                alignItems: 'center',
                textDecoration: 'none',
              }}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon style={{ fontSize: '24px' }} icon="icon-park-outline:github" />
              {project.repo}
            </a>
          ))}
        </span>
      </div>
    </>
  );
}
