import { useState, useEffect } from "react";
import { DollarSign, Plus, Search, Filter, Loader2, FileText, Calendar, User, Download, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api";

interface Invoice {
  id: string;
  clinic_id: string;
  patient_id?: string;
  appointment_id?: string;
  amount: number;
  method?: string;
  status: string;
  due_date?: string;
  paid_at?: string;
  payment_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  patient_name?: string;
}

interface PaginatedResponse {
  items: Invoice[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

interface Patient {
  id: string;
  name: string;
  cpf?: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  start_time: string;
  status: string;
}

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [formData, setFormData] = useState({
    patient_id: "",
    appointment_id: "",
    amount: "",
    method: "",
    status: "pending",
    due_date: "",
  });

  useEffect(() => {
    loadInvoices();
  }, [page]);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (page === 1) {
        loadInvoices();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: page.toString(),
        size: "20",
      });

      const data = await apiClient.request<PaginatedResponse>(
        `/invoices?${params.toString()}`
      );

      setInvoices(data.items);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch (err) {
      console.error("Error loading invoices:", err);
      setError("Failed to load invoices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const data = await apiClient.request<PaginatedResponse>("/patients?page=1&size=100");
      setPatients(data.items as any);
    } catch (err) {
      console.error("Error loading patients:", err);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError("");

      const invoiceData = {
        patient_id: formData.patient_id || null,
        appointment_id: formData.appointment_id || null,
        amount: parseFloat(formData.amount),
        method: formData.method || null,
        status: formData.status,
        due_date: formData.due_date || null,
        payment_metadata: {}
      };

      await apiClient.request("/invoices", {
        method: "POST",
        body: JSON.stringify(invoiceData),
      });

      // Reset form
      setFormData({
        patient_id: "",
        appointment_id: "",
        amount: "",
        method: "",
        status: "pending",
        due_date: "",
      });
      
      setShowCreateDialog(false);
      
      // Reload invoices
      await loadInvoices();
    } catch (err: any) {
      console.error("Error creating invoice:", err);
      setError(err.message || "Failed to create invoice. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewDialog(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      patient_id: invoice.patient_id || "",
      appointment_id: invoice.appointment_id || "",
      amount: invoice.amount.toString(),
      method: invoice.method || "",
      status: invoice.status,
      due_date: invoice.due_date || "",
    });
    setShowEditDialog(true);
  };

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInvoice) return;

    try {
      setSaving(true);
      setError("");

      const updateData = {
        amount: parseFloat(formData.amount),
        method: formData.method || null,
        status: formData.status,
        due_date: formData.due_date || null,
      };

      await apiClient.request(`/invoices/${selectedInvoice.id}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });

      setShowEditDialog(false);
      setSelectedInvoice(null);
      
      // Reset form
      setFormData({
        patient_id: "",
        appointment_id: "",
        amount: "",
        method: "",
        status: "pending",
        due_date: "",
      });
      
      // Reload invoices
      await loadInvoices();
    } catch (err: any) {
      console.error("Error updating invoice:", err);
      setError(err.message || "Failed to update invoice. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDeleteDialog(true);
  };

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;

    try {
      setDeleting(true);
      setError("");

      await apiClient.request(`/invoices/${selectedInvoice.id}`, {
        method: "DELETE",
      });

      setShowDeleteDialog(false);
      setSelectedInvoice(null);
      
      // Reload invoices
      await loadInvoices();
    } catch (err: any) {
      console.error("Error deleting invoice:", err);
      setError(err.message || "Failed to delete invoice. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "overdue":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      case "cancelled":
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: "Paid",
      pending: "Pending",
      overdue: "Overdue",
      cancelled: "Cancelled"
    };
    return labels[status.toLowerCase()] || status;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Calculate statistics
  const totalRevenue = invoices.reduce((sum, inv) => inv.status.toLowerCase() === 'paid' ? sum + inv.amount : sum, 0);
  const pendingAmount = invoices.reduce((sum, inv) => inv.status.toLowerCase() === 'pending' ? sum + inv.amount : sum, 0);
  const overdueAmount = invoices.reduce((sum, inv) => inv.status.toLowerCase() === 'overdue' ? sum + inv.amount : sum, 0);

  // Filter invoices by search
  const filteredInvoices = searchQuery
    ? invoices.filter(inv => 
        inv.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : invoices;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">
            {total > 0 ? `Managing ${total.toLocaleString()} invoices` : "Manage invoices and payments"}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Paid invoices
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <FileText className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <FileText className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(overdueAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Past due date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by patient name or invoice ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                disabled={loading}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredInvoices.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "Get started by creating your first invoice"}
            </p>
            <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Invoices Table */}
      {!loading && filteredInvoices.length > 0 && (
        <>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Complete list of invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="cursor-pointer" onClick={() => handleViewInvoice(invoice)}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {invoice.patient_name || `Patient #${invoice.patient_id?.slice(0, 8) || 'N/A'}`}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell className="capitalize">{invoice.method || "N/A"}</TableCell>
                    <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {getStatusLabel(invoice.status)}
                      </Badge>
                    </TableCell>
                      <TableCell>{formatDate(invoice.due_date)}</TableCell>
                      <TableCell>{formatDate(invoice.created_at)}</TableCell>
                    <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewInvoice(invoice);
                            }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditInvoice(invoice);
                            }}
                            title="Edit Invoice"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(invoice);
                            }}
                            title="Delete Invoice"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                      </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing page {page} of {totalPages} ({total.toLocaleString()} total invoices)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                </Button>
              </div>
    </div>
          )}
        </>
      )}

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Invoice</DialogTitle>
            <DialogDescription>
              Create a new invoice for a patient
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInvoice}>
            <div className="grid gap-4 py-4">
              {/* Patient Selection */}
              <div className="grid gap-2">
                <Label htmlFor="patient">Patient *</Label>
                <Select
                  value={formData.patient_id}
                  onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name} {patient.cpf && `- CPF: ${patient.cpf}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (R$) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                {/* Due Date */}
                <div className="grid gap-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Payment Method */}
                <div className="grid gap-2">
                  <Label htmlFor="method">Payment Method</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(value) => setFormData({ ...formData, method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !formData.patient_id || !formData.amount}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Invoice"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              Invoice #{selectedInvoice?.id.slice(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6 py-4">
              {/* Patient Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground">Patient</Label>
                <p className="font-semibold text-lg">
                  {selectedInvoice.patient_name || `Patient #${selectedInvoice.patient_id?.slice(0, 8) || 'N/A'}`}
                </p>
              </div>

              {/* Amount and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Amount</Label>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(selectedInvoice.amount)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-2">
                    <Badge className={getStatusColor(selectedInvoice.status)}>
                      {getStatusLabel(selectedInvoice.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Dates and Method */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Payment Method</Label>
                  <p className="font-medium capitalize">{selectedInvoice.method || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Due Date</Label>
                  <p className="font-medium">{formatDate(selectedInvoice.due_date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <p className="text-sm">{formatDate(selectedInvoice.created_at)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Paid At</Label>
                  <p className="text-sm">{formatDate(selectedInvoice.paid_at)}</p>
                </div>
              </div>

              {/* IDs */}
              <div className="border-t pt-4 text-xs text-muted-foreground space-y-1">
                <p>Invoice ID: {selectedInvoice.id}</p>
                {selectedInvoice.patient_id && <p>Patient ID: {selectedInvoice.patient_id}</p>}
                {selectedInvoice.appointment_id && <p>Appointment ID: {selectedInvoice.appointment_id}</p>}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowViewDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>
              Update invoice information. Patient cannot be changed.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateInvoice}>
            <div className="grid gap-4 py-4">
              {/* Patient (Read-only) */}
              <div className="grid gap-2">
                <Label>Patient (Cannot be changed)</Label>
                <Input
                  value={selectedInvoice?.patient_name || `Patient #${selectedInvoice?.patient_id?.slice(0, 8)}`}
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* Amount */}
              <div className="grid gap-2">
                <Label htmlFor="edit-amount">Amount (R$) *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  placeholder="150.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Payment Method */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-method">Payment Method</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(value) => setFormData({ ...formData, method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Due Date */}
              <div className="grid gap-2">
                <Label htmlFor="edit-due_date">Due Date</Label>
                <Input
                  id="edit-due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !formData.amount}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Invoice"
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
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="py-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="font-medium">
                  {selectedInvoice.patient_name || `Patient #${selectedInvoice.patient_id?.slice(0, 8)}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Amount: {formatCurrency(selectedInvoice.amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {getStatusLabel(selectedInvoice.status)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Created: {formatDate(selectedInvoice.created_at)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                This invoice will be permanently removed from the system.
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
              onClick={handleDeleteInvoice}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Invoice
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}