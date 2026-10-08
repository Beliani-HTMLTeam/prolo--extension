import { checkForUpdate } from '@/entrypoints/updater.content/checker';
import { handleOpenPurgeAndSubmit } from './purge';
import { handleNextTab, handlePrevTab, handleClickAddBanner } from './tabActions';
import { handleSaveZipToStorage, handleClearZipStorage, handleExtractFileFromZip } from './zipHandlers';

type SendResponse = (response?: any) => void;
type Handler = (message: any, sender: any, sendResponse: SendResponse) => boolean | void;

export function createMessageRouter(extra: {
  handleProcessTabsSequentially: (message: any, sendResponse: SendResponse) => boolean;
}) {
  const handlers = new Map<string, Handler>([
    [
      'efg:checkForUpdate',
      (_message, _sender, sendResponse) => {
        void checkForUpdate().finally(() => {
          try {
            sendResponse({ ok: true });
          } catch {
            /* */
          }
        });
        return true;
      },
    ],
    ['nextTab', () => handleNextTab()],
    ['openPurgeAndSubmit', (message, sender) => handleOpenPurgeAndSubmit(message, sender)],
    ['saveZipToStorage', (message, _sender, sendResponse) => handleSaveZipToStorage(message, sendResponse)],
    ['prevTab', () => handlePrevTab()],
    [
      'processTabsSequentially',
      (message, _sender, sendResponse) => extra.handleProcessTabsSequentially(message, sendResponse),
    ],
    ['clearZipStorage', (_message, _sender, sendResponse) => handleClearZipStorage(sendResponse)],
    ['extractFileFromZip', (message, _sender, sendResponse) => handleExtractFileFromZip(message, sendResponse)],
    ['clickAddBanner', (_message, _sender, sendResponse) => handleClickAddBanner(sendResponse)],
  ]);

  return (message: any, sender: any, sendResponse: SendResponse) =>
    handlers.get(message?.action)?.(message, sender, sendResponse);
}
