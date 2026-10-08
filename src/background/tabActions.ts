export function handleNextTab() {
  browser.tabs.query({ currentWindow: true }, async tabs => {
    const activeTabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (activeTabs.length > 0) {
      const currentIndex = activeTabs[0].index;
      const nextIndex = (currentIndex + 1) % tabs.length;
      await browser.tabs.update(tabs[nextIndex].id, { active: true });
    }
  });

  return true;
}

export function handlePrevTab() {
  browser.tabs.query({ currentWindow: true }, async tabs => {
    const activeTabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (activeTabs.length > 0) {
      const currentIndex = activeTabs[0].index;
      const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
      await browser.tabs.update(tabs[prevIndex].id, { active: true });
    }
  });

  return true;
}

export function handleClickAddBanner(sendResponse: (response?: any) => void) {
  browser.tabs.query({ active: true, currentWindow: true }, async tabs => {
    if (tabs.length > 0) {
      try {
        await browser.scripting.executeScript({
          target: { tabId: tabs[0].id! },
          func: () => {
            const addBanner = document.querySelectorAll('table[id="banners-list"]')[0]?.nextElementSibling;
            if (addBanner) {
              (addBanner as HTMLElement).click();
              return { success: true };
            }
            return { success: false, error: 'Button not found' };
          },
        });
        sendResponse({ success: true });
      } catch (error: any) {
        console.error('Error clicking addBanner:', error);
        sendResponse({ success: false, error: error.message || String(error) });
      }
    }
  });
  return true;
}
