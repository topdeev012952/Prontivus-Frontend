import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, QrCode, RefreshCw, CheckCircle2, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PixPaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    amount: number;
    patient_name?: string;
    patient_email?: string;
    patient_cpf?: string;
  };
  onPaymentCreated?: (paymentData: any) => void;
}

interface PixData {
  payment_id: string;
  qr_code: string;
  qr_code_text: string;
  expires_at: string;
  status: string;
  provider: string;
}

export function PixPaymentModal({ open, onClose, invoice, onPaymentCreated }: PixPaymentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");

  // Form data for patient info if not provided
  const [patientEmail, setPatientEmail] = useState(invoice.patient_email || "");
  const [patientCpf, setPatientCpf] = useState(invoice.patient_cpf || "");

  const handleGeneratePix = async () => {
    if (!patientEmail || !patientCpf) {
      toast({
        title: "Missing Information",
        description: "Please provide patient email and CPF",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const baseUrl = (import.meta as any).env?.VITE_API_URL || 'https://prontivus-backend-wnw2.onrender.com/api/v1';
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${baseUrl}/payments/pix/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          invoice_id: invoice.id,
          payer_email: patientEmail,
          payer_name: invoice.patient_name || "Patient",
          payer_cpf: patientCpf
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to generate PIX payment");
      }

      const data = await response.json();
      setPixData(data);
      
      toast({
        title: "PIX Generated!",
        description: "QR code ready for payment",
      });

      if (onPaymentCreated) {
        onPaymentCreated(data);
      }

      // Start polling payment status
      startStatusPolling(data.payment_id, data.provider);
    } catch (error: any) {
      console.error('PIX generation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate PIX payment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startStatusPolling = (paymentId: string, provider: string) => {
    // Poll every 5 seconds for payment status
    const interval = setInterval(async () => {
      try {
        const status = await checkPaymentStatus(paymentId, provider);
        setPaymentStatus(status);
        
        if (status === "paid") {
          clearInterval(interval);
          toast({
            title: "Payment Received!",
            description: "PIX payment confirmed",
          });
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    }, 5000);

    // Stop polling after 30 minutes
    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  };

  const checkPaymentStatus = async (paymentId: string, provider: string): Promise<string> => {
    setCheckingStatus(true);
    try {
      const baseUrl = (import.meta as any).env?.VITE_API_URL || 'https://prontivus-backend-wnw2.onrender.com/api/v1';
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${baseUrl}/payments/${paymentId}/status?provider=${provider}`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });

      if (!response.ok) {
        throw new Error("Failed to check payment status");
      }

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Status check error:', error);
      return "unknown";
    } finally {
      setCheckingStatus(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "PIX code copied to clipboard",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatExpirationTime = (expiresAt: string) => {
    const date = new Date(expiresAt);
    return date.toLocaleString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            PIX Payment
          </DialogTitle>
          <DialogDescription>
            Generate a PIX QR code for invoice payment
          </DialogDescription>
        </DialogHeader>

        {!pixData ? (
          // Form to generate PIX
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Amount to pay: <strong>{formatCurrency(invoice.amount)}</strong>
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Patient Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="patient@email.com"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cpf">Patient CPF</Label>
                <Input
                  id="cpf"
                  value={patientCpf}
                  onChange={(e) => setPatientCpf(e.target.value)}
                  placeholder="123.456.789-00"
                  required
                />
              </div>
            </div>

            <Button 
              onClick={handleGeneratePix} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating PIX...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate PIX QR Code
                </>
              )}
            </Button>
          </div>
        ) : (
          // Display PIX QR code and details
          <div className="space-y-6">
            {/* Payment Status */}
            <Alert className={paymentStatus === "paid" ? "bg-green-50 border-green-200" : ""}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {paymentStatus === "paid" ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-green-700 font-semibold">Payment Confirmed!</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <span className="text-yellow-700 font-semibold">Awaiting Payment</span>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pixData && checkPaymentStatus(pixData.payment_id, pixData.provider)}
                  disabled={checkingStatus}
                >
                  {checkingStatus ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Alert>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-lg">
              {pixData.qr_code ? (
                <img 
                  src={`data:image/png;base64,${pixData.qr_code}`} 
                  alt="PIX QR Code" 
                  className="w-64 h-64 border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-64 h-64 bg-gray-200 flex items-center justify-center rounded">
                  <QrCode className="h-16 w-16 text-gray-400" />
                </div>
              )}
              <p className="text-center text-sm text-muted-foreground">
                Scan this QR code with your banking app
              </p>
            </div>

            {/* PIX Copy-Paste Code */}
            <div className="space-y-2">
              <Label>PIX Copy-Paste Code</Label>
              <div className="flex gap-2">
                <Input
                  value={pixData.qr_code_text}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(pixData.qr_code_text)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Or copy this code and paste in your banking app
              </p>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-semibold">{formatCurrency(invoice.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expires At</p>
                <p className="font-semibold text-sm">{formatExpirationTime(pixData.expires_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment ID</p>
                <p className="font-mono text-xs">{pixData.payment_id.slice(0, 20)}...</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Provider</p>
                <p className="font-semibold capitalize">{pixData.provider}</p>
              </div>
            </div>

            {/* Instructions */}
            <Alert>
              <AlertDescription className="text-sm">
                <strong>How to pay:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Open your banking app</li>
                  <li>Select "PIX" payment</li>
                  <li>Scan the QR code OR paste the code above</li>
                  <li>Confirm the payment</li>
                  <li>Payment is confirmed instantly!</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button 
                onClick={() => pixData && checkPaymentStatus(pixData.payment_id, pixData.provider)}
                disabled={checkingStatus || paymentStatus === "paid"}
                className="flex-1"
              >
                {checkingStatus ? "Checking..." : "Check Payment Status"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

