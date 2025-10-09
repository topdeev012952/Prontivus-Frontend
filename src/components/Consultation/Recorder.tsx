import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Square, Pause, Play, RotateCcw } from 'lucide-react';
import { useRecorder } from '@/hooks/useRecorder';
import { Progress } from '@/components/ui/progress';

interface RecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export function Recorder({ onRecordingComplete, isUploading, uploadProgress }: RecorderProps) {
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  } = useRecorder();

  useEffect(() => {
    if (audioBlob && !isUploading) {
      onRecordingComplete(audioBlob);
    }
  }, [audioBlob, isUploading, onRecordingComplete]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (audioBlob && !isRecording) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Gravação concluída</p>
                <p className="text-sm text-muted-foreground">
                  Duração: {formatDuration(duration)} • Tamanho: {formatFileSize(audioBlob.size)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetRecording}
                disabled={isUploading}
                aria-label="Gravar novamente"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Gravar Novamente
              </Button>
            </div>

            {isUploading && uploadProgress !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Enviando gravação...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Visual indicator */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`relative ${isRecording && !isPaused ? 'animate-pulse' : ''}`}>
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Mic className={`h-12 w-12 ${isRecording && !isPaused ? 'text-destructive' : 'text-primary'}`} />
              </div>
              {isRecording && !isPaused && (
                <div className="absolute inset-0 rounded-full border-4 border-destructive animate-ping" />
              )}
            </div>

            <div className="text-center">
              <p className="text-3xl font-mono font-bold">{formatDuration(duration)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isRecording ? (isPaused ? 'Pausado' : 'Gravando...') : 'Pronto para gravar'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            {!isRecording ? (
              <Button 
                onClick={startRecording} 
                size="lg"
                aria-label="Iniciar gravação"
              >
                <Mic className="h-5 w-5 mr-2" />
                Iniciar Gravação
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={isPaused ? resumeRecording : pauseRecording}
                  aria-label={isPaused ? 'Retomar gravação' : 'Pausar gravação'}
                >
                  {isPaused ? (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Retomar
                    </>
                  ) : (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      Pausar
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={stopRecording}
                  aria-label="Parar gravação"
                >
                  <Square className="h-5 w-5 mr-2" />
                  Parar
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
