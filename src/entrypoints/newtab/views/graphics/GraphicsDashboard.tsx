import { useState, useEffect } from 'react';
import styles from '@/entrypoints/newtab/views/graphics/styles/GraphicsDashboard.module.scss';
import linksData from '@/data/links.json';
import CalendarWidget from '@/entrypoints/newtab/views/graphics/components/CalendarWidget';
import TopBar from '@/entrypoints/newtab/views/graphics/components/TopBar';
import SidebarSection from '@/entrypoints/newtab/views/graphics/components/SidebarSection';
import PillLink from '@/entrypoints/newtab/views/graphics/components/PillLink';
import SearchBar from '@/entrypoints/newtab/views/graphics/components/SearchBar';
import ColorSwatch from '@/entrypoints/newtab/views/graphics/components/ColorSwatch';

const data = linksData.graphics;

export default function GraphicsDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
      }
    } catch (e) {
      console.error('Error fetching user profile:', e);
    }
  };

  useEffect(() => {
    browser.identity.getAuthToken({ interactive: false }, result => {
      const tokenVal = typeof result === 'string' ? result : (result as any)?.token;
      if (tokenVal) {
        setToken(tokenVal);
        fetchUserProfile(tokenVal);
      }
    });
  }, []);

  const handleLogout = () => {
    if (!token) return;
    browser.identity.removeCachedAuthToken({ token }, () => {
      fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`).catch(err => console.error(err));
      setToken(null);
      setUserProfile(null);
    });
  };

  return (
    <div className={styles.dashboardWrapper}>
      <div className={styles.dashboardContainer}>
        <TopBar data={data} userProfile={userProfile} handleLogout={handleLogout} />

        <aside className={styles.sidebar}>
          {data.sidebarLeft.map(section => (
            <SidebarSection key={section.category} category={section.category} links={section.links} />
          ))}
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.quickLinksRow}>
            {data.quickLinks.map(link => (
              <PillLink key={link.name} item={link} />
            ))}
          </div>

          <SearchBar />

          <div className={styles.quickLinksRow}>
            {data.aiLinks.map(link => (
              <PillLink key={link.name} item={link} />
            ))}
          </div>

          <CalendarWidget
            token={token}
            setToken={setToken}
            setUserProfile={setUserProfile}
            fetchUserProfile={fetchUserProfile}
          />

          <div className={styles.colorSwatches}>
            {data.colors?.map(color => (
              <ColorSwatch key={color.name} name={color.name} hex={color.hex} />
            ))}
          </div>
        </main>

        <aside className={styles.sidebar}>
          {data.sidebarRight.map(section => (
            <SidebarSection key={section.category} category={section.category} links={section.links} />
          ))}
        </aside>
      </div>
    </div>
  );
}
