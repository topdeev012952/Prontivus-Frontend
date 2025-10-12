/**
 * Two-Factor Authentication Setup Component
 * Handles 2FA setup with QR code scanning
 */

import { useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api";

interface TwoFactorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface SetupData {
  secret: string;
  qr_code_data: string;
  backup_codes: string[];
}

export function TwoFactorSetup({ open, onOpenChange, onSuccess }: TwoFactorSetupProps) {
  const [step, setStep] = useState<"setup" | "verify" | "backup">("setup");
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSetup = async () => {
    try {
      setLoading(true);
      setError("");
      
      const data = await apiClient.request<SetupData>("/two-fa/setup", {
        method: "POST",
      });
      
      setSetupData(data);
      setStep("verify");
    } catch (err: any) {
      setError(err.message || "Failed to setup 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const response = await apiClient.request<{verified: boolean; message: string}>("/two-fa/verify", {
        method: "POST",
        body: JSON.stringify({ code: verificationCode }),
      });
      
      if (response.verified) {
        setStep("backup");
      } else {
        setError(response.message || "Invalid code. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onOpenChange(false);
    onSuccess();
    // Reset state
    setStep("setup");
    setSetupData(null);
    setVerificationCode("");
    setError("");
  };

  const copySecret = () => {
    if (setupData) {
      navigator.clipboard.writeText(setupData.secret);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const copyBackupCodes = () => {
    if (setupData) {
      navigator.clipboard.writeText(setupData.backup_codes.join("\n"));
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "setup" && "Enable Two-Factor Authentication"}
            {step === "verify" && "Verify Setup"}
            {step === "backup" && "Save Backup Codes"}
          </DialogTitle>
          <DialogDescription>
            {step === "setup" && "Secure your account with 2FA"}
            {step === "verify" && "Enter the code from your authenticator app"}
            {step === "backup" && "Store these codes in a safe place"}
          </DialogDescription>
        </DialogHeader>

        {/* Setup Step */}
        {step === "setup" && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                You'll need an authenticator app like Google Authenticator or Microsoft Authenticator.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h3 className="font-medium">How it works:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Scan the QR code with your authenticator app</li>
                <li>Enter the 6-digit code to verify</li>
                <li>Save your backup codes</li>
                <li>You're done!</li>
              </ol>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button onClick={handleSetup} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Start Setup
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Verify Step */}
        {step === "verify" && setupData && (
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <img 
                src={setupData.qr_code_data} 
                alt="QR Code" 
                className="border rounded p-2"
              />
              
              <div className="w-full">
                <Label className="text-sm font-medium">Manual Entry Code</Label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    value={setupData.secret} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copySecret}
                  >
                    {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="w-full">
                <Label htmlFor="code">Enter 6-Digit Code</Label>
                <Input
                  id="code"
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-wider font-mono"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button 
                onClick={handleVerify} 
                disabled={loading || verificationCode.length !== 6}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Enable
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Backup Codes Step */}
        {step === "backup" && setupData && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription className="font-medium">
                ⚠️ Save these backup codes! You'll need them if you lose access to your authenticator app.
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <Label className="font-medium">Backup Codes</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyBackupCodes}
                >
                  {copiedCode ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy All
                    </>
                  )}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {setupData.backup_codes.map((code, index) => (
                  <div key={index} className="bg-background p-2 rounded">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <Alert>
              <AlertDescription>
                Store these codes in a safe place like a password manager or write them down and keep them secure.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button onClick={handleComplete} className="w-full">
                I've Saved My Backup Codes
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

