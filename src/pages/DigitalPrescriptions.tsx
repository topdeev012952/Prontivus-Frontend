import { useState, useEffect } from "react";
import { FileText, Plus, Search, Loader2, User, Calendar, Pill, AlertTriangle, Download, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api";

// Prescription type badges colors
const PRESCRIPTION_TYPES = {
  simple: { label: "Simple", color: "bg-blue-100 text-blue-800" },
  antimicrobial: { label: "Antimicrobial (RDC 471/2021)", color: "bg-orange-100 text-orange-800" },
  controlled_c1: { label: "Controlled C1 (2 copies)", color: "bg-red-100 text-red-800" },
};

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
}

interface Prescription {
  id: string;
  patient_id: string;
  patient_name?: string;
  doctor_id: string;
  doctor_name?: string;
  prescription_type: "simple" | "antimicrobial" | "controlled_c1";
  medications: Medication[];
  notes?: string;
  created_at: string;
  signed_at?: string;
  signature_hash?: string;
  qr_code?: string;
  pdf_url?: string;
}

export default function DigitalPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [prescriptionType, setPrescriptionType] = useState<"simple" | "antimicrobial" | "controlled_c1">("simple");
  
  // Medications list
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: "1",
      name: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
      quantity: 0,
    },
  ]);

  const [prescriptionNotes, setPrescriptionNotes] = useState("");

  useEffect(() => {
    loadPrescriptions();
    loadPatients();
  }, []);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiClient.request<{ items: Prescription[]; total: number }>(
        `/prescriptions?page=1&size=50`
      );

      setPrescriptions(data?.items || []);
    } catch (err: any) {
      console.error("Error loading prescriptions:", err);
      setError("Failed to load prescriptions. Please try again.");
      setPrescriptions([]); // Ensure prescriptions is always an array
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const data = await apiClient.request<{ items: any[]; total: number }>(
        "/patients?page=1&size=100"
      );
      setPatients(data?.items || []);
    } catch (err) {
      console.error("Error loading patients:", err);
      setPatients([]); // Ensure patients is always an array
    }
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        id: Date.now().toString(),
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
        quantity: 0,
      },
    ]);
  };

  const removeMedication = (id: string) => {
    if (medications.length === 1) {
      setError("At least one medication is required");
      return;
    }
    setMedications(medications.filter((med) => med.id !== id));
  };

  const updateMedication = (id: string, field: keyof Medication, value: any) => {
    setMedications(
      medications.map((med) =>
        med.id === id ? { ...med, [field]: value } : med
      )
    );
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Validate medications
      const validMedications = medications.filter(
        (med) => med.name.trim() !== "" && med.dosage.trim() !== ""
      );

      if (validMedications.length === 0) {
        throw new Error("Please add at least one medication with name and dosage");
      }

      const prescriptionData = {
        patient_id: selectedPatient,
        prescription_type: prescriptionType,
        medications: validMedications,
        notes: prescriptionNotes || null,
      };

      await apiClient.request("/prescriptions", {
        method: "POST",
        body: JSON.stringify(prescriptionData),
      });

      setSuccess("Prescription created successfully!");
      setShowCreateDialog(false);
      resetForm();
      
      // Reload prescriptions
      await loadPrescriptions();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error creating prescription:", err);
      setError(err.message || "Failed to create prescription. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedPatient("");
    setPrescriptionType("simple");
    setMedications([
      {
        id: "1",
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
        quantity: 0,
      },
    ]);
    setPrescriptionNotes("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Digital Prescriptions</h1>
          <p className="text-muted-foreground">
            Create and manage electronic prescriptions with digital signature
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          New Prescription
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Prescriptions List */}
      {prescriptions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {prescriptions.map((prescription) => (
            <Card key={prescription.id} className="shadow-card hover:shadow-medical transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {prescription.patient_name || "Patient"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Dr. {prescription.doctor_name || "Unknown"}
                    </p>
                  </div>
                  <Badge className={PRESCRIPTION_TYPES[prescription.prescription_type]?.color}>
                    {PRESCRIPTION_TYPES[prescription.prescription_type]?.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Pill className="h-4 w-4 text-muted-foreground" />
                    <span>{prescription.medications?.length || 0} medication(s)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(prescription.created_at)}</span>
                  </div>

                  {prescription.signed_at && (
                    <Badge variant="outline" className="text-xs gap-1">
                      ✓ Digitally Signed
                    </Badge>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {/* View prescription */}}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {prescription.pdf_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(prescription.pdf_url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No prescriptions found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first digital prescription
            </p>
            <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4" />
              New Prescription
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Prescription Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Digital Prescription</DialogTitle>
            <DialogDescription>
              Create a prescription with automatic PDF generation and digital signature
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePrescription}>
            <div className="space-y-6">
              {/* Patient Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient">Patient *</Label>
                  <Select value={selectedPatient} onValueChange={setSelectedPatient} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name} {patient.cpf && `(CPF: ${patient.cpf})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="prescription_type">Prescription Type *</Label>
                  <Select
                    value={prescriptionType}
                    onValueChange={(value: any) => setPrescriptionType(value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          Simple Prescription
                        </div>
                      </SelectItem>
                      <SelectItem value="antimicrobial">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-orange-500" />
                          Antimicrobial (RDC 471/2021)
                        </div>
                      </SelectItem>
                      <SelectItem value="controlled_c1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          Controlled C1 (2 copies required)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Prescription Type Warnings */}
              {prescriptionType === "antimicrobial" && (
                <Alert className="bg-orange-50 border-orange-200">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>RDC 471/2021:</strong> Antimicrobial prescriptions require special retention and reporting.
                  </AlertDescription>
                </Alert>
              )}

              {prescriptionType === "controlled_c1" && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Controlled Substance (Class C1):</strong> Two copies will be generated (patient + pharmacy).
                    Requires special yellow paper and stricter controls per Portaria 344/98.
                  </AlertDescription>
                </Alert>
              )}

              {/* Medications List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Medications *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMedication}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Medication
                  </Button>
                </div>

                <div className="space-y-4">
                  {medications.map((medication, index) => (
                    <Card key={medication.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium">Medication {index + 1}</h4>
                        {medications.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMedication(medication.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`med-name-${medication.id}`}>Medication Name *</Label>
                            <Input
                              id={`med-name-${medication.id}`}
                              placeholder="e.g., Amoxicillin"
                              value={medication.name}
                              onChange={(e) =>
                                updateMedication(medication.id, "name", e.target.value)
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor={`med-dosage-${medication.id}`}>Dosage *</Label>
                            <Input
                              id={`med-dosage-${medication.id}`}
                              placeholder="e.g., 500mg"
                              value={medication.dosage}
                              onChange={(e) =>
                                updateMedication(medication.id, "dosage", e.target.value)
                              }
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor={`med-frequency-${medication.id}`}>Frequency</Label>
                            <Input
                              id={`med-frequency-${medication.id}`}
                              placeholder="e.g., 3x/day"
                              value={medication.frequency}
                              onChange={(e) =>
                                updateMedication(medication.id, "frequency", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor={`med-duration-${medication.id}`}>Duration</Label>
                            <Input
                              id={`med-duration-${medication.id}`}
                              placeholder="e.g., 7 days"
                              value={medication.duration}
                              onChange={(e) =>
                                updateMedication(medication.id, "duration", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor={`med-quantity-${medication.id}`}>Quantity</Label>
                            <Input
                              id={`med-quantity-${medication.id}`}
                              type="number"
                              placeholder="e.g., 21"
                              value={medication.quantity || ""}
                              onChange={(e) =>
                                updateMedication(
                                  medication.id,
                                  "quantity",
                                  parseInt(e.target.value) || 0
                                )
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`med-instructions-${medication.id}`}>
                            Instructions (Posology)
                          </Label>
                          <Textarea
                            id={`med-instructions-${medication.id}`}
                            placeholder="e.g., Take 1 capsule every 8 hours with food"
                            value={medication.instructions}
                            onChange={(e) =>
                              updateMedication(medication.id, "instructions", e.target.value)
                            }
                            rows={2}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional instructions or observations..."
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Preview Info */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800 text-sm">
                  <strong>Next steps after creation:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>PDF will be automatically generated with clinic branding</li>
                    <li>Digital signature (ICP-Brasil A1) will be applied</li>
                    <li>QR Code for verification will be embedded</li>
                    <li>Patient can receive via email, WhatsApp, or portal</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !selectedPatient}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Prescription
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

