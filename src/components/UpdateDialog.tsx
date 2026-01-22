import * as Dialog from '@radix-ui/react-dialog';
import { X, Download, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useUpdate } from '../contexts/UpdateContext';
import { Button } from './ui';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function UpdateDialog() {
  const {
    status,
    updateInfo,
    progress,
    error,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    dismissUpdate,
  } = useUpdate();

  const isOpen = status === 'available' || status === 'downloading' || status === 'ready' || status === 'error';

  const handleOpenChange = (open: boolean) => {
    if (!open && status !== 'downloading') {
      dismissUpdate();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          style={{ animation: 'fadeIn 150ms ease-out' }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-xl p-6 shadow-2xl focus:outline-none"
          style={{
            backgroundColor: 'var(--color-secondary-bg)',
            border: '1px solid var(--color-primary-border)',
            animation: 'scaleIn 150ms ease-out'
          }}
        >
          <Dialog.Title
            className="text-lg font-semibold mb-4 flex items-center gap-2"
            style={{ color: 'var(--color-primary-text)' }}
          >
            {status === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : status === 'ready' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <Download className="w-5 h-5 text-blue-500" />
            )}
            {status === 'error' ? 'Update Error' :
             status === 'ready' ? 'Ready to Install' :
             status === 'downloading' ? 'Downloading Update' :
             'Update Available'}
          </Dialog.Title>

          {status === 'error' && (
            <div className="mb-4">
              <p style={{ color: 'var(--color-secondary-text)' }}>
                {error || 'An error occurred while checking for updates.'}
              </p>
            </div>
          )}

          {status === 'available' && updateInfo && (
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--color-secondary-text)' }}>Current version:</span>
                <span className="font-mono" style={{ color: 'var(--color-primary-text)' }}>
                  v{updateInfo.currentVersion}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--color-secondary-text)' }}>New version:</span>
                <span className="font-mono text-green-500 font-semibold">
                  v{updateInfo.version}
                </span>
              </div>
              {updateInfo.date && (
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--color-secondary-text)' }}>Release date:</span>
                  <span style={{ color: 'var(--color-primary-text)' }}>
                    {new Date(updateInfo.date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {updateInfo.body && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-primary-border)' }}>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-primary-text)' }}>
                    Release Notes:
                  </p>
                  <div
                    className="text-sm max-h-32 overflow-y-auto rounded-lg p-3"
                    style={{
                      color: 'var(--color-secondary-text)',
                      backgroundColor: 'var(--color-tertiary-bg)'
                    }}
                  >
                    <pre className="whitespace-pre-wrap font-sans">{updateInfo.body}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {status === 'downloading' && (
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--color-secondary-text)' }}>Downloading...</span>
                <span style={{ color: 'var(--color-primary-text)' }}>
                  {progress.percent}%
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--color-tertiary-bg)' }}
              >
                <div
                  className="h-full bg-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              {progress.total && (
                <div className="text-xs text-center" style={{ color: 'var(--color-secondary-text)' }}>
                  {formatBytes(progress.downloaded)} / {formatBytes(progress.total)}
                </div>
              )}
            </div>
          )}

          {status === 'ready' && updateInfo && (
            <div className="mb-4">
              <p style={{ color: 'var(--color-secondary-text)' }}>
                Version {updateInfo.version} has been downloaded and is ready to install.
                The application will restart after installation.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            {status === 'available' && (
              <>
                <Button variant="secondary" onClick={dismissUpdate}>
                  Later
                </Button>
                <Button onClick={downloadUpdate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </>
            )}

            {status === 'downloading' && (
              <Button disabled>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Downloading...
              </Button>
            )}

            {status === 'ready' && (
              <>
                <Button variant="secondary" onClick={dismissUpdate}>
                  Later
                </Button>
                <Button variant="success" onClick={installUpdate}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Install & Restart
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <Button variant="secondary" onClick={dismissUpdate}>
                  Dismiss
                </Button>
                <Button onClick={checkForUpdates}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </>
            )}
          </div>

          {status !== 'downloading' && (
            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-500/20 transition-colors"
                style={{ color: 'var(--color-secondary-text)' }}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Update status indicator for sidebar
export function UpdateStatusIndicator() {
  const { status, checkForUpdates } = useUpdate();

  if (status === 'idle' || status === 'up-to-date') {
    return null;
  }

  if (status === 'checking') {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-secondary-text)' }}>
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Checking for updates...</span>
      </div>
    );
  }

  if (status === 'available' || status === 'downloading' || status === 'ready') {
    return (
      <button
        onClick={checkForUpdates}
        className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
      >
        <Download className="w-3 h-3" />
        <span>Update available</span>
      </button>
    );
  }

  if (status === 'error') {
    return (
      <button
        onClick={checkForUpdates}
        className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
      >
        <AlertCircle className="w-3 h-3" />
        <span>Update failed</span>
      </button>
    );
  }

  return null;
}
