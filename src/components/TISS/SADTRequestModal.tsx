import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, RefreshCw, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SADTRequestModalProps {
  open: boolean;
  onClose: () => void;
  patientId?: string;
  patientName?: string;
  onRequestCreated?: (requestData: any) => void;
}

interface TISSOperator {
  id: string;
  name: string;
  registration_number: string;
}

export function SADTRequestModal({ 
  open, 
  onClose, 
  patientId, 
  patientName,
  onRequestCreated 
}: SADTRequestModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingOperators, setLoadingOperators] = useState(false);
  const [operators, setOperators] = useState<TISSOperator[]>([]);
  const [jobCreated, setJobCreated] = useState<any>(null);

  // Form data
  const [formData, setFormData] = useState({
    procedure_code: "",
    exam_type: "",
    urgency: "normal",
    clinical_indication: "",
    provider_id: ""
  });

  // Load operators when modal opens
  useState(() => {
    if (open && operators.length === 0) {
      loadOperators();
    }
  });

  const loadOperators = async () => {
    setLoadingOperators(true);
    try {
      const baseUrl = (import.meta as any).env?.VITE_API_URL || 'https://prontivus-backend-wnw2.onrender.com/api/v1';
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${baseUrl}/tiss/operators`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOperators(data.operators || []);
      }
    } catch (error) {
      console.error('Failed to load operators:', error);
    } finally {
      setLoadingOperators(false);
    }
  };

  const handleSubmit = async () => {
    if (!patientId || !formData.procedure_code || !formData.provider_id) {
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
      
      const response = await fetch(`${baseUrl}/tiss/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          job_type: 'sadt',
          procedure_code: formData.procedure_code,
          patient_id: patientId,
          provider_id: formData.provider_id,
          payload: {
            exam_type: formData.exam_type,
            urgency: formData.urgency,
            clinical_indication: formData.clinical_indication,
            patient_name: patientName
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create SADT request");
      }

      const data = await response.json();
      setJobCreated(data);
      
      toast({
        title: "SADT Request Created!",
        description: "Exam request sent to insurance operator",
      });

      if (onRequestCreated) {
        onRequestCreated(data);
      }
    } catch (error: any) {
      console.error('SADT creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create SADT request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setJobCreated(null);
    setFormData({
      procedure_code: "",
      exam_type: "",
      urgency: "normal",
      clinical_indication: "",
      provider_id: ""
    });
    onClose();
  };

  // Common exam types and their TISS codes
  const commonExams = [
    { code: "40101010", name: "Hemograma Completo" },
    { code: "40301010", name: "Glicemia" },
    { code: "40301036", name: "Colesterol Total" },
    { code: "40316300", name: "Creatinina" },
    { code: "40304078", name: "Hemoglobina Glicada" },
    { code: "20101020", name: "Radiografia de Tórax" },
    { code: "20104049", name: "Ultrassonografia Abdominal" },
    { code: "20104022", name: "Ecocardiograma" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            SADT Exam Request
          </DialogTitle>
          <DialogDescription>
            Request exams through TISS for patient: <strong>{patientName}</strong>
          </DialogDescription>
        </DialogHeader>

        {!jobCreated ? (
          <div className="space-y-4">
            {operators.length === 0 && !loadingOperators && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertDescription className="text-yellow-700">
                  No insurance operators configured. Please add TISS operators first.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4">
              {/* Insurance Operator */}
              <div className="grid gap-2">
                <Label htmlFor="provider">Insurance Operator *</Label>
                <Select
                  value={formData.provider_id}
                  onValueChange={(value) => setFormData({...formData, provider_id: value})}
                  disabled={loadingOperators}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingOperators ? "Loading..." : "Select operator"} />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op.id} value={op.id}>
                        {op.name} ({op.registration_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Select Common Exam */}
              <div className="grid gap-2">
                <Label htmlFor="quick_exam">Quick Select (Common Exams)</Label>
                <Select
                  onValueChange={(value) => {
                    const exam = commonExams.find(e => e.code === value);
                    if (exam) {
                      setFormData({
                        ...formData,
                        procedure_code: exam.code,
                        exam_type: exam.name
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a common exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonExams.map((exam) => (
                      <SelectItem key={exam.code} value={exam.code}>
                        {exam.name} ({exam.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Procedure Code */}
              <div className="grid gap-2">
                <Label htmlFor="code">TISS Procedure Code *</Label>
                <Input
                  id="code"
                  value={formData.procedure_code}
                  onChange={(e) => setFormData({...formData, procedure_code: e.target.value})}
                  placeholder="40101010"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  TISS standard procedure code (e.g., 40101010 for complete blood count)
                </p>
              </div>

              {/* Exam Type */}
              <div className="grid gap-2">
                <Label htmlFor="exam">Exam Type *</Label>
                <Input
                  id="exam"
                  value={formData.exam_type}
                  onChange={(e) => setFormData({...formData, exam_type: e.target.value})}
                  placeholder="e.g., Hemograma Completo, Glicemia"
                  required
                />
              </div>

              {/* Urgency */}
              <div className="grid gap-2">
                <Label htmlFor="urgency">Urgency</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value) => setFormData({...formData, urgency: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clinical Indication */}
              <div className="grid gap-2">
                <Label htmlFor="indication">Clinical Indication</Label>
                <Textarea
                  id="indication"
                  value={formData.clinical_indication}
                  onChange={(e) => setFormData({...formData, clinical_indication: e.target.value})}
                  placeholder="Reason for exam request..."
                  rows={3}
                />
              </div>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                <strong>Note:</strong> The SADT request will be sent to the selected insurance operator. 
                You can track the status in the TISS dashboard.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          // Success view
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 p-6 bg-green-50 rounded-lg">
              <CheckCircle className="h-16 w-16 text-green-600" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-green-900">Request Created Successfully!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Job ID: <span className="font-mono">{jobCreated.id}</span>
                </p>
              </div>
            </div>

            <div className="grid gap-2 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Exam Type</p>
                <p className="font-semibold">{formData.exam_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Procedure Code</p>
                <p className="font-mono">{formData.procedure_code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{jobCreated.status || "pending"}</p>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                The exam request has been queued and will be sent to the insurance operator. 
                You can monitor the status in the TISS module.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          {!jobCreated ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading || operators.length === 0}>
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create SADT Request"
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

