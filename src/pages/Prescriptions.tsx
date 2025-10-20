import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Plus, 
  Search, 
  Loader2, 
  User, 
  Calendar, 
  Pill,
  Edit,
  Trash2,
  Eye,
  Download,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Prescription {
  id: string;
  patient_id: string;
  patient_name?: string;
  doctor_id?: string;
  doctor_name?: string;
  medication_name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
  created_at: string;
  clinic_id?: string;
  record_id?: string;
}

interface Patient {
  id: string;
  name: string;
  cpf?: string;
  email?: string;
}

export default function Prescriptions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  
  // Form states
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: "",
    medication_name: "",
    dosage: "",
    frequency: "",
    duration: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Load prescriptions
      const prescriptionsData = await apiClient.request<{ items: Prescription[] }>("/prescriptions/list");
      
      // Load patients for the dropdown
      const patientsData = await apiClient.request<{ items: Patient[] }>("/patients/list?page=1&size=1000");
      
      setPrescriptions(prescriptionsData?.items || []);
      setPatients(patientsData?.items || []);
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await loadData();
      return;
    }

    try {
      setSearching(true);
      const results = await apiClient.request<{ items: Prescription[] }>(
        `/prescriptions/list?search=${encodeURIComponent(searchQuery)}`
      );
      setPrescriptions(results?.items || []);
    } catch (err: any) {
      console.error("Error searching:", err);
      setError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_id || !formData.medication_name) {
      setError("Patient and medication are required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await apiClient.request("/prescriptions", {
        method: "POST",
        body: JSON.stringify({
          patient_id: formData.patient_id,
          medication_name: formData.medication_name,
          dosage: formData.dosage || null,
          frequency: formData.frequency || null,
          duration: formData.duration || null,
          notes: formData.notes || null,
        }),
      });

      setSuccess("Prescription created successfully!");
      setShowAddDialog(false);
      setFormData({
        patient_id: "",
        medication_name: "",
        dosage: "",
        frequency: "",
        duration: "",
        notes: "",
      });
      await loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error creating prescription:", err);
      setError(err.message || "Failed to create prescription");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPrescription) return;

    try {
      setSaving(true);
      setError("");

      await apiClient.request(`/prescriptions/${selectedPrescription.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          medication_name: formData.medication_name,
          dosage: formData.dosage || null,
          frequency: formData.frequency || null,
          duration: formData.duration || null,
          notes: formData.notes || null,
        }),
      });

      setSuccess("Prescription updated successfully!");
      setShowEditDialog(false);
      setSelectedPrescription(null);
      await loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error updating prescription:", err);
      setError(err.message || "Failed to update prescription");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrescription = async () => {
    if (!selectedPrescription) return;

    try {
      setDeleting(true);
      setError("");

      await apiClient.request(`/prescriptions/${selectedPrescription.id}`, {
        method: "DELETE",
      });

      setSuccess("Prescription deleted successfully!");
      setShowDeleteDialog(false);
      setSelectedPrescription(null);
      await loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error deleting prescription:", err);
      setError(err.message || "Failed to delete prescription");
    } finally {
      setDeleting(false);
    }
  };

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowViewDialog(true);
  };

  const handleEditPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setFormData({
      patient_id: prescription.patient_id,
      medication_name: prescription.medication_name,
      dosage: prescription.dosage || "",
      frequency: prescription.frequency || "",
      duration: prescription.duration || "",
      notes: prescription.notes || "",
    });
    setShowEditDialog(true);
  };

  const handleDeleteClick = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowDeleteDialog(true);
  };

  const filteredPrescriptions = searchQuery
    ? prescriptions.filter(
        (p) =>
          p.medication_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : prescriptions;

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
          <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground">
            Manage medical prescriptions for your patients
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Prescription
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Search Bar */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by medication or patient name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching} variant="secondary">
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prescriptions</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptions.length}</div>
            <p className="text-xs text-muted-foreground">Active prescriptions</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                prescriptions.filter((p) => {
                  const date = new Date(p.created_at);
                  const now = new Date();
                  return (
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear()
                  );
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Created this month</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(prescriptions.map((p) => p.patient_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">Unique patients</p>
          </CardContent>
        </Card>
      </div>

      {/* Prescriptions List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPrescriptions.length === 0 ? (
          <Card className="col-span-full shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No prescriptions found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Get started by creating your first prescription"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Prescription
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredPrescriptions.map((prescription) => (
            <Card key={prescription.id} className="shadow-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{prescription.medication_name}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="mr-1 h-3 w-3" />
                      {prescription.patient_name || `Patient ${prescription.patient_id.substring(0, 8)}...`}
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    <Pill className="mr-1 h-3 w-3" />
                    Rx
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {prescription.dosage && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dosage:</span>
                      <span className="font-medium">{prescription.dosage}</span>
                    </div>
                  )}
                  {prescription.frequency && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frequency:</span>
                      <span className="font-medium">{prescription.frequency}</span>
                    </div>
                  )}
                  {prescription.duration && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{prescription.duration}</span>
                    </div>
                  )}
                  <div className="flex items-center text-xs text-muted-foreground pt-2 border-t">
                    <Calendar className="mr-1 h-3 w-3" />
                    {new Date(prescription.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleViewPrescription(prescription)}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditPrescription(prescription)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteClick(prescription)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Prescription Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Prescription</DialogTitle>
            <DialogDescription>
              Fill in the prescription details below
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePrescription}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient *</Label>
                <Select
                  value={formData.patient_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, patient_id: value })
                  }
                  required
                >
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

              <div className="space-y-2">
                <Label htmlFor="medication_name">Medication Name *</Label>
                <Input
                  id="medication_name"
                  value={formData.medication_name}
                  onChange={(e) =>
                    setFormData({ ...formData, medication_name: e.target.value })
                  }
                  placeholder="e.g., Amoxicillin"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    value={formData.dosage}
                    onChange={(e) =>
                      setFormData({ ...formData, dosage: e.target.value })
                    }
                    placeholder="500mg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Input
                    id="frequency"
                    value={formData.frequency}
                    onChange={(e) =>
                      setFormData({ ...formData, frequency: e.target.value })
                    }
                    placeholder="3x/day"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    placeholder="7 days"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional instructions..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Prescription"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Prescription Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-muted-foreground">Medication</Label>
                <p className="text-lg font-semibold">{selectedPrescription.medication_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Patient</Label>
                <p>{selectedPrescription.patient_name || selectedPrescription.patient_id}</p>
              </div>
              {selectedPrescription.dosage && (
                <div>
                  <Label className="text-muted-foreground">Dosage</Label>
                  <p>{selectedPrescription.dosage}</p>
                </div>
              )}
              {selectedPrescription.frequency && (
                <div>
                  <Label className="text-muted-foreground">Frequency</Label>
                  <p>{selectedPrescription.frequency}</p>
                </div>
              )}
              {selectedPrescription.duration && (
                <div>
                  <Label className="text-muted-foreground">Duration</Label>
                  <p>{selectedPrescription.duration}</p>
                </div>
              )}
              {selectedPrescription.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm">{selectedPrescription.notes}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p className="text-sm">
                  {new Date(selectedPrescription.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Prescription Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Prescription</DialogTitle>
            <DialogDescription>Update prescription details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePrescription}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_medication_name">Medication Name *</Label>
                <Input
                  id="edit_medication_name"
                  value={formData.medication_name}
                  onChange={(e) =>
                    setFormData({ ...formData, medication_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_dosage">Dosage</Label>
                  <Input
                    id="edit_dosage"
                    value={formData.dosage}
                    onChange={(e) =>
                      setFormData({ ...formData, dosage: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_frequency">Frequency</Label>
                  <Input
                    id="edit_frequency"
                    value={formData.frequency}
                    onChange={(e) =>
                      setFormData({ ...formData, frequency: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_duration">Duration</Label>
                  <Input
                    id="edit_duration"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_notes">Notes</Label>
                <Textarea
                  id="edit_notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Prescription"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Prescription</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this prescription? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedPrescription && (
            <div className="py-4">
              <p className="font-semibold">{selectedPrescription.medication_name}</p>
              <p className="text-sm text-muted-foreground">
                Patient: {selectedPrescription.patient_name || selectedPrescription.patient_id}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePrescription}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

