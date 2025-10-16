import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Video, VideoOff, Mic, MicOff, PhoneOff } from 'lucide-react';
import { useState } from 'react';

interface TelemedicineModalProps {
  open: boolean;
  onClose: () => void;
  telemedicineLink: string;
  patientName: string;
}

export function TelemedicineModal({
  open,
  onClose,
  telemedicineLink,
  patientName,
}: TelemedicineModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const endCall = () => {
    // Record session details
    const sessionData = {
      timestamp: new Date().toISOString(),
      duration: 0, // Calculate from start time
      patientName,
    };
    
    // Save to medical record via API
    console.log('Session ended:', sessionData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]" aria-describedby="telemedicine-modal-desc">
        <DialogHeader>
          <DialogTitle>Teleconsultation - {patientName}</DialogTitle>
        </DialogHeader>
        <DialogDescription id="telemedicine-modal-desc" className="sr-only">
          Telemedicine session window. Video and audio controls are available below the video.
        </DialogDescription>
        
        <div className="flex-1 bg-muted rounded-lg overflow-hidden relative">
          <Label htmlFor="telemed-iframe" className="sr-only">Janela de vídeo da teleconsulta</Label>
          <iframe
            id="telemed-iframe"
            src={telemedicineLink}
            className="w-full h-full"
            allow="camera; microphone; fullscreen"
          />
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <Button
              variant={isMuted ? 'destructive' : 'secondary'}
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            
            <Button
              variant={isVideoOff ? 'destructive' : 'secondary'}
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={() => setIsVideoOff(!isVideoOff)}
            >
              {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="destructive"
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={endCall}
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
