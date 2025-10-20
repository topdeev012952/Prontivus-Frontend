import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/permissions";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CalendarCheck,
  FileText, 
  Receipt, 
  Settings,
  Pill,
  Shield,
  Building2,
  Stethoscope,
  DollarSign,
  BarChart3,
  PhoneCall,
  Monitor
} from "lucide-react";

export function DebugPermissions() {
  const { user } = useAuth();
  const { 
    userRole, 
    userPermissions, 
    hasPermission, 
    canAccessRoute,
    isAdmin,
    isDoctor,
    isReceptionist,
    isFinancial,
    isPatient 
  } = usePermissions();

  if (!user) {
    return <div className="p-4 bg-red-100 text-red-800 rounded">No user logged in</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Debug: User Permissions</h3>
      
      {/* User Info */}
      <div className="bg-white p-3 rounded border">
        <h4 className="font-medium mb-2">User Information:</h4>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Normalized Role:</strong> {userRole}</p>
      </div>

      {/* Role Checks */}
      <div className="bg-white p-3 rounded border">
        <h4 className="font-medium mb-2">Role Checks:</h4>
        <p>Is Admin: {isAdmin ? "✅ Yes" : "❌ No"}</p>
        <p>Is Doctor: {isDoctor ? "✅ Yes" : "❌ No"}</p>
        <p>Is Receptionist: {isReceptionist ? "✅ Yes" : "❌ No"}</p>
        <p>Is Financial: {isFinancial ? "✅ Yes" : "❌ No"}</p>
        <p>Is Patient: {isPatient ? "✅ Yes" : "❌ No"}</p>
      </div>

      {/* User Permissions */}
      <div className="bg-white p-3 rounded border">
        <h4 className="font-medium mb-2">User Permissions ({userPermissions.length} total):</h4>
        <div className="grid grid-cols-2 gap-1 text-sm">
          {userPermissions.map((permission) => (
            <div key={permission} className="bg-green-50 p-1 rounded text-green-800">
              ✅ {permission}
            </div>
          ))}
        </div>
      </div>

      {/* Key Permission Checks */}
      <div className="bg-white p-3 rounded border">
        <h4 className="font-medium mb-2">Key Permission Checks:</h4>
        <div className="space-y-1 text-sm">
          <p>Can access Team Management: {hasPermission(PERMISSIONS.TEAM_MANAGEMENT_READ) ? "✅ Yes" : "❌ No"}</p>
          <p>Can access System Admin: {hasPermission(PERMISSIONS.SYSTEM_ADMIN) ? "✅ Yes" : "❌ No"}</p>
          <p>Can access Patients: {hasPermission(PERMISSIONS.PATIENTS_READ) ? "✅ Yes" : "❌ No"}</p>
          <p>Can access Appointments: {hasPermission(PERMISSIONS.APPOINTMENTS_READ) ? "✅ Yes" : "❌ No"}</p>
          <p>Can access Billing: {hasPermission(PERMISSIONS.BILLING_READ) ? "✅ Yes" : "❌ No"}</p>
          <p>Can access Reports: {hasPermission(PERMISSIONS.REPORTS_READ) ? "✅ Yes" : "❌ No"}</p>
        </div>
      </div>

      {/* Role Permissions Reference */}
      <div className="bg-white p-3 rounded border">
        <h4 className="font-medium mb-2">Available Role Permissions:</h4>
        <div className="space-y-2 text-sm">
          {Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => (
            <div key={role} className="border-l-4 border-blue-200 pl-2">
              <strong className="capitalize">{role}:</strong> {permissions.length} permissions
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Preview */}
      <div className="bg-white p-3 rounded border">
        <h4 className="font-medium mb-2">Sidebar Items Visibility:</h4>
        <div className="space-y-2 text-sm">
          {[
            { name: "Dashboard", permissions: [], icon: LayoutDashboard },
            { name: "Atendimento Médico", permissions: [PERMISSIONS.CONSULTATIONS_CREATE, PERMISSIONS.CONSULTATIONS_READ], icon: Stethoscope },
            { name: "Prontuários", permissions: [PERMISSIONS.MEDICAL_RECORDS_READ], icon: FileText },
            { name: "Prescrições", permissions: [PERMISSIONS.PRESCRIPTIONS_READ], icon: Pill },
            { name: "Agendamentos", permissions: [PERMISSIONS.APPOINTMENTS_READ], icon: Calendar },
            { name: "Solicitações", permissions: [PERMISSIONS.APPOINTMENTS_READ], icon: CalendarCheck },
            { name: "Pacientes", permissions: [PERMISSIONS.PATIENTS_READ], icon: Users },
            { name: "Chamar Pacientes", permissions: [PERMISSIONS.APPOINTMENTS_READ], icon: PhoneCall },
            { name: "Monitor Sala", permissions: [PERMISSIONS.APPOINTMENTS_READ], icon: Monitor },
            { name: "Faturamento", permissions: [PERMISSIONS.BILLING_READ], icon: DollarSign },
            { name: "Faturas", permissions: [PERMISSIONS.INVOICES_READ], icon: Receipt },
            { name: "Planos de Saúde", permissions: [PERMISSIONS.BILLING_READ], icon: Building2 },
            { name: "Módulo TISS", permissions: [PERMISSIONS.BILLING_READ], icon: Shield },
            { name: "Dashboard BI", permissions: [PERMISSIONS.REPORTS_READ], icon: BarChart3 },
            { name: "Gerenciar Equipe", permissions: [PERMISSIONS.TEAM_MANAGEMENT_READ], icon: Users },
            { name: "Configurações", permissions: [PERMISSIONS.SYSTEM_ADMIN], icon: Settings },
          ].map((item) => {
            const canAccess = item.permissions.length === 0 || canAccessRoute(item.permissions);
            return (
              <div key={item.name} className={`flex items-center gap-2 p-2 rounded ${canAccess ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
                <span className="ml-auto">{canAccess ? '✅' : '❌'}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
