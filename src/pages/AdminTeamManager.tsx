import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Stethoscope,
  ClipboardList,
  DollarSign,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  crm?: string;
  phone?: string;
  permissions: Record<string, boolean>;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

interface UserCreate {
  name: string;
  email: string;
  password: string;
  role: string;
  crm?: string;
  phone?: string;
  permissions?: Record<string, boolean>;
}

interface UserUpdate {
  name?: string;
  email?: string;
  role?: string;
  crm?: string;
  phone?: string;
  permissions?: Record<string, boolean>;
  is_active?: boolean;
}

const ROLES = {
  administrador: { name: "Administrador", icon: Shield, color: "bg-red-100 text-red-800" },
  medico: { name: "Médico", icon: Stethoscope, color: "bg-blue-100 text-blue-800" },
  secretaria: { name: "Secretária", icon: ClipboardList, color: "bg-green-100 text-green-800" },
  financeiro: { name: "Financeiro", icon: DollarSign, color: "bg-yellow-100 text-yellow-800" },
};

const PERMISSIONS = [
  { key: "can_view_patients", label: "Visualizar Pacientes" },
  { key: "can_edit_patients", label: "Editar Pacientes" },
  { key: "can_view_appointments", label: "Visualizar Agendamentos" },
  { key: "can_edit_appointments", label: "Editar Agendamentos" },
  { key: "can_view_consultations", label: "Visualizar Consultas" },
  { key: "can_edit_consultations", label: "Editar Consultas" },
  { key: "can_view_reports", label: "Visualizar Relatórios" },
  { key: "can_manage_users", label: "Gerenciar Usuários" },
  { key: "can_manage_settings", label: "Gerenciar Configurações" },
];

export default function AdminTeamManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState<UserCreate>({
    name: "",
    email: "",
    password: "",
    role: "medico",
    crm: "",
    phone: "",
    permissions: {},
  });

  const [editFormData, setEditFormData] = useState<UserUpdate>({
    name: "",
    email: "",
    role: "medico",
    crm: "",
    phone: "",
    permissions: {},
    is_active: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.request("/team/users");
      setUsers(response.users || []);
    } catch (err: any) {
      setError(err.message || "Falha ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setSaving(true);
      await apiClient.request("/team/users", {
        method: "POST",
        data: formData,
      });

      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso",
      });

      setShowCreateDialog(false);
      resetForm();
      await loadUsers();
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Falha ao criar usuário",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      await apiClient.request(`/team/users/${selectedUser.id}`, {
        method: "PATCH",
        data: editFormData,
      });

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso",
      });

      setShowEditDialog(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Falha ao atualizar usuário",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) {
      return;
    }

    try {
      await apiClient.request(`/team/users/${user.id}`, {
        method: "DELETE",
      });

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso",
      });

      await loadUsers();
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Falha ao excluir usuário",
        variant: "destructive",
      });
    }
  };

  const handleActivateUser = async (user: User) => {
    try {
      await apiClient.request(`/team/users/${user.id}/activate`, {
        method: "POST",
      });

      toast({
        title: "Sucesso",
        description: "Usuário ativado com sucesso",
      });

      await loadUsers();
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Falha ao ativar usuário",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      crm: user.crm || "",
      phone: user.phone || "",
      permissions: { ...user.permissions },
      is_active: user.is_active,
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "medico",
      crm: "",
      phone: "",
      permissions: {},
    });
  };

  const getRoleInfo = (role: string) => {
    return ROLES[role as keyof typeof ROLES] || { name: role, icon: Users, color: "bg-gray-100 text-gray-800" };
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && user.is_active) ||
                         (statusFilter === "inactive" && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Equipe</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, funções e permissões do sistema
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Usuário
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="role-filter">Função</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as funções</SelectItem>
                  {Object.entries(ROLES).map(([key, role]) => (
                    <SelectItem key={key} value={key}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Login</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const roleInfo = getRoleInfo(user.role);
                const IconComponent = roleInfo.icon;
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        {user.crm && (
                          <div className="text-sm text-muted-foreground">
                            CRM: {user.crm}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={roleInfo.color}>
                        <IconComponent className="h-3 w-3 mr-1" />
                        {roleInfo.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.last_login ? formatDate(user.last_login) : "Nunca"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {user.is_active ? (
                            <DropdownMenuItem onClick={() => handleDeleteUser(user)}>
                              <UserX className="h-4 w-4 mr-2" />
                              Desativar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleActivateUser(user)}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Ativar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Usuário</DialogTitle>
            <DialogDescription>
              Crie uma nova conta de usuário para sua equipe
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo do usuário"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Senha Temporária *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Senha temporária"
                />
              </div>
              <div>
                <Label htmlFor="role">Função *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLES).map(([key, role]) => (
                      <SelectItem key={key} value={key}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="crm">CRM (apenas para médicos)</Label>
                <Input
                  id="crm"
                  value={formData.crm}
                  onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                  placeholder="123456"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-base font-medium">Permissões Específicas</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Personalize as permissões para este usuário
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PERMISSIONS.map((permission) => (
                  <div key={permission.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission.key}
                      checked={formData.permissions?.[permission.key] || false}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            [permission.key]: checked as boolean,
                          },
                        })
                      }
                    />
                    <Label htmlFor={permission.key} className="text-sm">
                      {permission.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Usuário"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nome Completo *</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="Nome completo do usuário"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-role">Função *</Label>
                <Select value={editFormData.role} onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLES).map(([key, role]) => (
                      <SelectItem key={key} value={key}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-crm">CRM (apenas para médicos)</Label>
                <Input
                  id="edit-crm"
                  value={editFormData.crm}
                  onChange={(e) => setEditFormData({ ...editFormData, crm: e.target.value })}
                  placeholder="123456"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-active"
                  checked={editFormData.is_active}
                  onCheckedChange={(checked) => setEditFormData({ ...editFormData, is_active: checked as boolean })}
                />
                <Label htmlFor="edit-active">Usuário ativo</Label>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-base font-medium">Permissões Específicas</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Personalize as permissões para este usuário
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PERMISSIONS.map((permission) => (
                  <div key={permission.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${permission.key}`}
                      checked={editFormData.permissions?.[permission.key] || false}
                      onCheckedChange={(checked) =>
                        setEditFormData({
                          ...editFormData,
                          permissions: {
                            ...editFormData.permissions,
                            [permission.key]: checked as boolean,
                          },
                        })
                      }
                    />
                    <Label htmlFor={`edit-${permission.key}`} className="text-sm">
                      {permission.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedUser(null);
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
