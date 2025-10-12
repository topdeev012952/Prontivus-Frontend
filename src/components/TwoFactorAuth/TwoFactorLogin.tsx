/**
 * Two-Factor Authentication Login Component
 * Handles 2FA verification during login
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TwoFactorLoginProps {
  open: boolean;
  onVerify: (code: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
}

export function TwoFactorLogin({ 
  open, 
  onVerify, 
  onCancel, 
  loading = false,
  error = ""
}: TwoFactorLoginProps) {
  const [code, setCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      await onVerify(code);
    }
  };

  const handleCodeChange = (value: string) => {
    // Only allow digits
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 6) {
      setCode(digits);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Enter the 6-digit code from your authenticator app
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="2fa-code">Authentication Code</Label>
            <Input
              id="2fa-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="000000"
              className="text-center text-2xl tracking-wider font-mono"
              autoFocus
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Open your authenticator app to get your code
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading || code.length !== 6}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify
            </Button>
            
            <Button 
              type="button"
              variant="outline" 
              className="w-full"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Lost your device?</strong> You can use a backup code instead of the 6-digit code.
            </AlertDescription>
          </Alert>
        </form>
      </DialogContent>
    </Dialog>
  );
}

