import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  DollarSign,
  CreditCard,
  Banknote,
  Wallet,
  Building2,
  Plus,
  Download,
  FileText,
  Loader2,
  Search,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Receipt
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatTime } from "@/lib/utils";

interface PaymentRecord {
  id: string;
  patient_id: string;
  patient_name: string;
  appointment_id: string;
  appointment_date: string;
  payment_method: string;
  insurance_plan?: string;
  insurance_plan_name?: string;
  amount: number;
  payment_date: string;
  status: "pending" | "paid" | "cancelled";
  notes?: string;
  created_by: string;
  created_at: string;
}

interface InsurancePlan {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
}

interface Patient {
  id: string;
  name: string;
  cpf: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_name: string;
  start_time: string;
  status: string;
}

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [insurancePlans, setInsurancePlans] = useState<InsurancePlan[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    patient_id: "",
    appointment_id: "",
    payment_method: "",
    insurance_plan_id: "",
    amount: "",
    payment_date: new Date().toISOString().split('T')[0],
    status: "paid" as "pending" | "paid" | "cancelled",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPayments(),
        loadInsurancePlans(),
        loadPatients(),
        loadAppointments(),
      ]);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      const response = await apiClient.request<any>("/billing/payments");
      // Handle both array and object responses
      if (Array.isArray(response)) {
        setPayments(response);
      } else if (response && Array.isArray(response.items)) {
        setPayments(response.items);
      } else if (response && Array.isArray(response.data)) {
        setPayments(response.data);
      } else {
        setPayments([]);
      }
    } catch (err: any) {
      console.error("Error loading payments:", err);
      // Set empty array on error to prevent filter errors
      setPayments([]);
      toast({
        title: "Erro",
        description: "Falha ao carregar pagamentos",
        variant: "destructive",
      });
    }
  };

  const loadInsurancePlans = async () => {
    try {
      const response = await apiClient.request<any>("/tiss/providers");
      // Handle both array and object responses
      if (Array.isArray(response)) {
        setInsurancePlans(response);
      } else if (response && Array.isArray(response.items)) {
        setInsurancePlans(response.items);
      } else {
        setInsurancePlans([]);
      }
    } catch (err: any) {
      console.error("Error loading insurance plans:", err);
      // Set empty array on error to prevent filter errors
      setInsurancePlans([]);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await apiClient.request<any>("/patients/list?page=1&size=100");
      // Handle both array and object responses
      if (Array.isArray(response)) {
        setPatients(response);
      } else if (response && Array.isArray(response.items)) {
        setPatients(response.items);
      } else if (response && Array.isArray(response.data)) {
        setPatients(response.data);
      } else {
        setPatients([]);
      }
    } catch (err: any) {
      console.error("Error loading patients:", err);
      // Set empty array on error to prevent filter errors
      setPatients([]);
    }
  };

  const loadAppointments = async () => {
    try {
      // Get recent appointments
      const today = new Date().toISOString().split('T')[0];
      const response = await apiClient.request<any>(`/appointments/list?status=completed,scheduled&limit=100`);
      // Handle both array and object responses
      if (Array.isArray(response)) {
        setAppointments(response);
      } else if (response && Array.isArray(response.items)) {
        setAppointments(response.items);
      } else if (response && Array.isArray(response.data)) {
        setAppointments(response.data);
      } else {
        setAppointments([]);
      }
    } catch (err: any) {
      console.error("Error loading appointments:", err);
      // Set empty array on error to prevent filter errors
      setAppointments([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.patient_id) {
      toast({
        title: "Erro",
        description: "Selecione um paciente",
        variant: "destructive",
      });
      return;
    }

    if (!formData.payment_method) {
      toast({
        title: "Erro",
        description: "Selecione a forma de pagamento",
        variant: "destructive",
      });
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Erro",
        description: "Informe um valor válido",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        patient_id: formData.patient_id,
        appointment_id: formData.appointment_id || null,
        payment_method: formData.payment_method,
        insurance_plan_id: formData.insurance_plan_id || null,
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date,
        status: formData.status,
        notes: formData.notes || null,
      };

      await apiClient.request("/billing/payments", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso",
      });

      // Reset form and reload
      setFormData({
        patient_id: "",
        appointment_id: "",
        payment_method: "",
        insurance_plan_id: "",
        amount: "",
        payment_date: new Date().toISOString().split('T')[0],
        status: "paid",
        notes: "",
      });
      setDialogOpen(false);
      await loadPayments();
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Falha ao registrar pagamento",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = () => {
    const csvContent = [
      ["Data", "Paciente", "Forma de Pagamento", "Convênio", "Valor", "Status", "Observações"],
      ...filteredPayments.map(p => [
        formatDate(p.payment_date),
        p.patient_name,
        getPaymentMethodLabel(p.payment_method),
        p.insurance_plan_name || "Particular",
        `R$ ${p.amount.toFixed(2)}`,
        getStatusLabel(p.status),
        p.notes || "",
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `faturamento_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exportado",
      description: "Relatório exportado com sucesso",
    });
  };

  const handleExportPDF = async () => {
    try {
      setSaving(true);
      
      const response = await apiClient.request("/billing/export-pdf", {
        method: "POST",
        body: JSON.stringify({
          date_from: dateFrom || null,
          date_to: dateTo || null,
          status: filterStatus !== "all" ? filterStatus : null,
          payment_method: filterPaymentMethod !== "all" ? filterPaymentMethod : null,
        }),
      });

      if (response.pdf_base64) {
        const binaryString = atob(response.pdf_base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `relatorio_faturamento_${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);

        toast({
          title: "Exportado",
          description: "Relatório PDF gerado com sucesso",
        });
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Falha ao gerar PDF",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Dinheiro",
      credit_card: "Cartão de Crédito",
      debit_card: "Cartão de Débito",
      pix: "PIX",
      boleto: "Boleto",
      bank_transfer: "Transferência Bancária",
      insurance: "Convênio",
    };
    return labels[method] || method;
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4" />;
      case "credit_card":
      case "debit_card":
        return <CreditCard className="h-4 w-4" />;
      case "pix":
        return <DollarSign className="h-4 w-4" />;
      case "boleto":
        return <FileText className="h-4 w-4" />;
      case "bank_transfer":
        return <Building2 className="h-4 w-4" />;
      case "insurance":
        return <Receipt className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      paid: "Pago",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pago
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelado
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Apply filters - ensure payments is always an array
  const filteredPayments = (payments || []).filter(payment => {
    if (filterStatus !== "all" && payment.status !== filterStatus) return false;
    if (filterPaymentMethod !== "all" && payment.payment_method !== filterPaymentMethod) return false;
    if (searchTerm && !payment.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (dateFrom && payment.payment_date < dateFrom) return false;
    if (dateTo && payment.payment_date > dateTo) return false;
    return true;
  });

  // Calculate totals
  const totalPaid = filteredPayments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = filteredPayments
    .filter(p => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalByPaymentMethod = filteredPayments
    .filter(p => p.status === "paid")
    .reduce((acc, p) => {
      acc[p.payment_method] = (acc[p.payment_method] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

  const selectedPatientAppointments = (appointments || []).filter(
    a => a.patient_id === formData.patient_id
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faturamento</h1>
          <p className="text-gray-500 mt-1">Gerencie pagamentos e convênios</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Pagamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Novo Pagamento</DialogTitle>
              <DialogDescription>
                Registre um pagamento ou recebimento de paciente
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient_id">Paciente *</Label>
                  <Select
                    value={formData.patient_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, patient_id: value, appointment_id: "" });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map(patient => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name} - {patient.cpf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="appointment_id">Consulta (opcional)</Label>
                  <Select
                    value={formData.appointment_id}
                    onValueChange={(value) => setFormData({ ...formData, appointment_id: value })}
                    disabled={!formData.patient_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a consulta" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedPatientAppointments.map(appointment => (
                        <SelectItem key={appointment.id} value={appointment.id}>
                          {formatDate(appointment.start_time)} - {appointment.doctor_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment_method">Forma de Pagamento *</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Dinheiro</SelectItem>
                      <SelectItem value="credit_card">💳 Cartão de Crédito</SelectItem>
                      <SelectItem value="debit_card">💳 Cartão de Débito</SelectItem>
                      <SelectItem value="pix">📱 PIX</SelectItem>
                      <SelectItem value="boleto">🧾 Boleto</SelectItem>
                      <SelectItem value="bank_transfer">🏦 Transferência</SelectItem>
                      <SelectItem value="insurance">🏥 Convênio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.payment_method === "insurance" && (
                  <div>
                    <Label htmlFor="insurance_plan_id">Convênio</Label>
                    <Select
                      value={formData.insurance_plan_id}
                      onValueChange={(value) => setFormData({ ...formData, insurance_plan_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o convênio" />
                      </SelectTrigger>
                      <SelectContent>
                        {insurancePlans.map(plan => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Valor (R$) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <Label htmlFor="payment_date">Data do Pagamento *</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">✅ Pago</SelectItem>
                    <SelectItem value="pending">⏳ Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Salvar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {filteredPayments.filter(p => p.status === "paid").length} pagamento(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {filteredPayments.filter(p => p.status === "pending").length} pagamento(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {(totalPaid + totalPending).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {filteredPayments.length} registro(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Método Mais Usado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900">
              {Object.keys(totalByPaymentMethod).length > 0
                ? getPaymentMethodLabel(
                    Object.entries(totalByPaymentMethod).sort((a, b) => b[1] - a[1])[0][0]
                  )
                : "N/A"}
            </div>
            <p className="text-xs text-gray-500 mt-1">Forma de pagamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit_card">Cartão Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="insurance">Convênio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <Label>Data Final</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div>
              <Label>Buscar Paciente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="Nome do paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleExportExcel} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button onClick={handleExportPDF} variant="outline" size="sm" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Pagamento</CardTitle>
          <CardDescription>
            {filteredPayments.length} registro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum pagamento registrado</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Forma de Pagamento</TableHead>
                    <TableHead>Convênio</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(payment.payment_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{payment.patient_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(payment.payment_method)}
                          {getPaymentMethodLabel(payment.payment_method)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.insurance_plan_name ? (
                          <Badge variant="outline" className="bg-blue-50">
                            {payment.insurance_plan_name}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">Particular</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {payment.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

