import { useState, useEffect, useRef } from "react";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, MonitorOff, Users, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function TelemedicineRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // WebRTC states
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  
  // Consent dialog
  const [showConsentDialog, setShowConsentDialog] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);
  const [recordingConsent, setRecordingConsent] = useState(false);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (consentGiven && localStream) {
      initializeWebRTC();
    }

    return () => {
      cleanup();
    };
  }, [consentGiven, localStream]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const data = await apiClient.request(`/telemedicine/sessions/${sessionId}`);
      setSession(data);
    } catch (err: any) {
      setError("Failed to load telemedicine session");
    } finally {
      setLoading(false);
    }
  };

  const handleConsentAccept = async () => {
    try {
      // Save consent to backend
      await apiClient.request(`/telemedicine/sessions/${sessionId}/consent`, {
        method: "POST",
        body: JSON.stringify({
          user_id: user?.id,
          consent_type: "session_participation",
          consent_given: true,
          recording_consent: recordingConsent,
        }),
      });

      setConsentGiven(true);
      setShowConsentDialog(false);

      // Request media permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setConnectionStatus("connecting");
    } catch (err) {
      console.error("Error getting media:", err);
      setError("Failed to access camera/microphone. Please check permissions.");
    }
  };

  const initializeWebRTC = async () => {
    try {
      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          // In production: Add TURN servers
        ],
      });

      // Add local stream to peer connection
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          if (localStream) {
            pc.addTrack(track, localStream);
          }
        });
      }

      // Handle remote stream
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        setRemoteStream(stream);
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // Send candidate to signaling server via WebSocket
          console.log("ICE candidate:", event.candidate);
        }
      };

      // Connection state changes
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setConnectionStatus("connected");
        } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          setConnectionStatus("disconnected");
        }
      };

      peerConnection.current = pc;

      // In production: Join room via WebSocket signaling server
      // await joinRoom(sessionId);
      
      setConnectionStatus("connected"); // Simulated for demo
    } catch (err) {
      console.error("WebRTC error:", err);
      setError("Failed to establish connection");
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        
        // Replace video track with screen share
        if (peerConnection.current && localStream) {
          const videoTrack = screenStream.getVideoTracks()[0];
          const sender = peerConnection.current.getSenders().find((s) => s.track?.kind === "video");
          
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }
        
        setIsScreenSharing(true);
      } else {
        // Switch back to camera
        if (localStream && peerConnection.current) {
          const videoTrack = localStream.getVideoTracks()[0];
          const sender = peerConnection.current.getSenders().find((s) => s.track?.kind === "video");
          
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }
        
        setIsScreenSharing(false);
      }
    } catch (err) {
      console.error("Screen share error:", err);
      setError("Failed to share screen");
    }
  };

  const handleEndCall = async () => {
    try {
      await apiClient.request(`/telemedicine/sessions/${sessionId}/end`, {
        method: "POST",
        body: JSON.stringify({
          ended_by: user?.id,
          end_reason: "normal_completion",
        }),
      });

      cleanup();
      navigate("/app/dashboard");
    } catch (err) {
      console.error("Error ending session:", err);
      cleanup();
      navigate("/app/dashboard");
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    
    if (peerConnection.current) {
      peerConnection.current.close();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center text-white">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p>Loading telemedicine session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Video className="h-6 w-6 text-primary" />
          <div>
            <h2 className="font-semibold">Telemedicine Session</h2>
            <p className="text-sm text-gray-400">
              {session?.patient_name || "Patient"} • Session ID: {sessionId?.slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connectionStatus === "connected" ? "default" : "destructive"}>
            {connectionStatus}
          </Badge>
          <Badge variant="outline" className="text-white border-white/30">
            {user?.role}
          </Badge>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 p-2">
        {/* Remote Video (Patient/Doctor) */}
        <Card className="bg-gray-900 border-gray-800 overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            style={{ minHeight: "300px" }}
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                <p className="text-sm text-gray-400">Waiting for participant...</p>
              </div>
            </div>
          )}
        </Card>

        {/* Local Video (You) */}
        <Card className="bg-gray-900 border-gray-800 overflow-hidden relative">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ minHeight: "300px" }}
          />
          <div className="absolute bottom-4 left-4">
            <Badge className="bg-black/50 text-white">You</Badge>
          </div>
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <VideoOff className="h-12 w-12 text-gray-600" />
            </div>
          )}
        </Card>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4 flex items-center justify-center gap-3">
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="lg"
          className="rounded-full h-14 w-14 p-0"
          onClick={toggleMute}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        <Button
          variant={isVideoOff ? "destructive" : "secondary"}
          size="lg"
          className="rounded-full h-14 w-14 p-0"
          onClick={toggleVideo}
          title={isVideoOff ? "Turn on video" : "Turn off video"}
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </Button>

        <Button
          variant={isScreenSharing ? "default" : "secondary"}
          size="lg"
          className="rounded-full h-14 w-14 p-0"
          onClick={toggleScreenShare}
          title={isScreenSharing ? "Stop sharing" : "Share screen"}
        >
          {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          className="rounded-full h-14 w-14 p-0 ml-4"
          onClick={handleEndCall}
          title="End call"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>

      {/* Consent Dialog */}
      <Dialog open={showConsentDialog} onOpenChange={(open) => !open && navigate("/app/dashboard")}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Consent Required
            </DialogTitle>
            <DialogDescription>
              Before joining this telemedicine session, please review and accept the terms.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription>
                <strong>LGPD Compliance Notice:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>This session will be conducted via secure WebRTC connection</li>
                  <li>Your camera and microphone will be accessed</li>
                  <li>Session may be recorded (optional, requires additional consent)</li>
                  <li>All data is encrypted and LGPD-compliant</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <Label htmlFor="recording" className="font-medium">
                  Allow session recording
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Recording will only occur with both parties' consent
                </p>
              </div>
              <input
                type="checkbox"
                id="recording"
                checked={recordingConsent}
                onChange={(e) => setRecordingConsent(e.target.checked)}
                className="h-5 w-5"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => navigate("/app/dashboard")}
            >
              Decline & Exit
            </Button>
            <Button onClick={handleConsentAccept}>
              Accept & Join Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

