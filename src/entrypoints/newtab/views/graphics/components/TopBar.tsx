import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import styles from '../styles/TopBar.module.scss';
import logo_dark from '@/entrypoints/newtab/img/Beliani_Icon_Color_RGB.svg';

interface TopBarProps {
  data: {
    topNav: any[];
    belianiShops?: any[];
    googleApps?: any[];
  };
  userProfile: any;
  handleLogout: () => void;
}

export default function TopBar({ data, userProfile, handleLogout }: TopBarProps) {
  const [isAppsOpen, setIsAppsOpen] = useState(false);
  const [isBelianiOpen, setIsBelianiOpen] = useState(false);

  const appsRef = useRef<HTMLDivElement>(null);
  const belianiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (appsRef.current && !appsRef.current.contains(event.target as Node)) {
        setIsAppsOpen(false);
      }
      if (belianiRef.current && !belianiRef.current.contains(event.target as Node)) {
        setIsBelianiOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={styles.topBar}>
      <img src={logo_dark} alt="Beliani Logo" className={styles.logo} />

      <div className={styles.navLinks}>
        {data.topNav.map((link: any) =>
          link.hasDropdown ? (
            <div key={link.name} className={styles.navDropdownContainer} ref={belianiRef}>
              <button
                className={`${styles.navDropdownBtn} ${isBelianiOpen ? styles.open : ''}`}
                onClick={() => setIsBelianiOpen(!isBelianiOpen)}
              >
                {link.name} <Icon icon="mdi:chevron-down" />
              </button>

              <div className={`${styles.countriesDropdown} ${isBelianiOpen ? styles.open : ''}`}>
                <div className={styles.countries}>
                  {data.belianiShops?.map((country: any, idx: number) => (
                    <div key={idx} className={styles.country}>
                      <img width="18" height="18" src={country.flag} alt={country.alt} />
                      {country.links.map((cl: any, i: number) => (
                        <a
                          key={cl.name}
                          href={cl.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={i === 0 ? styles.domainLink : ''}
                        >
                          {i === 0 ? `${country.domain} (${cl.name})` : cl.name}
                        </a>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer">
              {link.name}
            </a>
          ),
        )}
      </div>

      <div className={styles.actions}>
        <div className={styles.appsContainer} ref={appsRef}>
          <button className={styles.iconBtn} onClick={() => setIsAppsOpen(!isAppsOpen)}>
            <Icon icon="mdi:dots-grid" />
          </button>
          {isAppsOpen && (
            <div className={styles.appsDropdown}>
              <div className={styles.appsGrid}>
                {data.googleApps?.map(app => {
                  const isAccount = app.name === 'Account';
                  return (
                    <a
                      key={app.name}
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.appItem}
                    >
                      {isAccount && userProfile?.picture ? (
                        <img src={userProfile.picture} alt={app.name} width="48px" style={{ borderRadius: '50%' }} />
                      ) : app.image ? (
                        <img src={`/icons/${app.image}.png`} alt={app.name} width="48px" />
                      ) : app.icon ? (
                        <Icon icon={app.icon} style={{ fontSize: '48px', color: app.iconColor || 'inherit' }} />
                      ) : null}

                      <span>{app.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {userProfile?.picture ? (
          <div className={styles.profileContainer}>
            <img
              src={userProfile.picture}
              alt="User Avatar"
              className={styles.avatarImage}
              title={`Logged in as ${userProfile.name}`}
            />
            <button className={styles.logoutBtn} onClick={handleLogout} title="Sign out / Switch account">
              <Icon icon="mdi:logout" />
            </button>
          </div>
        ) : (
          <div className={styles.avatar} title="Not signed in">
            <Icon icon="mdi:account" style={{ fontSize: '1.25rem' }} />
          </div>
        )}
      </div>
    </header>
  );
}
