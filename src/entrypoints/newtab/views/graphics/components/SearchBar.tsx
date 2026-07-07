import { useState } from 'react';
import { Icon } from '@iconify/react';
import styles from '../styles/SearchBar.module.scss';

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim().length > 0) {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className={styles.searchContainer}>
      <Icon icon="logos:google-icon" className={styles.searchIcon} />
      <input
        type="text"
        placeholder="Search"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        onKeyDown={handleSearchKeyDown}
      />
      <div className={styles.searchActions}>
        <a
          href="https://images.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', color: 'inherit' }}
        >
          <Icon icon="mdi:google-lens" style={{ color: '#0F9D58' }} />
        </a>
      </div>
    </div>
  );
}
