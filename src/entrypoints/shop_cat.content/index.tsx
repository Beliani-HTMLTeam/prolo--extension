import { createRoot } from 'react-dom/client';
import App from './App.tsx';

export default defineContentScript({
  matches: [`*://*.prologistics.info/shop_cat.php*`],
  main() {
    const container = document.createElement('div');

    container.id = 'prolo-extension-react-root';
    document.body.appendChild(container);

    initReactApp(container);
  },
});

export const initReactApp = (container: HTMLElement) => {
  const root = createRoot(container).render(<App />);
};
