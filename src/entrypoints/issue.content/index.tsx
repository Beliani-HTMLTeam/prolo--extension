import { createRoot } from 'react-dom/client';
import IssueApp from './App.tsx';

export default defineContentScript({
  matches: [`*://*.prologistics.info/react/logs/issue_logs/*`],
  main() {
    const container = document.createElement('div');
    
    container.id = 'prolo-extension-react-root';
    document.body.appendChild(container);

    initReactApp(container);
  },
});

export const initReactApp = (container: HTMLElement) => {
  const root = createRoot(container).render(<IssueApp />);
};
