import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/usePermissions';
import { getUserPermissions, ROLE_PERMISSIONS } from '@/lib/permissions';

/**
 * Demo component to showcase RBAC functionality
 * This component allows testing different user roles and their permissions
 */
export function RoleDemo() {
  const { userRole, userPermissions } = usePermissions();
  const [selectedRole, setSelectedRole] = useState(userRole);
  
  const demoRoles = Object.keys(ROLE_PERMISSIONS) as Array<keyof typeof ROLE_PERMISSIONS>;
  
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'superadmin': return 'bg-red-500';
      case 'admin': return 'bg-blue-500';
      case 'doctor': return 'bg-green-500';
      case 'receptionist': return 'bg-yellow-500';
      case 'financial': return 'bg-purple-500';
      case 'patient': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Role-Based Access Control (RBAC) Demo</h1>
        <p className="text-muted-foreground">
          Test different user roles and see how sidebar navigation changes based on permissions
        </p>
      </div>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current User Information</CardTitle>
          <CardDescription>
            Your current role and permissions in the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge className={`${getRoleColor(userRole)} text-white`}>
              {userRole.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {userPermissions.length} permissions assigned
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {userPermissions.map((permission) => (
              <Badge key={permission} variant="outline" className="text-xs">
                {permission}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Available Roles & Permissions</CardTitle>
          <CardDescription>
            Compare different roles and their access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoRoles.map((role) => {
              const permissions = getUserPermissions(role);
              const isSelected = selectedRole === role;
              
              return (
                <Card 
                  key={role} 
                  className={`cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedRole(role)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getRoleColor(role)} text-white`}>
                        {role.toUpperCase()}
                      </Badge>
                      {isSelected && (
                        <Badge variant="outline">Selected</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{role}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {permissions.length} permissions
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {permissions.slice(0, 5).map((permission) => (
                        <div key={permission} className="text-xs bg-muted px-2 py-1 rounded">
                          {permission}
                        </div>
                      ))}
                      {permissions.length > 5 && (
                        <div className="text-xs text-muted-foreground">
                          +{permissions.length - 5} more...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sidebar Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Sidebar Navigation Preview</CardTitle>
          <CardDescription>
            See how the sidebar would look for the selected role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-sidebar-bg text-sidebar-foreground p-4 rounded-lg">
            <div className="space-y-4">
              <div className="border-b border-sidebar-active/20 pb-2">
                <h3 className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                  Principal
                </h3>
                <div className="text-sm">📊 Dashboard</div>
              </div>
              
              {selectedRole && (
                <>
                  {/* Atendimento Clínico */}
                  {['doctor', 'admin', 'superadmin'].includes(selectedRole.toLowerCase()) && (
                    <div className="border-b border-sidebar-active/20 pb-2">
                      <h3 className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                        Atendimento Clínico
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div>🩺 Atendimento Médico</div>
                        <div>📋 Prontuários</div>
                        <div>💊 Prescrições</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Secretaria */}
                  {['receptionist', 'admin', 'superadmin'].includes(selectedRole.toLowerCase()) && (
                    <div className="border-b border-sidebar-active/20 pb-2">
                      <h3 className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                        Secretaria
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div>📅 Agendamentos</div>
                        <div>📝 Solicitações</div>
                        <div>👥 Pacientes</div>
                        <div>📞 Chamar Pacientes</div>
                        <div>📺 Monitor Sala</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Financeiro */}
                  {['financial', 'admin', 'superadmin'].includes(selectedRole.toLowerCase()) && (
                    <div className="border-b border-sidebar-active/20 pb-2">
                      <h3 className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                        Financeiro
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div>💰 Faturamento</div>
                        <div>🧾 Faturas</div>
                        <div>🏥 Planos de Saúde</div>
                        <div>🛡️ Módulo TISS</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Sistema */}
                  {selectedRole.toLowerCase() === 'superadmin' && (
                    <div>
                      <h3 className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                        Sistema
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div>📊 Dashboard BI</div>
                        <div>👥 Gerenciar Equipe</div>
                        <div>⚙️ Configurações</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. <strong>Select different roles</strong> above to see how permissions change</p>
          <p>2. <strong>Check the sidebar</strong> - menu items will be filtered based on user role</p>
          <p>3. <strong>Try accessing protected routes</strong> - you'll be redirected if you don't have permissions</p>
          <p>4. <strong>In a real scenario</strong>, user roles are assigned by administrators</p>
        </CardContent>
      </Card>
    </div>
  );
}
