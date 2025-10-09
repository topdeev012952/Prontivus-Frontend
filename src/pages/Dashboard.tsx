import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import AdminDashboard from "./dashboards/AdminDashboard";
import DoctorDashboard from "./dashboards/DoctorDashboard";
import SecretaryDashboard from "./dashboards/SecretaryDashboard";
import FinanceDashboard from "./dashboards/FinanceDashboard";
import PatientPortal from "./dashboards/PatientPortal";

/**
 * Main Dashboard - Routes to role-specific dashboard
 * 
 * Roles:
 * - Admin/Superadmin: System overview, clinics, staff, integrations
 * - Doctor: Today's agenda, queue, AI tools, telemedicine
 * - Secretary: Scheduling, queue management, patient calls
 * - Finance: Invoices, TISS status, payments, overdue alerts
 * - Patient: Portal with records, prescriptions, appointments
 */
export default function Dashboard() {
  const { user } = useAuth();

  // Loading state while user data is being fetched
  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Normalize role to lowercase for comparison
  const userRole = user.role?.toLowerCase();

  // Route to appropriate dashboard based on user role
  switch (userRole) {
    case 'admin':
    case 'superadmin':
      return <AdminDashboard />;
    
    case 'doctor':
    case 'médico':
    case 'dr':
      return <DoctorDashboard />;
    
    case 'secretary':
    case 'secretária':
    case 'receptionist':
    case 'recepcionista':
      return <SecretaryDashboard />;
    
    case 'finance':
    case 'financeiro':
    case 'billing':
    case 'faturamento':
      return <FinanceDashboard />;
    
    case 'patient':
    case 'paciente':
      return <PatientPortal />;
    
    default:
      // Default to doctor dashboard for unknown roles
      console.warn(`Unknown role: ${user.role}, defaulting to doctor dashboard`);
      return <DoctorDashboard />;
  }
}
