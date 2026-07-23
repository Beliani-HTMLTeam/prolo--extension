import { initUpdateChecker, checkForUpdate } from './updater.content/checker';

import JSZip from 'jszip';

const DB_NAME = 'ZipStorage_SW';
const DB_VERSION = 1;
const STORE_NAME = 'zipFiles';

let db: IDBDatabase | null = null;

interface FileInfo {
  originalName: string;
  extra?: string[];
  [key: string]: any;
}

interface QueueItem {
  name: string;
  slug: string;
  url: string;
  filesInfo: {
    desktop?: FileInfo[];
    mobile?: FileInfo[];
  };
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

// Add these functions to handle blob storage
async function saveZipToServiceWorkerStorageFromBlob(blob: Blob, zipName: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Create File from Blob
    const zipFile = new File([blob], zipName, { type: 'application/zip' });

    const request = store.put(zipFile, 'currentZip');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function saveZipToServiceWorkerStorageFromArray(zipData: number[], zipName: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Create Blob from array data
    const blob = new Blob([new Uint8Array(zipData)], { type: 'application/zip' });
    const zipFile = new File([blob], zipName, { type: 'application/zip' });

    const request = store.put(zipFile, 'currentZip');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getZipFromServiceWorkerStorage(): Promise<File | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get('currentZip');

    request.onsuccess = () => resolve(request.result as File | null);
    request.onerror = () => reject(request.error);
  });
}

async function clearZipFromServiceWorkerStorage(): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete('currentZip');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function extractFileFromServiceWorkerZip(fileName: string): Promise<File | null> {
  const zipBlob = await getZipFromServiceWorkerStorage();
  if (!zipBlob) return null;

  const zip = await JSZip.loadAsync(zipBlob);
  const file = zip.file(fileName);

  if (!file) return null;

  const blob = await file.async('blob');
  return new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
}

