import { createRoot } from 'react-dom/client';
import { CopyButton } from './CopyButton';

export default defineContentScript({
  matches: [`*://*.prologistics.info/*saved_details.php*`],
  main() {
    const initButtons = () => {
      const rows = Array.from(document.querySelectorAll('tr')).filter(tr => tr.cells.length > 2);

      rows.forEach(row => {
        const saCell = row.cells[2];
        if (!saCell) return;

        const link = saCell.querySelector('a');

        if (link && !saCell.querySelector('.prolo-copy-react-root')) {
          const valToCopy = link.innerText.trim();

          const container = document.createElement('span');
          container.className = 'prolo-copy-react-root';
          saCell.appendChild(container);

          const root = createRoot(container);
          root.render(<CopyButton textToCopy={valToCopy} />);
        }
      });
    };

    initButtons();
  },
});
