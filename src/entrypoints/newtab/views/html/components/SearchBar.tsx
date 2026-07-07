import { KeyboardEvent, useEffect, useState } from 'react';
import styles from '@/entrypoints/newtab/views/html/styles/SearchBar.module.scss';
import { Icon } from '@iconify/react';
import { useRef } from 'react';

type SearchEngine = 'google' | 'duckduckgo' | 'perplexity';

export default function SearchBar({ shown }: { shown: boolean }) {
  const [getInput, setInput] = useState('');
  const [defaultEngine, setDefaultEngine] = useState<SearchEngine>('google');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    storage.getItem('local:defaultSearchEngine').then(res => {
      const saved = res as SearchEngine;
      if (saved) {
        setDefaultEngine(saved);
      }
    });
  }, []);

  const handleEngineChange = (engine: SearchEngine) => {
    setDefaultEngine(engine);
    storage.setItem('local:defaultSearchEngine', engine);
  };

  const searchWithEngine = (engine: SearchEngine) => {
    if (!getInput) return;

    const encodedQuery = encodeURIComponent(getInput);
    const urls = {
      google: `https://www.google.com/search?q=${encodedQuery}`,
      duckduckgo: `https://duckduckgo.com/?q=${encodedQuery}`,
      perplexity: `https://www.perplexity.ai/?q=${encodedQuery}`,
    };

    window.open(urls[engine]);
  };

  function processInput(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      searchWithEngine(defaultEngine);
    } else if (e.altKey) {
      switch (e.key) {
        case '1':
          searchWithEngine('google');
          break;
        case '2':
          searchWithEngine('duckduckgo');
          break;
        case '3':
          searchWithEngine('perplexity');
          break;
      }
    }
  }

  useEffect(() => {
    if (shown && inputRef.current) {
      inputRef.current.focus();
      setInput('');
    }
  }, [shown]);

  return (
    <div className={[styles.searchBarModal, shown ? styles.visible : styles.hidden].join(' ')}>
      <div className={styles.searchBar}>
        <Icon className={styles.magnifier} icon="gravity-ui:magnifier" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          onKeyDown={e => processInput(e)}
          onInput={e => setInput(e.currentTarget.value)}
        />
        <div className={styles.searchEngines}>
          {/* google */}
          <button
            className={defaultEngine === 'google' ? styles.active : ''}
            onClick={() => handleEngineChange('google')}
            title="Google (Alt+1)"
          >
            <Icon icon="flat-color-icons:google" />
          </button>

          {/* duckduckgo */}
          <button
            className={defaultEngine === 'duckduckgo' ? styles.active : ''}
            onClick={() => handleEngineChange('duckduckgo')}
            title="DuckDuckGo (Alt+2)"
          >
            <Icon icon="logos:duckduckgo" />
          </button>

          {/* perplexity ai search */}
          <button
            className={defaultEngine === 'perplexity' ? styles.active : ''}
            onClick={() => handleEngineChange('perplexity')}
            title="Perplexity AI (Alt+3)"
          >
            <Icon icon="logos:perplexity-icon" />
          </button>
        </div>

        <div className={styles.kbdShortcuts}>
          <div className={styles.shortcut}>
            <span className={styles.key}>
              <kbd>Enter</kbd>
            </span>
            <span className={styles.separator}> - </span>
            <span className={styles.description}>Search with default</span>
          </div>
          <div className={styles.shortcut}>
            <span className={styles.key}>
              <kbd>Alt</kbd> + <kbd>1</kbd>
            </span>
            <span className={styles.separator}> - </span>
            <span className={styles.description}>Google</span>
          </div>
          <div className={styles.shortcut}>
            <span className={styles.key}>
              <kbd>Alt</kbd> + <kbd>2</kbd>
            </span>
            <span className={styles.separator}> - </span>
            <span className={styles.description}>DuckDuckGo</span>
          </div>
          <div className={styles.shortcut}>
            <span className={styles.key}>
              <kbd>Alt</kbd> + <kbd>3</kbd>
            </span>
            <span className={styles.separator}> - </span>
            <span className={styles.description}>Perplexity</span>
          </div>
        </div>
      </div>
    </div>
  );
}
