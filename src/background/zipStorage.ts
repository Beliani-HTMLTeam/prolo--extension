import JSZip from 'jszip';

const DB_NAME = 'ZipStorage_SW';
const DB_VERSION = 1;
const STORE_NAME = 'zipFiles';

let db: IDBDatabase | null = null;

export function openDatabase(): Promise<IDBDatabase> {
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
export async function saveZipToServiceWorkerStorageFromBlob(blob: Blob, zipName: string): Promise<void> {
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

export async function saveZipToServiceWorkerStorageFromArray(zipData: number[], zipName: string): Promise<void> {
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

export async function getZipFromServiceWorkerStorage(): Promise<File | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get('currentZip');

    request.onsuccess = () => resolve(request.result as File | null);
    request.onerror = () => reject(request.error);
  });
}

export async function clearZipFromServiceWorkerStorage(): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete('currentZip');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function extractFileFromServiceWorkerZip(fileName: string): Promise<File | null> {
  const zipBlob = await getZipFromServiceWorkerStorage();
  if (!zipBlob) return null;

  const zip = await JSZip.loadAsync(zipBlob);
  const file = zip.file(fileName);

  if (!file) return null;

  const blob = await file.async('blob');
  return new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
}
