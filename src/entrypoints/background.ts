import { initUpdateChecker } from './updater.content/checker';
import { registerBannerQueue } from '@/background/bannerQueue';
import { createMessageRouter } from '@/background/messageRouter';

export default defineBackground(() => {
  initUpdateChecker();

  browser.action.onClicked.addListener(tab => {
    console.log('Extension icon clicked');
    // You can send message to open popup or trigger something
    browser.tabs.sendMessage(tab.id!, { action: 'togglePopup' }).catch(() => {});
  });

  const bannerQueue = registerBannerQueue();
  browser.runtime.onMessage.addListener(createMessageRouter(bannerQueue));
});
