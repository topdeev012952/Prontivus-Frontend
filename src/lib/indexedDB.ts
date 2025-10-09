export const initIndexedDB = () => {
  const request = indexedDB.open('prontivus', 1);

  request.onerror = () => {
    console.error('Failed to open IndexedDB');
  };

  request.onsuccess = () => {
    console.log('IndexedDB initialized successfully');
  };

  request.onupgradeneeded = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;

    // Notifications store
    if (!db.objectStoreNames.contains('notifications')) {
      const notificationsStore = db.createObjectStore('notifications', { keyPath: 'id' });
      notificationsStore.createIndex('timestamp', 'timestamp', { unique: false });
      notificationsStore.createIndex('read', 'read', { unique: false });
    }

    // Pending sync events store
    if (!db.objectStoreNames.contains('pending_sync')) {
      const syncStore = db.createObjectStore('pending_sync', { keyPath: 'id' });
      syncStore.createIndex('timestamp', 'timestamp', { unique: false });
    }

    // Offline data cache
    if (!db.objectStoreNames.contains('offline_cache')) {
      const cacheStore = db.createObjectStore('offline_cache', { keyPath: 'key' });
      cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
    }

    // Pending recordings store
    if (!db.objectStoreNames.contains('pending_recordings')) {
      const recordingsStore = db.createObjectStore('pending_recordings', { keyPath: 'client_event_id' });
      recordingsStore.createIndex('consultation_id', 'consultation_id', { unique: false });
      recordingsStore.createIndex('status', 'status', { unique: false });
    }
  };
};
