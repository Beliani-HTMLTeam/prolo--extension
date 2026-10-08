import {
  saveZipToServiceWorkerStorageFromBlob,
  saveZipToServiceWorkerStorageFromArray,
  clearZipFromServiceWorkerStorage,
  extractFileFromServiceWorkerZip,
} from './zipStorage';

export function handleSaveZipToStorage(message: any, sendResponse: (response?: any) => void) {
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

export function handleClearZipStorage(sendResponse: (response?: any) => void) {
  clearZipFromServiceWorkerStorage().then(() => {
    sendResponse({ status: 'cleared' });
  });
  return true;
}

export function handleExtractFileFromZip(message: any, sendResponse: (response?: any) => void) {
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
