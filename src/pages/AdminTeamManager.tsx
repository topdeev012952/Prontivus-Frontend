/**
 * Team Management Page for Prontivus Admin Panel.
 * Allows administrators to manage team members and assign roles.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, Plus, Edit, Trash2, Shield, UserCheck, UserX, Mail, 
  Phone, Calendar, Loader2, AlertCircle, CheckCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  clinic_name?: string;
}

interface Role {
  name: string;
  display_name: string;
  description: string;
  permissions: string[];
}

export default function AdminTeamManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Record<string, Role>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    permissions: {} as Record<string, boolean>,
    is_active: true
  });

  // Load team members and roles
  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      // Load team members
      const membersResponse = await apiClient.request<TeamMember[]>('/team_management/');
      setTeamMembers(membersResponse);
      
      // Load available roles
      const rolesResponse = await apiClient.request<Record<string, Role>>('/team_management/roles');
      setRoles(rolesResponse);
      
    } catch (error) {
      console.error('Error loading team data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da equipe",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async () => {
    try {
      setSaving(true);
      
      const response = await apiClient.request('/team_management/', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      toast({
        title: "Sucesso",
        description: "Membro da equipe criado com sucesso"
      });
      
      setShowCreateModal(false);
      resetForm();
      loadTeamData();
      
    } catch (error) {
      console.error('Error creating team member:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar membro da equipe",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditMember = async () => {
    if (!editingMember) return;
    
    try {
      setSaving(true);
      
      const updateData = { ...formData };
      delete updateData.password; // Don't update password if empty
      
      await apiClient.request(`/team_management/${editingMember.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
      
      toast({
        title: "Sucesso",
        description: "Membro da equipe atualizado com sucesso"
      });
      
      setShowEditModal(false);
      setEditingMember(null);
      resetForm();
      loadTeamData();
      
    } catch (error) {
      console.error('Error updating team member:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar membro da equipe",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Tem certeza que deseja excluir ${memberName}?`)) return;
    
    try {
      setSaving(true);
      
      await apiClient.request(`/team_management/${memberId}`, {
        method: 'DELETE'
      });
      
      toast({
        title: "Sucesso",
        description: "Membro da equipe excluído com sucesso"
      });
      
      loadTeamData();
      
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir membro da equipe",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '',
      permissions: {},
      is_active: true
    });
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      password: '',
      role: member.role,
      permissions: member.permissions,
      is_active: member.is_active
    });
    setShowEditModal(true);
  };

  const getRoleDisplayName = (roleKey: string) => {
    return roles[roleKey]?.display_name || roleKey;
  };

  const getRoleDescription = (roleKey: string) => {
    return roles[roleKey]?.description || '';
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <UserCheck className="h-3 w-3 mr-1" />
        Ativo
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
        <UserX className="h-3 w-3 mr-1" />
        Inativo
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Carregando equipe...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Equipe</h1>
          <p className="text-gray-600">Gerencie membros da equipe e suas permissões</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Usuário
        </Button>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                </div>
                {getStatusBadge(member.is_active)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Função</p>
                <p className="text-sm text-gray-600">{getRoleDisplayName(member.role)}</p>
                <p className="text-xs text-gray-500 mt-1">{getRoleDescription(member.role)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Membro desde</p>
                <p className="text-sm text-gray-600">
                  {new Date(member.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(member)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteMember(member.id, member.name)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={member.id === user?.id} // Prevent self-deletion
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {teamMembers.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum membro da equipe</h3>
            <p className="text-gray-600 mb-4">Comece adicionando membros à sua equipe</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Membro
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Member Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Membro da Equipe</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo membro da equipe
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo do usuário"
              />
            </div>
            
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@exemplo.com"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Senha Temporária</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Senha temporária"
              />
            </div>
            
            <div>
              <Label htmlFor="role">Função</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roles).map(([key, role]) => (
                    <SelectItem key={key} value={key}>
                      {role.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
              />
              <Label htmlFor="is_active">Usuário ativo</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateMember} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Membro'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Membro da Equipe</DialogTitle>
            <DialogDescription>
              Atualize os dados do membro da equipe
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome Completo</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo do usuário"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@exemplo.com"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-password">Nova Senha (opcional)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Deixe em branco para manter a senha atual"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-role">Função</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roles).map(([key, role]) => (
                    <SelectItem key={key} value={key}>
                      {role.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
              />
              <Label htmlFor="edit-is_active">Usuário ativo</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditMember} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}