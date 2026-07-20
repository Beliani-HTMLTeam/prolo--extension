import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import styles from '@/entrypoints/newtab/Home.module.scss';
import logo_light from '@/entrypoints/newtab/img/Beliani_Icon_Brown_RGB.svg';
import logo_dark from '@/entrypoints/newtab/img/Beliani_Icon_Color_RGB.svg';
import LinksHub from '@/entrypoints/newtab/views/html/components/LinksHub.tsx';
import SearchBar from '@/entrypoints/newtab/views/html/components/SearchBar.tsx';
import Projects from '@/entrypoints/newtab/views/html/components/Projects.tsx';
import RecentComments from './RecentComments';
import { useIssuesWithComments } from './hooks/useIssueWithComments';

interface HtmlDashboardProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export default function HtmlDashboard({ theme, setTheme }: HtmlDashboardProps) {
  const [sbModalState, setSbModalState] = useState(false);
 const { issues, loading, error } = useIssuesWithComments();

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
        <img className={styles.logo} width={48} src={theme === 'light' ? logo_light : logo_dark} alt="Logo" />

        <div className={styles.toggleTheme}>
          <button
            title={'Switch theme to ' + (theme === 'light' ? 'dark' : 'light')}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? <Icon icon="si:sun-fill" /> : <Icon icon="si:moon-fill" />}
          </button>
        </div>
      </div>

      <RecentComments issues={issues} loading={loading} error={error} />

      <LinksHub />

      <SearchBar shown={sbModalState} />

      <Projects />
    </div>
  );
}
