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
import { Copy, FileText, Download, Calendar, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BoletoPaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    amount: number;
    due_date?: string;
    patient_name?: string;
    patient_cpf?: string;
  };
  onPaymentCreated?: (paymentData: any) => void;
}

interface BoletoData {
  boleto_id: string;
  barcode: string;
  digitable_line: string;
  pdf_url: string;
  due_date: string;
  status: string;
  note?: string;
}

export function BoletoPaymentModal({ open, onClose, invoice, onPaymentCreated }: BoletoPaymentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [boletoData, setBoletoData] = useState<BoletoData | null>(null);

  // Form data
  const [patientName, setPatientName] = useState(invoice.patient_name || "");
  const [patientCpf, setPatientCpf] = useState(invoice.patient_cpf || "");
  const [dueDate, setDueDate] = useState(invoice.due_date || "");
  const [address, setAddress] = useState({
    street: "",
    number: "",
    city: "",
    state: "",
    zipcode: ""
  });

  const handleGenerateBoleto = async () => {
    if (!patientName || !patientCpf || !dueDate) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const baseUrl = (import.meta as any).env?.VITE_API_URL || 'https://prontivus-backend-wnw2.onrender.com/api/v1';
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${baseUrl}/payments/boleto/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          invoice_id: invoice.id,
          payer_name: patientName,
          payer_cpf: patientCpf,
          payer_address: address,
          due_date: dueDate
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to generate Boleto");
      }

      const data = await response.json();
      setBoletoData(data);
      
      toast({
        title: "Boleto Generated!",
        description: "Bank slip ready for payment",
      });

      if (onPaymentCreated) {
        onPaymentCreated(data);
      }
    } catch (error: any) {
      console.error('Boleto generation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate Boleto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Boleto code copied to clipboard",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const downloadPDF = () => {
    if (boletoData?.pdf_url) {
      window.open(boletoData.pdf_url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Boleto Payment (Bank Slip)
          </DialogTitle>
          <DialogDescription>
            Generate a boleto bancário for invoice payment
          </DialogDescription>
        </DialogHeader>

        {!boletoData ? (
          // Form to generate Boleto
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Amount: <strong>{formatCurrency(invoice.amount)}</strong>
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Patient Name *</Label>
                <Input
                  id="name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={patientCpf}
                    onChange={(e) => setPatientCpf(e.target.value)}
                    placeholder="123.456.789-00"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address (Optional)</Label>
                <div className="grid gap-2">
                  <Input
                    placeholder="Street"
                    value={address.street}
                    onChange={(e) => setAddress({...address, street: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Number"
                      value={address.number}
                      onChange={(e) => setAddress({...address, number: e.target.value})}
                    />
                    <Input
                      placeholder="ZIP Code"
                      value={address.zipcode}
                      onChange={(e) => setAddress({...address, zipcode: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="City"
                      value={address.city}
                      onChange={(e) => setAddress({...address, city: e.target.value})}
                    />
                    <Input
                      placeholder="State"
                      value={address.state}
                      onChange={(e) => setAddress({...address, state: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleGenerateBoleto} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating Boleto...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Boleto
                </>
              )}
            </Button>
          </div>
        ) : (
          // Display Boleto details
          <div className="space-y-6">
            {boletoData.note && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-700">
                  {boletoData.note}
                </AlertDescription>
              </Alert>
            )}

            {/* Boleto Details */}
            <div className="grid gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(invoice.amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(boletoData.due_date)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Boleto ID</p>
                <p className="font-mono text-xs">{boletoData.boleto_id}</p>
              </div>
            </div>

            {/* Barcode */}
            <div className="space-y-2">
              <Label>Barcode</Label>
              <div className="flex gap-2">
                <Input
                  value={boletoData.barcode}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(boletoData.barcode)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Digitable Line */}
            <div className="space-y-2">
              <Label>Digitable Line (Linha Digitável)</Label>
              <div className="flex gap-2">
                <Input
                  value={boletoData.digitable_line}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(boletoData.digitable_line)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this number to pay at banks, lottery shops, or online banking
              </p>
            </div>

            {/* Instructions */}
            <Alert>
              <AlertDescription className="text-sm">
                <strong>How to pay:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Download the PDF or copy the digitable line</li>
                  <li>Go to your bank, lottery shop, or online banking</li>
                  <li>Select "Pay Boleto"</li>
                  <li>Enter the digitable line or scan the barcode</li>
                  <li>Confirm payment before due date</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button 
                onClick={downloadPDF}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

