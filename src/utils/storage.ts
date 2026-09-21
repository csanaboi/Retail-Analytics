import { RawWeeklySale, StoreMaster, SanitizationLog, PersistedDataset, StorageInfo } from '../types';

const DB_NAME = 'RetailSalesIntelligenceDB';
const DB_VERSION = 1;
const STORE_NAME = 'uploaded_datasets';
const RECORD_KEY = 'active_dataset';
const LOCAL_STORAGE_KEY = 'retail_sales_active_dataset';

/**
 * Open or upgrade the IndexedDB database instance safely
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to open IndexedDB'));
      };

      request.onblocked = () => {
        console.warn('IndexedDB database open request is blocked.');
      };
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Persist uploaded dataset to browser storage (IndexedDB with localStorage fallback)
 */
export async function saveUploadedDataset(payload: {
  rawSales: RawWeeklySale[];
  storeMaster: StoreMaster[];
  sanitizationLog?: SanitizationLog;
  salesFileName?: string | null;
  storesFileName?: string | null;
  isBenchmark?: boolean;
}): Promise<{ success: boolean; storageType: 'indexedDB' | 'localStorage' | 'none'; error?: string }> {
  const datasetRecord: PersistedDataset = {
    id: RECORD_KEY,
    rawSales: payload.rawSales,
    storeMaster: payload.storeMaster,
    sanitizationLog: payload.sanitizationLog,
    salesFileName: payload.salesFileName || null,
    storesFileName: payload.storesFileName || null,
    updatedAt: new Date().toISOString(),
    recordsCount: payload.rawSales.length,
    isBenchmark: Boolean(payload.isBenchmark),
  };

  // 1. Try IndexedDB first (can easily store full datasets without 5MB quota restrictions)
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const putRequest = store.put(datasetRecord);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
      transaction.onerror = () => reject(transaction.error);
    });

    // Also mirror a lightweight metadata flag in localStorage for quick sync check
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(
          'retail_sales_storage_meta',
          JSON.stringify({
            persisted: true,
            recordsCount: payload.rawSales.length,
            updatedAt: datasetRecord.updatedAt,
            source: 'indexedDB',
            salesFileName: payload.salesFileName,
            storesFileName: payload.storesFileName,
          })
        );
      }
    } catch {
      // Non-critical mirror
    }

    return { success: true, storageType: 'indexedDB' };
  } catch (idbErr) {
    console.warn('IndexedDB write failed, attempting localStorage fallback:', idbErr);
  }

  // 2. Fallback to localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const serialized = JSON.stringify(datasetRecord);
      window.localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
      return { success: true, storageType: 'localStorage' };
    }
  } catch (lsErr) {
    console.error('LocalStorage fallback write also failed (likely quota exceeded):', lsErr);
    return {
      success: false,
      storageType: 'none',
      error: 'Unable to write to IndexedDB or LocalStorage. Browser sandbox or storage quota restriction active.',
    };
  }

  return { success: false, storageType: 'none' };
}

/**
 * Retrieve persisted dataset from browser storage on app initialization or reload
 */
export async function loadUploadedDataset(): Promise<PersistedDataset | null> {
  // 1. Try IndexedDB first
  try {
    const db = await openDatabase();
    const record = await new Promise<PersistedDataset | null>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(RECORD_KEY);

      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
      };
      getRequest.onerror = () => reject(getRequest.error);
      transaction.onerror = () => reject(transaction.error);
    });

    if (record && Array.isArray(record.rawSales) && record.rawSales.length > 0) {
      return { ...record, _storageType: 'indexedDB' };
    }
  } catch (idbErr) {
    console.warn('IndexedDB load encountered an issue, checking localStorage fallback:', idbErr);
  }

  // 2. Fallback to localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (item) {
        const parsed = JSON.parse(item) as PersistedDataset;
        if (parsed && Array.isArray(parsed.rawSales) && parsed.rawSales.length > 0) {
          return { ...parsed, _storageType: 'localStorage' };
        }
      }
    }
  } catch (lsErr) {
    console.warn('LocalStorage read failed:', lsErr);
  }

  return null;
}

/**
 * Delete persisted dataset and revert back to benchmark data clean slate
 */
export async function clearUploadedDataset(): Promise<boolean> {
  let cleared = false;

  // Clear IndexedDB
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const delRequest = store.delete(RECORD_KEY);

      delRequest.onsuccess = () => resolve();
      delRequest.onerror = () => reject(delRequest.error);
      transaction.onerror = () => reject(transaction.error);
    });
    cleared = true;
  } catch (err) {
    console.warn('IndexedDB delete failed:', err);
  }

  // Clear localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      window.localStorage.removeItem('retail_sales_storage_meta');
      cleared = true;
    }
  } catch (err) {
    console.warn('LocalStorage cleanup failed:', err);
  }

  return cleared;
}

/**
 * Inspect storage availability and current status
 */
export async function getStorageInfo(): Promise<StorageInfo> {
  const loaded = await loadUploadedDataset();
  if (loaded && loaded.rawSales && loaded.rawSales.length > 0) {
    return {
      isPersisted: true,
      recordsCount: loaded.rawSales.length,
      updatedAt: loaded.updatedAt || null,
      storageType: loaded._storageType || 'indexedDB',
      salesFileName: loaded.salesFileName || null,
      storesFileName: loaded.storesFileName || null,
    };
  }

  return {
    isPersisted: false,
    recordsCount: 0,
    updatedAt: null,
    storageType: 'none',
  };
}
