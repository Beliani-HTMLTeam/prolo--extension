import { createRoot, Root } from 'react-dom/client';
import App from './App';
import { getModal } from './assets';

interface Message {
  action: string;
  status?: string;
  text?: string;
}

interface Sender {
  id?: string;
  url?: string;
  origin?: string;
}

interface SendResponse {
  (response: { received: boolean }): void;
}

export default defineContentScript({
  matches: [
    'https://prolodev.prologistics.info/shop_banners.php*',
    'https://www.prologistics.info/shop_banners.php*',
    'https://prolodev.prologistics.info/shop_banner.php*',
    'https://www.prologistics.info/shop_banner.php*',
  ],
  main(): void {
    // message listener for modals
    browser.runtime.onMessage.addListener((message: Message, sender: Sender, sendResponse: SendResponse): boolean  => {
      if (message.action === 'showModal') {
        console.log('Showing modal: ', message.status, message.text);
        getModal(message.status  as 'success' | 'error' | 'nyan' | 'cryMen', message.text || '');
        sendResponse({ received: true });
      }
      return true; // Keep the message channel open for async response
    });

   const fullBody = document.body;
    if (!fullBody) {
      console.error('Document body not found');
      return;
    }

    const reactContainerExt = document.createElement('div');
    reactContainerExt.className = 'main-cgb';

    fullBody.append(reactContainerExt);

    initReactApp(reactContainerExt);
  },
});

export const initReactApp = (container: HTMLElement): Root => {
  const root = createRoot(container);
  root.render(<App />);
  return root; // Return the root instance
};