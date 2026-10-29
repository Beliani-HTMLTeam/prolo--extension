import { setupLinkPreviews } from './linkPreviews';
import { setupChatSections } from './chatSections';

export default defineContentScript({
  matches: ['*://teams.microsoft.com/*', '*://teams.cloud.microsoft/*', '*://teams.live.com/*'],
  main() {
    if (window.top !== window) return;
    setupLinkPreviews();
    void setupChatSections();
  },
});
