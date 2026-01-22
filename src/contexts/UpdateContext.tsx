import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'error'
  | 'up-to-date';

interface UpdateInfo {
  version: string;
  currentVersion: string;
  date?: string;
  body?: string;
}

interface DownloadProgress {
  downloaded: number;
  total: number | null;
  percent: number;
}

interface UpdateContextType {
  status: UpdateStatus;
  updateInfo: UpdateInfo | null;
  progress: DownloadProgress;
  error: string | null;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  dismissUpdate: () => void;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<DownloadProgress>({ downloaded: 0, total: null, percent: 0 });
  const [error, setError] = useState<string | null>(null);
  const [updateInstance, setUpdateInstance] = useState<Update | null>(null);

  const checkForUpdates = useCallback(async () => {
    try {
      setStatus('checking');
      setError(null);

      const update = await check();

      if (update) {
        setUpdateInfo({
          version: update.version,
          currentVersion: update.currentVersion,
          date: update.date,
          body: update.body ?? undefined,
        });
        setUpdateInstance(update);
        setStatus('available');
      } else {
        setStatus('up-to-date');
        setUpdateInfo(null);
        setUpdateInstance(null);
      }
    } catch (err) {
      console.error('Failed to check for updates:', err);
      setError(err instanceof Error ? err.message : 'Failed to check for updates');
      setStatus('error');
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    if (!updateInstance) {
      setError('No update available to download');
      return;
    }

    try {
      setStatus('downloading');
      setProgress({ downloaded: 0, total: null, percent: 0 });

      let totalSize: number | null = null;
      let downloadedSize = 0;

      await updateInstance.download((event) => {
        if (event.event === 'Started') {
          totalSize = event.data.contentLength ?? null;
          setProgress({ downloaded: 0, total: totalSize, percent: 0 });
        } else if (event.event === 'Progress') {
          downloadedSize += event.data.chunkLength;
          const percent = totalSize ? Math.round((downloadedSize / totalSize) * 100) : 0;
          setProgress({ downloaded: downloadedSize, total: totalSize, percent });
        } else if (event.event === 'Finished') {
          setProgress(prev => ({ ...prev, percent: 100 }));
        }
      });

      setStatus('ready');
    } catch (err) {
      console.error('Failed to download update:', err);
      setError(err instanceof Error ? err.message : 'Failed to download update');
      setStatus('error');
    }
  }, [updateInstance]);

  const installUpdate = useCallback(async () => {
    if (!updateInstance) {
      setError('No update available to install');
      return;
    }

    try {
      await updateInstance.install();
      await updateInstance.close();
      await relaunch();
    } catch (err) {
      console.error('Failed to install update:', err);
      setError(err instanceof Error ? err.message : 'Failed to install update');
      setStatus('error');
    }
  }, [updateInstance]);

  const dismissUpdate = useCallback(() => {
    setStatus('idle');
    setUpdateInfo(null);
    setError(null);
    if (updateInstance) {
      updateInstance.close().catch(console.error);
      setUpdateInstance(null);
    }
  }, [updateInstance]);

  // Auto-check for updates on mount (with delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 3000); // 3 second delay after app starts

    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  return (
    <UpdateContext.Provider
      value={{
        status,
        updateInfo,
        progress,
        error,
        checkForUpdates,
        downloadUpdate,
        installUpdate,
        dismissUpdate,
      }}
    >
      {children}
    </UpdateContext.Provider>
  );
}

export function useUpdate() {
  const context = useContext(UpdateContext);
  if (context === undefined) {
    throw new Error('useUpdate must be used within an UpdateProvider');
  }
  return context;
}
