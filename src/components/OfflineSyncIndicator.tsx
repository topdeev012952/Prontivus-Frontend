import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function OfflineSyncIndicator() {
  const { isOnline } = useOffline();
  const { isSyncing, pendingCount, syncPendingEvents } = useOfflineSync();

  if (!isOnline) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-destructive">
            <CloudOff className="h-4 w-4" />
            <span className="text-sm font-medium">Offline</span>
            {pendingCount > 0 && (
              <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Sem conexão com a internet</p>
          {pendingCount > 0 && <p className="text-xs mt-1">{pendingCount} eventos pendentes</p>}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 text-primary">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">Sincronizando...</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={syncPendingEvents}
            className="flex items-center gap-2"
          >
            <Cloud className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{pendingCount} pendentes</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Clique para sincronizar</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Cloud className="h-4 w-4" />
          <span className="text-sm">Sincronizado</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Todos os dados estão sincronizados</p>
      </TooltipContent>
    </Tooltip>
  );
}
