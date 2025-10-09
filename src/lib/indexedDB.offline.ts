// Offline recording persistence
export interface PendingRecording {
  client_event_id: string;
  consultation_id: string;
  blob: Blob;
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  created_at: string;
  retry_count: number;
}

export const savePendingRecording = async (recording: Omit<PendingRecording, 'created_at'>) => {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('prontivus', 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pending_recordings'], 'readwrite');
      const store = transaction.objectStore('pending_recordings');

      const fullRecording: PendingRecording = {
        ...recording,
        created_at: new Date().toISOString(),
      };

      const addRequest = store.add(fullRecording);

      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    };

    request.onerror = () => reject(request.error);
  });
};

export const getPendingRecordings = async (): Promise<PendingRecording[]> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('prontivus', 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pending_recordings'], 'readonly');
      const store = transaction.objectStore('pending_recordings');
      const getRequest = store.getAll();

      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };

    request.onerror = () => reject(request.error);
  });
};

export const deletePendingRecording = async (clientEventId: string) => {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('prontivus', 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pending_recordings'], 'readwrite');
      const store = transaction.objectStore('pending_recordings');
      const deleteRequest = store.delete(clientEventId);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };

    request.onerror = () => reject(request.error);
  });
};

export const updateRecordingStatus = async (
  clientEventId: string,
  status: PendingRecording['status']
) => {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('prontivus', 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pending_recordings'], 'readwrite');
      const store = transaction.objectStore('pending_recordings');
      const getRequest = store.get(clientEventId);

      getRequest.onsuccess = () => {
        const recording = getRequest.result;
        if (recording) {
          recording.status = status;
          const updateRequest = store.put(recording);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Recording not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    };

    request.onerror = () => reject(request.error);
  });
};
