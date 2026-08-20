import { createRoot } from 'react-dom/client';
import NewsEmailApp from './App.tsx';
import SendTestControls from './components/SendTestTo/SendTestControls.tsx';
import { initNewsletterFamilyTable } from './utils/copyCampaignNumber.ts';

export default defineContentScript({
  matches: [`*://*.prologistics.info/news_email.php*`],
  main() {
    const container = document.createElement('div');

    container.id = 'prolo-extension-react-root';
    document.body.appendChild(container);

    initReactApp(container);
    initSendTestControls();

    setTimeout(() => {
      initNewsletterFamilyTable();
    }, 1000);
  },
});

export const initReactApp = (container: HTMLElement) => {
  const root = createRoot(container).render(<NewsEmailApp />);
};


function initSendTestControls() {
  const testCustomerInput = document.querySelector('#test_customer');
  const showSendTest =
    window.location.href.includes('https://www.prologistics.info/news_email.php?id=') &&
    !!testCustomerInput;

  if (!showSendTest || !testCustomerInput) return;

  // Mount point right after #test_customer
  const mount = document.createElement('div');
  mount.id = 'send-test-controls-root';
  testCustomerInput.insertAdjacentElement('afterend', mount);

  createRoot(mount).render(<SendTestControls />);
}