/**
 * Two-Factor Authentication Settings Component
 * Displays 2FA status and allows enable/disable
 */

import { useState, useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TwoFactorSetup } from "./TwoFactorSetup";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface TwoFactorStatus {
  enabled: boolean;
  status: string;
  enabled_at: string | null;
  last_used_at: string | null;
}

export function TwoFactorSettings() {
  const { user } = useAuth();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [error, setError] = useState("");

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await apiClient.request<TwoFactorStatus>("/two-fa/status");
      setStatus(data);
    } catch (err: any) {
      setError(err.message || "Failed to load 2FA status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const requiresEnabled = user?.role && ["admin", "doctor", "superadmin"].includes(user.role.toLowerCase());

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication (2FA)
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          {status?.enabled ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>2FA is enabled</strong>
                {status.last_used_at && (
                  <div className="text-sm mt-1">
                    Last used: {new Date(status.last_used_at).toLocaleString()}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ) : requiresEnabled ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>2FA is required for your role ({user?.role})</strong>
                <div className="text-sm mt-1">
                  For security and compliance (LGPD/HIPAA), admins and doctors must enable 2FA.
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertDescription>
                2FA is not enabled. We recommend enabling it for better security.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Information */}
          <div className="space-y-2">
            <h3 className="font-medium">What is 2FA?</h3>
            <p className="text-sm text-muted-foreground">
              Two-factor authentication adds an extra layer of security by requiring a code from 
              your phone in addition to your password when logging in.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">How it works:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Install an authenticator app (Google Authenticator, Microsoft Authenticator, or Authy)</li>
              <li>Scan the QR code we provide</li>
              <li>Enter the 6-digit code when logging in</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            {!status?.enabled ? (
              <Button onClick={() => setShowSetup(true)}>
                Enable 2FA
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline"
                  onClick={async () => {
                    try {
                      await apiClient.request("/two-fa/regenerate-backup-codes", {
                        method: "POST",
                      });
                      // Show new codes in a modal
                      alert("Backup codes regenerated! (Implement modal to display them)");
                    } catch (err: any) {
                      setError(err.message || "Failed to regenerate backup codes");
                    }
                  }}
                >
                  Regenerate Backup Codes
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    // Implement disable 2FA modal
                    alert("Disable 2FA (Implement confirmation modal)");
                  }}
                >
                  Disable 2FA
                </Button>
              </>
            )}
          </div>

          {/* Required Notice */}
          {requiresEnabled && !status?.enabled && (
            <Alert className="bg-yellow-50 border-yellow-200 mt-4">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Action Required</strong>
                <div className="text-sm mt-1">
                  Your account type requires 2FA. Please enable it as soon as possible.
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Setup Modal */}
      <TwoFactorSetup
        open={showSetup}
        onOpenChange={setShowSetup}
        onSuccess={() => {
          loadStatus();
          setError("");
        }}
      />
    </>
  );
}

