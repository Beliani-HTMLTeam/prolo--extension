import { useEffect, useState } from 'react';
import styles from './Popup.module.scss';
import pkgText from '../../../package.json?raw';
import { getTableData } from './fetchProducts';
import useTeam from '@/hooks/useTeam';
const pkg = JSON.parse(pkgText) as {
  name?: string;
  version?: string;
  description?: string;
  author?: string | { name?: string };
};

export default function Popup() {
  const [isOnSavedDetailsPage, setIsOnSavedDetailsPage] = useState(false);
  const { team, changeTeam } = useTeam();

  useEffect(() => {
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      const activeTab = tabs[0];
      const url = activeTab?.url || '';
      const isSavedDetailsPage = url.includes('/saved_details.php');

      setIsOnSavedDetailsPage(isSavedDetailsPage);
    });
  }, []);

  const project = {
    name: pkg.name ?? '',
    authors: (pkg.author as string) ?? pkg.author ?? '',
    version: pkg.version ?? '',
    description: pkg.description ?? '',
  };

  return (
    <div className={styles.popup}>
      <img src="./beliani_logo.svg" width="50%" style={{ maxWidth: '200px' }} alt="Popup Image" />
      <table cellPadding={0} cellSpacing={0} width="100%">
        <thead>
          <tr>
            <th>Extension Name</th>
            <th>Created By</th>
            <th>Version</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{project.name}</td>
            <td>{project.authors}</td>
            <td>{project.version}</td>
            <td>{project.description}</td>
          </tr>
        </tbody>
      </table>

      {isOnSavedDetailsPage && (
        <div id="actions">
          <button onClick={getTableData}>Fetch products</button>
        </div>
      )}

      <div className={styles.teamToggle}>
        <p>Select Team:</p>
        <div className={styles.toggleContainer}>
          <button
            className={`${styles.toggleButton} ${team === 'HTML' ? styles.active : ''}`}
            onClick={() => changeTeam('HTML')}
          >
            HTML
          </button>
          <button
            className={`${styles.toggleButton} ${team === 'GRAPHICS' ? styles.active : ''}`}
            onClick={() => changeTeam('GRAPHICS')}
          >
            GRAPHICS
          </button>
        </div>
      </div>
    </div>
  );
}