export default defineBackground(() => {
  let processingQueue: QueueItem[] = [];
  let currentTabId: number | null = null;
  let isProcessing: boolean = false;
  let isTabProcessing: boolean = false;
  let currentQueueIndex: number = 0;
  let pendingUploadData: any = null;
  
  browser.action.onClicked.addListener(tab => {
    console.log('Extension icon clicked');
    // You can send message to open popup or trigger something
    browser.tabs.sendMessage(tab.id!, { action: 'togglePopup' }).catch(() => {});
  });

  const parseFileName = (fileName: string) => {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '').trim();

    // pattern: SLUG_device or SLUG_device_EXTRA
    const parts = nameWithoutExt.split('_').filter(Boolean); // remove empty parts

    if (parts.length < 2) return null;

    const slug = parts[0].toUpperCase();
    const deviceType = parts[1].toLowerCase();

    // check if device is valid
    if (!['desktop', 'mobile'].includes(deviceType)) return null;

    const extra = parts.slice(2).map(part => part.toUpperCase());

    return {
      slug,
      deviceType,
      extra,
      fullName: nameWithoutExt,
      originalName: fileName,
    };
  };

  const isCashbackCampaign = (filesInfo: any) => {
    return (
      filesInfo.desktop?.some((file: any) => file.extra && file.extra.length > 0) ||
      filesInfo.mobile?.some((file: any) => file.extra && file.extra.length > 0)
    );
  };

  const findMatchingFiles = (
    filesInfo: any,
    targetSlug: string,
    currentShop: string | undefined,
    deviceType: 'desktop' | 'mobile',
    isCashback = false,
  ): any[] => {
    const matches: any[] = [];

    if (!filesInfo[deviceType]) return matches;

    for (const file of filesInfo[deviceType]) {
      if (isCashback) {
        matches.push({
          ...file,
          variantKey: file.extra && file.extra.length > 0 ? file.extra.join('-') : 'default',
          priority: 1,
        });
      }
      // for regular campaigns without extra parts
      else if (!isCashback && (!file.extra || file.extra.length === 0)) {
        matches.push({
          ...file,
          priority: 1,
        });
      }
      // for regular campaigns with extra parts
      else if (!isCashback && file.extra && file.extra.length > 0) {
        // check if extra matches current shop
        if (file.extra[0] === currentShop || file.extra[0] === targetSlug) {
          matches.push({
            ...file,
            variantKey: file.extra.join('-'),
            priority: 1,
          });
        } else {
          matches.push({
            ...file,
            variantKey: file.extra.join('-'),
            priority: 3,
          });
        }
      }
    }
    return matches.sort((a, b) => (a.priority || 99) - (b.priority || 99));
  };

  browser.runtime.onMessage.addListener((message: any, sender: any, sendResponse: (response?: any) => void) => {
    if (message?.action === 'efg:checkForUpdate') {
      void checkForUpdate().finally(() => {
        try {
          sendResponse({ ok: true });
        } catch {
          /* */
        }
      });
      return true;
    }

    if (message.action === 'nextTab') {
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
    if (message.action === 'saveZipToStorage') {
      console.log('Saving ZIP to service worker storage...');

      // Check if we received a blobUrl (for large files) or array data (for small files)
      if (message.blobUrl) {
        // For large files - fetch the blob from the URL
        fetch(message.blobUrl)
          .then(response => response.blob())
          .then(blob => {
            return saveZipToServiceWorkerStorageFromBlob(blob, message.zipName);
          })
          .then(() => {
            console.log('Large ZIP saved successfully');
            sendResponse({ status: 'success' });
          })
          .catch(error => {
            console.error('Error saving large ZIP:', error);
            sendResponse({ status: 'error', error: error.message });
          });
      } else if (message.zipData) {
        // For small files - handle array data
        saveZipToServiceWorkerStorageFromArray(message.zipData, message.zipName)
          .then(() => {
            console.log('ZIP saved successfully');
            sendResponse({ status: 'success' });
          })
          .catch(error => {
            console.error('Error saving ZIP:', error);
            sendResponse({ status: 'error', error: error.message });
          });
      } else {
        sendResponse({ status: 'error', error: 'No data provided' });
      }

      return true; // indicate async response
    }

    if (message.action === 'prevTab') {
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

    if (message.action === 'processTabsSequentially') {
      processingQueue = message.data;
      currentQueueIndex = 0;
      isProcessing = true;

      console.log('Processing queue initialized:');
      processingQueue.forEach((item, index) => {
        console.log(
          `  ${index}: ${item.name} - slug: ${item.slug} - files: desktop=${item.filesInfo?.desktop?.length}, mobile=${item.filesInfo?.mobile?.length}`,
        );
      });

      // Verify ZIP exists
      getZipFromServiceWorkerStorage()
        .then(zipFile => {
          if (!zipFile) {
            console.error('No ZIP found in service worker storage!');
            sendResponse({ status: 'error', error: 'No ZIP found' });
            isProcessing = false;
            return;
          }
          console.log(`ZIP found in storage, size: ${zipFile.size} bytes`);
          processNextInQueue();
          sendResponse({ status: 'started' });
        })
        .catch(error => {
          console.error('Error checking ZIP storage:', error);
          sendResponse({ status: 'error', error: error.message });
          isProcessing = false;
        });

      return true;
    }

    if (message.action === 'clearZipStorage') {
      clearZipFromServiceWorkerStorage().then(() => {
        sendResponse({ status: 'cleared' });
      });
      return true;
    }

    if (message.action === 'extractFileFromZip') {
      console.log(`Extracting file: ${message.fileName}`);

      extractFileFromServiceWorkerZip(message.fileName)
        .then(async file => {
          if (file) {
            const arrayBuffer = await file.arrayBuffer();
            console.log(`Successfully extracted ${message.fileName}, size: ${arrayBuffer.byteLength} bytes`);
            sendResponse({
              fileData: Array.from(new Uint8Array(arrayBuffer)),
              success: true,
            });
          } else {
            console.log(`File not found: ${message.fileName}`);
            sendResponse({
              fileData: null,
              success: false,
              error: 'File not found in zip',
            });
          }
        })
        .catch(error => {
          console.error('Error extracting file:', error);
          sendResponse({
            fileData: null,
            success: false,
            error: error.message,
          });
        });

      return true;
    }

    if (message.action === 'clickAddBanner') {
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
  });

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Check for pending upload after navigation
    if (pendingUploadData && tabId === currentTabId && changeInfo.status === 'complete') {
      console.log('🎯 Processing pending upload after navigation...');

      const uploadData = pendingUploadData;
      pendingUploadData = null;

      // Wait for form to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify we're on the correct page
      const isOnForm = await browser.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          const form = document.querySelector('form.banner-form');
          console.log('Form found on page:', !!form);
          return !!form;
        },
      });

      if (!isOnForm[0]?.result) {
        console.error('Form not found after navigation!');
        await browser.tabs.remove(tabId);
        currentQueueIndex++;
        processNextInQueue();
        return;
      }

      console.log('Form ready, uploading files...');

      // Upload the banners
      const uploadResult = await uploadBannersToInputs(tabId, uploadData.filesToUpload, uploadData.isCashback);
      console.log('✅ Upload result after navigation:', uploadResult);

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Wait and then move to next
      setTimeout(async () => {
        console.log('✅ Processing complete for this shop');
        currentQueueIndex++;
        processNextInQueue();
      }, 5000);

      return;
    }

    // Only process if this is the current tab, we're processing, and not already processing this tab
    if (isProcessing && tabId === currentTabId && changeInfo.status === 'complete' && !isTabProcessing) {
      isTabProcessing = true;

      console.log('Tab fully loaded, waiting before clicking...');

      setTimeout(async () => {
        try {
          // Get the current item using the index
          const currentItem = processingQueue[currentQueueIndex];
          if (!currentItem) {
            console.error('No current item found');
            currentQueueIndex++;
            isTabProcessing = false;
            processNextInQueue();
            return;
          }

          console.log(`Processing item: ${currentItem.name} with slug: ${currentItem.slug}`);

          // Check if we're already on the banner form page
          const isOnBannerForm = await browser.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
              const form = document.querySelector('form.banner-form');
              return !!form;
            },
          });

          // If we're already on the banner form page, skip clicking Add Banner
          if (isOnBannerForm[0]?.result) {
            console.log('Already on banner form page, uploading files directly...');

            // Wait for form to stabilize
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Proceed directly to upload
            const filesInfo = currentItem.filesInfo;
            const isCashback = isCashbackCampaign(filesInfo);

            // Get current shop from URL
            const currentShopResult = await browser.scripting.executeScript({
              target: { tabId: tabId },
              func: () => {
                const params = new URLSearchParams(window.location.search);
                const shopId = params.get('shop_id');
                const shopIdMap: Record<string, string> = {
                  2: 'UK',
                  12: 'PL',
                  1: 'CH',
                  3: 'DE',
                  8: 'AT',
                  17: 'NL',
                  7: 'FR',
                  10: 'ES',
                  22: 'PT',
                  21: 'IT',
                  25: 'DK',
                  28: 'NO',
                  27: 'FI',
                  23: 'SE',
                  26: 'CZ',
                  29: 'SK',
                  24: 'HU',
                  30: 'RO',
                  19: 'BE',
                  33: 'HR',
                  34: 'SI',
                };
                return shopIdMap[shopId || ''];
              },
            });

            const currentShop = currentShopResult[0]?.result;

            const desktopMatches = findMatchingFiles(filesInfo, currentItem.slug, currentShop, 'desktop', isCashback);
            const mobileMatches = findMatchingFiles(filesInfo, currentItem.slug, currentShop, 'mobile', isCashback);

            const filesToUpload: Array<{
              fileName: string;
              deviceType: 'desktop' | 'mobile';
              variantKey: string | null;
            }> = [];

            for (const match of desktopMatches) {
              filesToUpload.push({
                fileName: match.originalName,
                deviceType: 'desktop',
                variantKey: match.variantKey || null,
              });
            }

            for (const match of mobileMatches) {
              filesToUpload.push({
                fileName: match.originalName,
                deviceType: 'mobile',
                variantKey: match.variantKey || null,
              });
            }

            if (filesToUpload.length > 0) {
              console.log('Uploading files directly...');
              const uploadResult = await uploadBannersToInputs(tabId, filesToUpload, isCashback);
              console.log('Upload result:', uploadResult);
            }

            // Wait and move to next
            setTimeout(async () => {
              await browser.tabs.remove(tabId);
              currentQueueIndex++;
              isTabProcessing = false;
              processNextInQueue();
            }, 5000);

            return;
          }

          // Wait a bit for the page to stabilize
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Get current shop from URL
          const currentShopResult = await browser.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
              const params = new URLSearchParams(window.location.search);
              const shopId = params.get('shop_id');
              const shopIdMap: Record<string, string> = {
                2: 'UK',
                12: 'PL',
                1: 'CH',
                3: 'DE',
                8: 'AT',
                17: 'NL',
                7: 'FR',
                10: 'ES',
                22: 'PT',
                21: 'IT',
                25: 'DK',
                28: 'NO',
                27: 'FI',
                23: 'SE',
                26: 'CZ',
                29: 'SK',
                24: 'HU',
                30: 'RO',
                19: 'BE',
                33: 'HR',
                34: 'SI',
              };
              return shopIdMap[shopId || ''];
            },
          });

          const currentShop = currentShopResult[0]?.result;
          console.log(`Current shop in tab: ${currentShop}`);
          console.log(`Expected shop from queue: ${currentItem.slug}`);

          // Check if the shop matches
          if (currentItem.slug !== currentShop) {
            console.error(`Shop mismatch! Expected: ${currentItem.slug}, Got: ${currentShop}`);
            console.log('Closing this tab and moving to next item...');

            await browser.tabs.remove(tabId);
            currentQueueIndex++;
            isTabProcessing = false;
            processNextInQueue();
            return;
          }

          console.log(`✅ Shop matches! Processing ${currentShop}`);

          const filesInfo = currentItem.filesInfo;
          const isCashback = isCashbackCampaign(filesInfo);

          console.log(`Campaign type: ${isCashback ? 'Cashback' : 'Regular'}`);

          // Find matching files for this shop
          const desktopMatches = findMatchingFiles(filesInfo, currentItem.slug, currentShop, 'desktop', isCashback);
          const mobileMatches = findMatchingFiles(filesInfo, currentItem.slug, currentShop, 'mobile', isCashback);

          console.log(`Found ${desktopMatches.length} desktop files, ${mobileMatches.length} mobile files`);

          if (desktopMatches.length > 0) {
            console.log(
              'Desktop files:',
              desktopMatches.map(f => f.originalName),
            );
          }
          if (mobileMatches.length > 0) {
            console.log(
              'Mobile files:',
              mobileMatches.map(f => f.originalName),
            );
          }

          const filesToUpload = [];

          for (const match of desktopMatches) {
            filesToUpload.push({
              fileName: match.originalName,
              deviceType: 'desktop',
              variantKey: match.variantKey || null,
            });
          }

          for (const match of mobileMatches) {
            filesToUpload.push({
              fileName: match.originalName,
              deviceType: 'mobile',
              variantKey: match.variantKey || null,
            });
          }

          if (filesToUpload.length === 0) {
            console.log('No matching files to upload for this shop');
            await browser.tabs.remove(tabId);
            currentQueueIndex++;
            isTabProcessing = false;
            processNextInQueue();
            return;
          }

          console.log(
            `Files to upload for ${currentShop}:`,
            filesToUpload.map(f => f.fileName),
          );

          // Click the Add Banner button
          console.log('Looking for Add Banner button...');

          const clickResult = await browser.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
              // Find the Add Banner button
              const table = document.querySelector('table[id="banners-list"]');
              let addBanner: HTMLElement | null = null;

              if (table && table.nextElementSibling && table.nextElementSibling.tagName === 'A') {
                addBanner = table.nextElementSibling as HTMLElement;
              }

              if (!addBanner) {
                const links = Array.from(document.querySelectorAll('a'));
                addBanner = links.find(
                  link => link.textContent?.includes('Add Banner') || link.textContent?.includes('Add New Banner'),
                ) as HTMLElement | null;
              }

              if (addBanner) {
                addBanner.click();
                return { success: true };
              }
              return { success: false, error: 'Button not found' };
            },
          });

          if (!clickResult[0]?.result?.success) {
            console.error('Failed to click Add Banner');
            await browser.tabs.remove(tabId);
            currentQueueIndex++;
            isTabProcessing = false;
            processNextInQueue();
            return;
          }

          console.log('Add Banner clicked, storing upload data for after navigation...');

          // Store the upload data for after navigation
          pendingUploadData = {
            filesToUpload,
            isCashback,
            currentShop,
            currentItemSlug: currentItem.slug,
            filesInfo: currentItem.filesInfo,
          };

          // Wait a bit for navigation to start
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Reset the flag so the next onUpdated can process
          isTabProcessing = false;

          console.log('Navigation should happen, next onUpdated will handle upload');
        } catch (error) {
          console.error('Error executing script:', error);
          await browser.tabs.remove(tabId);
          currentQueueIndex++;
          isTabProcessing = false;
          setTimeout(() => {
            processNextInQueue();
          }, 5000);
        }
      }, 3000);
    }
  });

  const uploadBannersToInputs = async (
    tabId: number,
    filesToUpload: Array<{ fileName: string; deviceType: 'desktop' | 'mobile'; variantKey?: string | null }>,
    isCashback = false,
  ) => {
    console.log(`Uploading ${filesToUpload.length} files to tab ${tabId}, cashback: ${isCashback}`);
    console.log(
      'Files to upload:',
      filesToUpload.map(f => f.fileName),
    );

    return await browser.scripting.executeScript({
      target: { tabId: tabId },
      func: async (filesData, isCashbackMode) => {
        console.log('Inside page context, starting upload...');

        // Language mapping for cashback campaigns (copy from your assets)
        const COUNTRY_CASHBACK: Record<string, string> = {
          'UK-PL': 'polish',
          UK: 'english',
          'SK-HU': 'Hungarian',
          'SK-EN': 'english',
          'SK-CZ': 'czech',
          SK: 'slovak',
          SE: 'swedish',
          'SE-EN': 'english',
          RO: 'romanian',
          'RO-EN': 'english',
          PT: 'portugal',
          'PT-EN': 'english',
          PL: 'polish',
          'PL-EN': 'english',
          NO: 'norsk',
          'NO-EN': 'english',
          'NL-FR': 'french',
          'NL-EN': 'english',
          NL: 'dutch',
          IT: 'italian',
          'IT-EN': 'english',
          HU: 'Hungarian',
          'HU-EN': 'english',
          FR: 'french',
          'FR-NL': 'dutch',
          'FR-DE': 'germanDE',
          'FR-EN': 'english',
          FI: 'finnish',
          'FI-EN': 'english',
          'FI-SE': 'swedish',
          ES: 'spanish',
          'ES-EN': 'english',
          DK: 'danish',
          'DK-EN': 'english',
          DEAT: 'germanDE',
          'DEAT-EN': 'english',
          CZ: 'czech',
          'CZ-EN': 'english',
          'CZ-SK': 'slovak',
          CH: 'german',
          'CH-EN': 'english',
          'CH-FR': 'french',
          'CH-IT': 'italian',
          'BE-DE': 'germanDE',
          'BE-EN': 'english',
          'BE-FR': 'french',
          'BE-NL': 'dutch',
          HR: 'croatian',
          'HR-EN': 'english',
          SI: 'slovene',
          'SI-EN': 'english',
        };

        // Helper function to get the language from filename using COUNTRY_CASHBACK
        const getLanguageFromFilename = (fileName: string): string | undefined => {
          const nameWithoutExt = fileName
            .replace(/\.[^/.]+$/, '')
            .trim()
            .trim()
            .toUpperCase();
          const parts = nameWithoutExt.split('_');

          // Get the slug and extra parts
          const slug = parts[0];
          const extra = parts.slice(2).join('-'); // Join extra parts with dash

          // Construct key for lookup
          let key = slug;
          if (extra) {
            key = `${slug}-${extra}`;
          }

          // Look up in COUNTRY_CASHBACK
          const language = COUNTRY_CASHBACK[key];
          console.log(`Filename: ${fileName}, key: ${key}, mapped language: ${language}`);

          return language;
        };

        // Helper function to wait for element
        const waitForElement = (selector: string, timeout = 5000): Promise<Element | null> => {
          return new Promise(resolve => {
            const startTime = Date.now();
            const checkElement = () => {
              const element = document.querySelector(selector);
              if (element) {
                resolve(element);
              } else if (Date.now() - startTime > timeout) {
                console.error(`Element ${selector} not found after ${timeout}ms`);
                resolve(null);
              } else {
                setTimeout(checkElement, 200);
              }
            };
            checkElement();
          });
        };

        // Wait for form to be ready
        const form = (await waitForElement('form.banner-form', 10000)) as HTMLFormElement | null;
        if (!form) {
          console.error('Form not found');
          return { success: false, error: 'Form not found' };
        }

        console.log('Form found, waiting for inputs...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const allDesktopInputs = Array.from(
          form.querySelectorAll('input[type="file"][name^=pic][size="30"]'),
        ) as HTMLInputElement[];

        const allMobileInputs = Array.from(
          form.querySelectorAll('input[type="file"][name^=mobile_pic][size="30"]'),
        ) as HTMLInputElement[];

        console.log(`Found ${allDesktopInputs.length} desktop inputs, ${allMobileInputs.length} mobile inputs`);
        console.log(
          'Desktop input names:',
          Array.from(allDesktopInputs).map(i => i.name),
        );
        console.log(
          'Mobile input names:',
          Array.from(allMobileInputs).map(i => i.name),
        );

        // Function to extract file from background
        const extractFile = async (fileName: string, retries = 3): Promise<File | null> => {
          for (let attempt = 1; attempt <= retries; attempt++) {
            try {
              console.log(`Requesting file: ${fileName} (attempt ${attempt})`);
              const response = await new Promise<any>((resolve, reject) => {
                browser.runtime.sendMessage({ action: 'extractFileFromZip', fileName }, response => {
                  if (browser.runtime.lastError) {
                    reject(browser.runtime.lastError);
                  } else {
                    resolve(response);
                  }
                });
              });

              if (response && response.success && response.fileData) {
                const blob = new Blob([new Uint8Array(response.fileData)], {
                  type: 'application/octet-stream',
                });
                const file = new File([blob], fileName, {
                  type: blob.type || 'application/octet-stream',
                });
                console.log(`File created: ${fileName}, size: ${file.size} bytes`);
                return file;
              } else {
                console.log(`Attempt ${attempt} failed for ${fileName}:`, response?.error);
                if (attempt === retries) throw new Error(response?.error || 'Failed to extract file');
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (error) {
              console.error(`Error extracting ${fileName} (attempt ${attempt}):`, error);
              if (attempt === retries) throw error;
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }

          return null;
        };

        const results: Array<{
          fileName: string;
          success: boolean;
          deviceType?: 'desktop' | 'mobile';
          inputName?: string;
          error?: string;
        }> = [];

        // Separate desktop and mobile files
        const desktopFiles = (filesData as Array<{ fileName: string; deviceType: 'desktop' | 'mobile' }>).filter(
          f => f.deviceType === 'desktop',
        );
        const mobileFiles = (filesData as Array<{ fileName: string; deviceType: 'desktop' | 'mobile' }>).filter(
          f => f.deviceType === 'mobile',
        );

        console.log(`Processing ${desktopFiles.length} desktop files and ${mobileFiles.length} mobile files`);

        if (isCashbackMode) {
          // For cashback campaigns

          // Determine which mobile inputs to use (the second half)
          const totalMobileInputs = allMobileInputs.length;
          const halfIndex = Math.floor(totalMobileInputs / 2);
          const modernMobileInputs = Array.from(allMobileInputs).slice(halfIndex);

          console.log(
            `Total mobile inputs: ${totalMobileInputs}, using second half: indices ${halfIndex} to ${totalMobileInputs - 1}`,
          );
          console.log(
            'Modern mobile input names:',
            modernMobileInputs.map(i => i.name),
          );

          // Upload desktop files
          for (let i = 0; i < desktopFiles.length; i++) {
            const fileInfo = desktopFiles[i];
            try {
              console.log(`Processing desktop file ${i + 1}/${desktopFiles.length}: ${fileInfo.fileName}`);

              const file = await extractFile(fileInfo.fileName);
              if (!file) {
                console.error(`Failed to get file for ${fileInfo.fileName}`);
                results.push({ fileName: fileInfo.fileName, success: false, error: 'File extraction returned null' });
                continue;
              }

              // Get the target language using COUNTRY_CASHBACK mapping
              const targetLanguage = getLanguageFromFilename(fileInfo.fileName);
              console.log(`Looking for desktop input with language: ${targetLanguage}`);

              // Find input that matches this language
              let targetInput: HTMLInputElement | null = null;
              for (const input of allDesktopInputs) {
                const inputName = input.getAttribute('name');
                if (!inputName) continue;

                const match = inputName.match(/\[(.*?)\]/);
                if (match && targetLanguage) {
                  const inputLang = match[1].toLowerCase();
                  if (inputLang === targetLanguage.toLowerCase()) {
                    targetInput = input;
                    console.log(`Found matching desktop input: ${inputName} for language ${targetLanguage}`);
                    break;
                  }
                }
              }

              // Fallback to sequential if no match found
              if (!targetInput && i < allDesktopInputs.length) {
                targetInput = allDesktopInputs[i];
                console.log(`No language match, using desktop input ${i}: ${targetInput.name}`);
              }

              if (targetInput) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                targetInput.files = dataTransfer.files;
                targetInput.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`✅ Uploaded ${fileInfo.fileName} to ${targetInput.name}`);
                results.push({
                  fileName: fileInfo.fileName,
                  success: true,
                  deviceType: 'desktop',
                  inputName: targetInput.name,
                });
                await new Promise(resolve => setTimeout(resolve, 500));
              } else {
                console.error(`No target input found for ${fileInfo.fileName}`);
                results.push({ fileName: fileInfo.fileName, success: false, error: 'No target input found' });
              }
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : String(error);

              console.error(`Error uploading ${fileInfo.fileName}:`, error);
              results.push({
                fileName: fileInfo.fileName,
                success: false,
                error: errorMessage,
              });
            }
          }

          // Upload mobile files for cashback - use modernMobileInputs (second half)
          for (let i = 0; i < mobileFiles.length; i++) {
            const fileInfo = mobileFiles[i];
            try {
              console.log(`Processing mobile file ${i + 1}/${mobileFiles.length}: ${fileInfo.fileName}`);

              const file = await extractFile(fileInfo.fileName);
              if (!file) {
                console.error(`Failed to get file for ${fileInfo.fileName}`);
                results.push({ fileName: fileInfo.fileName, success: false, error: 'File extraction returned null' });
                continue;
              }

              // Get the target language using COUNTRY_CASHBACK mapping
              const targetLanguage = getLanguageFromFilename(fileInfo.fileName);
              console.log(`Looking for mobile input with language: ${targetLanguage}`);

              // Find input that matches this language in the modern mobile inputs
              let targetInput: HTMLInputElement | null = null;
              for (const input of modernMobileInputs) {
                const inputName = input.getAttribute('name');
                if (!inputName) continue;

                const match = inputName.match(/\[(.*?)\]/);
                if (match && targetLanguage) {
                  const inputLang = match[1].toLowerCase();
                  if (inputLang === targetLanguage.toLowerCase()) {
                    targetInput = input;
                    console.log(`Found matching mobile input: ${inputName} for language ${targetLanguage}`);
                    break;
                  }
                }
              }

              // Fallback to sequential if no match found
              if (!targetInput && i < modernMobileInputs.length) {
                targetInput = modernMobileInputs[i];
                console.log(`No language match, using mobile input ${i}: ${targetInput.name}`);
              }

              if (targetInput) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                targetInput.files = dataTransfer.files;
                targetInput.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`✅ Uploaded ${fileInfo.fileName} to ${targetInput.name}`);
                results.push({
                  fileName: fileInfo.fileName,
                  success: true,
                  deviceType: 'mobile',
                  inputName: targetInput.name,
                });
                await new Promise(resolve => setTimeout(resolve, 500));
              } else {
                console.error(`No target input found for ${fileInfo.fileName}`);
                results.push({ fileName: fileInfo.fileName, success: false, error: 'No target input found' });
              }
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.error(`Error uploading ${fileInfo.fileName}:`, error);
              results.push({ fileName: fileInfo.fileName, success: false, error: errorMessage });
            }
          }
        } else {
          // Regular campaign - use sequential slots
          for (let i = 0; i < desktopFiles.length; i++) {
            const fileInfo = desktopFiles[i];
            try {
              console.log(`Processing desktop file ${i + 1}/${desktopFiles.length}: ${fileInfo.fileName}`);

              const file = await extractFile(fileInfo.fileName);
              if (!file) {
                console.error(`Failed to get file for ${fileInfo.fileName}`);
                results.push({ fileName: fileInfo.fileName, success: false, error: 'File extraction returned null' });
                continue;
              }

              let targetInput = null;
              const currentIndex = results.filter(r => r.deviceType === 'desktop').length;

              if (currentIndex < allDesktopInputs.length) {
                targetInput = allDesktopInputs[currentIndex];
              }

              if (targetInput) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                targetInput.files = dataTransfer.files;
                targetInput.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`✅ Successfully uploaded ${fileInfo.fileName} to ${targetInput.name}`);
                results.push({
                  fileName: fileInfo.fileName,
                  success: true,
                  deviceType: 'desktop',
                  inputName: targetInput.name,
                });
                await new Promise(resolve => setTimeout(resolve, 500));
              } else {
                console.error(`No target input found for ${fileInfo.fileName}`);
                results.push({ fileName: fileInfo.fileName, success: false, error: 'No target input found' });
              }
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.error(`Error uploading ${fileInfo.fileName}:`, error);
              results.push({ fileName: fileInfo.fileName, success: false, error: errorMessage });
            }
          }

          // Upload mobile files for regular campaign
          const modernMobileInputs = Array.from(allMobileInputs).slice(17);

          for (let i = 0; i < mobileFiles.length; i++) {
            const fileInfo = mobileFiles[i];
            try {
              console.log(`Processing mobile file ${i + 1}/${mobileFiles.length}: ${fileInfo.fileName}`);

              const file = await extractFile(fileInfo.fileName);
              if (!file) {
                console.error(`Failed to get file for ${fileInfo.fileName}`);
                results.push({ fileName: fileInfo.fileName, success: false, error: 'File extraction returned null' });
                continue;
              }

              let targetInput = null;
              const currentIndex = results.filter(r => r.deviceType === 'mobile').length;

              if (currentIndex < modernMobileInputs.length) {
                targetInput = modernMobileInputs[currentIndex];
              }

              if (targetInput) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                targetInput.files = dataTransfer.files;
                targetInput.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`✅ Successfully uploaded ${fileInfo.fileName} to ${targetInput.name}`);
                results.push({
                  fileName: fileInfo.fileName,
                  success: true,
                  deviceType: 'mobile',
                  inputName: targetInput.name,
                });
                await new Promise(resolve => setTimeout(resolve, 500));
              } else {
                console.error(`No target input found for ${fileInfo.fileName}`);
                results.push({ fileName: fileInfo.fileName, success: false, error: 'No target input found' });
              }
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.error(`Error uploading ${fileInfo.fileName}:`, error);
              results.push({ fileName: fileInfo.fileName, success: false, error: errorMessage });
            }
          }
        }
        console.log('Upload complete. Results:', results);
        const totalFiles = Array.isArray(filesData) ? filesData.length : 0;
        const successCount = results.filter((r: any) => r.success).length;

        console.log(`✅ Successfully uploaded ${successCount}/${totalFiles} files`);

        return { success: true, results };
      },
      args: [filesToUpload, isCashback],
    });
  };

  function processNextInQueue() {
    if (currentQueueIndex >= processingQueue.length) {
      console.log('✅ All tabs processed!');
      const totalProcessed = processingQueue.length;

      browser.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs[0]) {
          browser.tabs.sendMessage(tabs[0].id!, {
            action: 'showModal',
            status: 'success',
            text: `All banners uploaded successfully! Processed ${totalProcessed} shops.`,
          });
        }
      });
      clearZipFromServiceWorkerStorage()
        .then(() => {
          console.log('🗑️ ZIP cleared from storage');
        })
        .catch(error => {
          console.error('Error clearing ZIP from storage:', error);
        });

      isProcessing = false;
      currentQueueIndex = 0;
      processingQueue = [];
      currentTabId = null;
      return;
    }

    const item = processingQueue[currentQueueIndex];
    console.log(
      `🔄 Processing item ${currentQueueIndex + 1}/${processingQueue.length}: ${item.name} - slug: ${item.slug}`,
    );
    console.log(
      `   Files available: desktop: ${item.filesInfo?.desktop?.length || 0}, mobile: ${item.filesInfo?.mobile?.length || 0}`,
    );

    browser.tabs.create({ url: item.url, active: true }, tab => {
      currentTabId = tab.id!;
      console.log(`📂 Opened tab ${tab.id} for ${item.name}`);
    });
  }
});
