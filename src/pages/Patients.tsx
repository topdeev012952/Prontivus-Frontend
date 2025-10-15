import { useState, useEffect } from "react";
import { Plus, Search, Filter, Loader2, Users as UsersIcon, X, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { apiClient } from "@/lib/api";

interface Patient {
  id: string;
  name: string;
  birthdate?: string;
  gender: string;
  cpf?: string;
  address?: Record<string, any>;
  phone?: string;
  email?: string;
  insurance_number?: string;
  insurance_provider?: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  items: Patient[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export default function Patients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    birthdate: "",
    gender: "unknown",
    cpf: "",
    phone: "",
    email: "",
    insurance_number: "",
    insurance_provider: "",
    address: {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zip_code: "",
    },
  });

  useEffect(() => {
    loadPatients();
  }, [page]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (page === 1) {
        loadPatients();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: page.toString(),
        size: "20",
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const data = await apiClient.request<PaginatedResponse>(
        `/patients?${params.toString()}`
      );

      setPatients(data.items);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch (err) {
      console.error("Error loading patients:", err);
      setError("Falha ao carregar pacientes. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError("");

      await apiClient.request("/patients", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      // Reset form
      setFormData({
        name: "",
        birthdate: "",
        gender: "unknown",
        cpf: "",
        phone: "",
        email: "",
        insurance_number: "",
        insurance_provider: "",
        address: {},
      });
      
      setShowAddDialog(false);
      
      // Reload patients
      await loadPatients();
    } catch (err: any) {
      console.error("Error creating patient:", err);
      setError(err.message || "Falha ao criar paciente. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowViewDialog(true);
  };

  const handleEditPatient = (patient: Patient) => {
    console.log("🔍 EDIT CLICKED - Patient:", patient.name, "ID:", patient.id, "CPF:", patient.cpf);
    setSelectedPatient(patient);
    setFormData({
      name: patient.name,
      birthdate: patient.birthdate || "",
      gender: patient.gender,
      cpf: patient.cpf || "",
      phone: patient.phone || "",
      email: patient.email || "",
      insurance_number: patient.insurance_number || "",
      insurance_provider: patient.insurance_provider || "",
      address: {
        street: patient.address?.street || "",
        number: patient.address?.number || "",
        complement: patient.address?.complement || "",
        neighborhood: patient.address?.neighborhood || "",
        city: patient.address?.city || "",
        state: patient.address?.state || "",
        zip_code: patient.address?.zip_code || "",
      },
    });
    setShowEditDialog(true);
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) return;

    console.log("💾 SAVING PATIENT");
    console.log("Selected Patient ID:", selectedPatient.id);
    console.log("Selected Patient Name:", selectedPatient.name);
    console.log("Selected Patient CPF:", selectedPatient.cpf);
    console.log("Form Data:", formData);
    console.log("API URL:", `/patients/${selectedPatient.id}`);

    try {
      setSaving(true);
      setError("");

      const response = await apiClient.request(`/patients/${selectedPatient.id}`, {
        method: "PATCH",
        body: JSON.stringify(formData),
      });

      console.log("✅ UPDATE SUCCESSFUL - Response:", response);

      setShowEditDialog(false);
      setSelectedPatient(null);
      
      // Reset form
      setFormData({
        name: "",
        birthdate: "",
        gender: "unknown",
        cpf: "",
        phone: "",
        email: "",
        insurance_number: "",
        insurance_provider: "",
        address: {},
      });
      
      // Reload patients
      await loadPatients();
    } catch (err: any) {
      console.error("❌ Error updating patient:", err);
      setError(err.message || "Falha ao atualizar paciente. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDeleteDialog(true);
  };

  const handleDeletePatient = async () => {
    if (!selectedPatient) return;

    try {
      setDeleting(true);
      setError("");

      await apiClient.request(`/patients/${selectedPatient.id}`, {
        method: "DELETE",
      });

      setShowDeleteDialog(false);
      setSelectedPatient(null);
      
      // Reload patients
      await loadPatients();
    } catch (err: any) {
      console.error("Error deleting patient:", err);
      setError(err.message || "Falha ao excluir paciente. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">
            {total > 0 ? `Gerencie seus ${total.toLocaleString()} registros de pacientes` : "Gerencie seus registros de pacientes"}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          Adicionar Paciente
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                disabled={loading}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
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
      {!loading && patients.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <UsersIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum paciente encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Tente ajustar seus critérios de busca"
                : "Comece adicionando seu primeiro paciente"}
            </p>
            <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4" />
              Adicionar Paciente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Patient List */}
      {!loading && patients.length > 0 && (
        <>
          <div className="space-y-3">
            {patients.map((patient) => (
              <Card key={patient.id} className="shadow-card hover:shadow-medical transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{patient.name}</h3>
                          <Badge variant="default">Ativo</Badge>
                        </div>
                        <div className="mt-1 flex gap-4 text-sm text-muted-foreground">
                          {patient.cpf && <span>CPF: {patient.cpf}</span>}
                          {patient.phone && <span>Telefone: {patient.phone}</span>}
                          {patient.insurance_provider && <span>Convênio: {patient.insurance_provider}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm text-muted-foreground mr-4">
                        <div>Cadastrado em</div>
                        <div className="font-medium text-foreground">
                          {formatDate(patient.created_at)}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPatient(patient);
                          }}
                          title="Ver Detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPatient(patient);
                          }}
                          title="Editar Paciente"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(patient);
                          }}
                          title="Excluir Paciente"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages} ({total.toLocaleString()} pacientes no total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Patient Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Paciente</DialogTitle>
            <DialogDescription>
              Preencha as informações do paciente. Campos marcados com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePatient}>
            <div className="grid gap-4 py-4">
              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* CPF */}
              <div className="grid gap-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Birthdate */}
                <div className="grid gap-2">
                  <Label htmlFor="birthdate">Data de Nascimento</Label>
                  <Input
                    id="birthdate"
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                  />
                </div>

                {/* Gender */}
                <div className="grid gap-2">
                  <Label htmlFor="gender">Sexo</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o sexo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">Prefiro não informar</SelectItem>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Phone */}
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 98765-4321"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                {/* Email */}
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="paciente@exemplo.com.br"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4 pt-2 border-t">
                <Label className="text-base font-semibold">Endereço</Label>
                
                <div className="grid grid-cols-3 gap-4">
                  {/* Street */}
                  <div className="col-span-2 grid gap-2">
                    <Label htmlFor="address_street">Rua/Avenida</Label>
                    <Input
                      id="address_street"
                      placeholder="Rua das Flores"
                      value={formData.address.street}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, street: e.target.value }
                      })}
                    />
                  </div>

                  {/* Number */}
                  <div className="grid gap-2">
                    <Label htmlFor="address_number">Número</Label>
                    <Input
                      id="address_number"
                      placeholder="123"
                      value={formData.address.number}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, number: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Complement */}
                  <div className="grid gap-2">
                    <Label htmlFor="address_complement">Complemento</Label>
                    <Input
                      id="address_complement"
                      placeholder="Apto 101, Bloco A"
                      value={formData.address.complement}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, complement: e.target.value }
                      })}
                    />
                  </div>

                  {/* Neighborhood */}
                  <div className="grid gap-2">
                    <Label htmlFor="address_neighborhood">Bairro</Label>
                    <Input
                      id="address_neighborhood"
                      placeholder="Centro"
                      value={formData.address.neighborhood}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, neighborhood: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* City */}
                  <div className="grid gap-2">
                    <Label htmlFor="address_city">Cidade</Label>
                    <Input
                      id="address_city"
                      placeholder="São Paulo"
                      value={formData.address.city}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, city: e.target.value }
                      })}
                    />
                  </div>

                  {/* State */}
                  <div className="grid gap-2">
                    <Label htmlFor="address_state">Estado</Label>
                    <Input
                      id="address_state"
                      placeholder="SP"
                      maxLength={2}
                      value={formData.address.state}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, state: e.target.value.toUpperCase() }
                      })}
                    />
                  </div>

                  {/* ZIP Code */}
                  <div className="grid gap-2">
                    <Label htmlFor="address_zip">CEP</Label>
                    <Input
                      id="address_zip"
                      placeholder="00000-000"
                      value={formData.address.zip_code}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, zip_code: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Insurance Number */}
                <div className="grid gap-2">
                  <Label htmlFor="insurance_number">Número do Convênio</Label>
                  <Input
                    id="insurance_number"
                    placeholder="0000000000"
                    value={formData.insurance_number}
                    onChange={(e) => setFormData({ ...formData, insurance_number: e.target.value })}
                  />
                </div>

                {/* Insurance Provider */}
                <div className="grid gap-2">
                  <Label htmlFor="insurance_provider">Operadora do Convênio</Label>
                  <Input
                    id="insurance_provider"
                    placeholder="Nome da operadora"
                    value={formData.insurance_provider}
                    onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Paciente"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Patient Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Paciente</DialogTitle>
            <DialogDescription>
              Informações completas de {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedPatient && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Nome Completo</Label>
                  <p className="font-medium mt-1">{selectedPatient.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">CPF</Label>
                  <p className="font-medium mt-1">{selectedPatient.cpf || "Não informado"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Data de Nascimento</Label>
                  <p className="font-medium mt-1">
                    {selectedPatient.birthdate ? formatDate(selectedPatient.birthdate) : "Não informada"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sexo</Label>
                  <p className="font-medium mt-1 capitalize">{selectedPatient.gender}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Telefone</Label>
                  <p className="font-medium mt-1">{selectedPatient.phone || "Não informado"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">E-mail</Label>
                  <p className="font-medium mt-1">{selectedPatient.email || "Não informado"}</p>
                </div>
              </div>

              {/* Address Section */}
              {selectedPatient.address && Object.keys(selectedPatient.address).length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-base font-semibold">Endereço</Label>
                  <div className="text-sm">
                    {selectedPatient.address.street && (
                      <p className="font-medium">
                        {selectedPatient.address.street}
                        {selectedPatient.address.number && `, ${selectedPatient.address.number}`}
                        {selectedPatient.address.complement && ` - ${selectedPatient.address.complement}`}
                      </p>
                    )}
                    {selectedPatient.address.neighborhood && (
                      <p>{selectedPatient.address.neighborhood}</p>
                    )}
                    {(selectedPatient.address.city || selectedPatient.address.state) && (
                      <p>
                        {selectedPatient.address.city}
                        {selectedPatient.address.state && ` - ${selectedPatient.address.state}`}
                      </p>
                    )}
                    {selectedPatient.address.zip_code && (
                      <p>CEP: {selectedPatient.address.zip_code}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Número do Convênio</Label>
                  <p className="font-medium mt-1">{selectedPatient.insurance_number || "Não informado"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Operadora do Convênio</Label>
                  <p className="font-medium mt-1">{selectedPatient.insurance_provider || "Não informada"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Cadastrado em</Label>
                  <p className="font-medium mt-1">{formatDate(selectedPatient.created_at)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Última Atualização</Label>
                  <p className="font-medium mt-1">{formatDate(selectedPatient.updated_at)}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
            <DialogDescription>
              Atualize as informações do paciente. Campos marcados com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePatient}>
            <div className="grid gap-4 py-4">
              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nome Completo *</Label>
                <Input
                  id="edit-name"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* CPF */}
              <div className="grid gap-2">
                <Label htmlFor="edit-cpf">CPF</Label>
                <Input
                  id="edit-cpf"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
              {/* Birthdate */}
              <div className="grid gap-2">
                <Label htmlFor="edit-birthdate">Data de Nascimento</Label>
                <Input
                  id="edit-birthdate"
                  type="date"
                    value={formData.birthdate}
                    onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                  />
                </div>

                {/* Gender */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-gender">Sexo</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o sexo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">Prefiro não informar</SelectItem>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Phone */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input
                    id="edit-phone"
                    placeholder="(11) 98765-4321"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                {/* Email */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">E-mail</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    placeholder="paciente@exemplo.com.br"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4 pt-2 border-t">
                <Label className="text-base font-semibold">Endereço</Label>
                
                <div className="grid grid-cols-3 gap-4">
                  {/* Street */}
                  <div className="col-span-2 grid gap-2">
                    <Label htmlFor="edit-address_street">Rua/Avenida</Label>
                    <Input
                      id="edit-address_street"
                      placeholder="Rua das Flores"
                      value={formData.address.street}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, street: e.target.value }
                      })}
                    />
                  </div>

                  {/* Number */}
                  <div className="grid gap-2">
                    <Label htmlFor="edit-address_number">Número</Label>
                    <Input
                      id="edit-address_number"
                      placeholder="123"
                      value={formData.address.number}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, number: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Complement */}
                  <div className="grid gap-2">
                    <Label htmlFor="edit-address_complement">Complemento</Label>
                    <Input
                      id="edit-address_complement"
                      placeholder="Apto 101, Bloco A"
                      value={formData.address.complement}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, complement: e.target.value }
                      })}
                    />
                  </div>

                  {/* Neighborhood */}
                  <div className="grid gap-2">
                    <Label htmlFor="edit-address_neighborhood">Bairro</Label>
                    <Input
                      id="edit-address_neighborhood"
                      placeholder="Centro"
                      value={formData.address.neighborhood}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, neighborhood: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* City */}
                  <div className="grid gap-2">
                    <Label htmlFor="edit-address_city">Cidade</Label>
                    <Input
                      id="edit-address_city"
                      placeholder="São Paulo"
                      value={formData.address.city}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, city: e.target.value }
                      })}
                    />
                  </div>

                  {/* State */}
                  <div className="grid gap-2">
                    <Label htmlFor="edit-address_state">Estado</Label>
                    <Input
                      id="edit-address_state"
                      placeholder="SP"
                      maxLength={2}
                      value={formData.address.state}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, state: e.target.value.toUpperCase() }
                      })}
                    />
                  </div>

                  {/* ZIP Code */}
                  <div className="grid gap-2">
                    <Label htmlFor="edit-address_zip">CEP</Label>
                    <Input
                      id="edit-address_zip"
                      placeholder="00000-000"
                      value={formData.address.zip_code}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, zip_code: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
              {/* Insurance Number */}
              <div className="grid gap-2">
                <Label htmlFor="edit-insurance_number">Número do Convênio</Label>
                <Input
                  id="edit-insurance_number"
                  placeholder="0000000000"
                    value={formData.insurance_number}
                    onChange={(e) => setFormData({ ...formData, insurance_number: e.target.value })}
                  />
                </div>

              {/* Insurance Provider */}
              <div className="grid gap-2">
                <Label htmlFor="edit-insurance_provider">Operadora do Convênio</Label>
                <Input
                  id="edit-insurance_provider"
                  placeholder="Nome da operadora"
                    value={formData.insurance_provider}
                    onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || !formData.name}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  "Atualizar Paciente"
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
            <DialogTitle>Excluir Paciente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          {selectedPatient && (
            <div className="py-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="font-medium">{selectedPatient.name}</p>
                {selectedPatient.cpf && <p className="text-sm text-muted-foreground">CPF: {selectedPatient.cpf}</p>}
                {selectedPatient.phone && <p className="text-sm text-muted-foreground">Telefone: {selectedPatient.phone}</p>}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Todas as consultas, prontuários e faturas relacionadas permanecerão no sistema.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePatient}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Paciente
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}