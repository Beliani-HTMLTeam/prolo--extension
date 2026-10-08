import { SHOP_ID_TO_CODE } from '@/config/shopMaps';
import { isCashbackCampaign, findMatchingFiles } from './bannerFiles';
import { uploadBannersToInputs } from './injectedUpload';
import { getZipFromServiceWorkerStorage, clearZipFromServiceWorkerStorage } from './zipStorage';
import type { QueueItem } from './types';

export function registerBannerQueue() {
  let processingQueue: QueueItem[] = [];
  let currentTabId: number | null = null;
  let isProcessing: boolean = false;
  let isTabProcessing: boolean = false;
  let currentQueueIndex: number = 0;
  let pendingUploadData: any = null;

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
              func: (shopIdMap: Record<string, string>) => {
                const params = new URLSearchParams(window.location.search);
                const shopId = params.get('shop_id');
                return shopIdMap[shopId || ''];
              },
              args: [SHOP_ID_TO_CODE],
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
            func: (shopIdMap: Record<string, string>) => {
              const params = new URLSearchParams(window.location.search);
              const shopId = params.get('shop_id');
              return shopIdMap[shopId || ''];
            },
            args: [SHOP_ID_TO_CODE],
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

  const handleProcessTabsSequentially = (message: any, sendResponse: (response?: any) => void) => {
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
  };

  return { handleProcessTabsSequentially };
}
