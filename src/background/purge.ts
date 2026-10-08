import { config } from '@/config/prolo';

export function handleOpenPurgeAndSubmit(message: any, sender: any) {
  void (async () => {
    const origin = config.prologisticsProdHost;
    const requestURL = `${origin}${config.paths.purge}`;
    let tabId: number | undefined;

    try {
      const tab = await browser.tabs.create({ url: requestURL, active: false });
      tabId = tab.id;
      if (tabId == null) throw new Error('Failed to create purge tab');

      // Wait until the purge tab finishes loading
      await new Promise<void>(resolve => {
        const listener = (id: number, changeInfo: { status?: string }) => {
          if (id === tabId && changeInfo.status === 'complete') {
            browser.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        browser.tabs.onUpdated.addListener(listener);
      });

      let domain = (message.domain as string) || '';
      if (domain.startsWith('www.')) domain = domain.slice(4);

      let urlsPath = message.urlsValue as string;
      try {
        const u = new URL(message.urlsValue);
        urlsPath = u.pathname || '/';
        if (!urlsPath.endsWith('/')) urlsPath += '/';
      } catch {
        if (!urlsPath.endsWith('/')) urlsPath += '/';
      }

      const results = await browser.scripting.executeScript({
        target: { tabId },
        func: async (args: { domain: string; urlsPath: string }) => {
          try {
            const formData = new FormData();
            formData.append('domain', args.domain);
            formData.append('prio', '1');
            formData.append('urls', args.urlsPath);
            formData.append('purge', 'Purge');

            const resp = await fetch(`${window.location.origin}/purge.php`, {
              method: 'POST',
              body: formData,
              credentials: 'include',
            });

            const text = await resp.text();
            return { ok: resp.ok, status: resp.status, text };
          } catch (err) {
            return {
              ok: false,
              error: err instanceof Error ? err.toString() : String(err),
            };
          }
        },
        args: [{ domain, urlsPath }],
      });

      const result = results[0]?.result ?? { ok: false, error: 'No script result' };

      if (tabId != null) {
        await browser.tabs.remove(tabId).catch(() => {});
      }

      // Do NOT await — avoids false "channel closed" errors
      if (sender.tab?.id != null) {
        void browser.tabs
          .sendMessage(sender.tab.id, {
            action: 'openPurgeAndSubmitResult',
            result,
          })
          .catch(() => {});
      }
    } catch (err) {
      if (tabId != null) {
        await browser.tabs.remove(tabId).catch(() => {});
      }

      if (sender.tab?.id != null) {
        void browser.tabs
          .sendMessage(sender.tab.id, {
            action: 'openPurgeAndSubmitResult',
            result: {
              ok: false,
              error: err instanceof Error ? err.toString() : String(err),
            },
          })
          .catch(() => {});
      }
    }
  })();

  // Important: do not return true (we are not using sendResponse)
  return;
}
