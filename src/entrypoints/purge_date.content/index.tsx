import { initPurgeDateBadge } from './initPurgeDate';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    initPurgeDateBadge();
  },
});