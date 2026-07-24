import { createRoot } from 'react-dom/client';
import App, {  } from './App';
// import { mountCsvUploader } from './components/PushUploader';   // ← Remove or comment out

export default defineContentScript({
  matches: [
    'https://www.prologistics.info/push_notifications.php',
    'https://prolodev.prologistics.info/push_notifications.php',
  ],
  cssInjectionMode: 'manifest',
  main() {

    // mountCsvUploader();   // ← REMOVED - we now have the selector inside App

    const reactContainerExt = document.createElement('div');
    reactContainerExt.id = 'push-macro-react-root';
    document.body.appendChild(reactContainerExt);

    initReactApp(reactContainerExt);

    console.log('Buenos dias');
  },
});

export const initReactApp = (container: HTMLElement) => {
  createRoot(container).render(<App />);
};