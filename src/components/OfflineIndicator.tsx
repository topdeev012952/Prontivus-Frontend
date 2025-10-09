import { WifiOff, Wifi } from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';

export function OfflineIndicator() {
  const { isOnline } = useOffline();

  if (isOnline) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive rounded-md text-sm">
      <WifiOff className="h-4 w-4" />
      <span className="font-medium">Offline</span>
    </div>
  );
}
