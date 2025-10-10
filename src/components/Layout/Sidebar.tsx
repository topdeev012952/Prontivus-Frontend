import { NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Receipt, 
  Settings,
  Activity,
  LogOut,
  BarChart3,
  Clock,
  Menu,
  Pill,
  Shield,
  Video,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ClinicSwitcher } from "@/components/ClinicSwitcher";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { name: "Pacientes", href: "/app/patients", icon: Users },
  { name: "Consultas", href: "/app/appointments", icon: Calendar },
  { name: "Prontuários", href: "/app/records", icon: FileText },
  { name: "Prescrições", href: "/app/prescriptions", icon: Pill },
  { name: "Faturas", href: "/app/invoices", icon: Receipt },
  { name: "Sala de Espera", href: "/app/waiting-room", icon: Clock },
  { name: "Módulo TISS", href: "/app/tiss", icon: Shield },
  { name: "Planos de Saúde", href: "/app/health-plans", icon: Building2 },
  { name: "Dashboard BI", href: "/app/bi-dashboard", icon: BarChart3 },
  { name: "Configurações", href: "/app/settings", icon: Settings },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "U";
    const names = user.name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Mobile overlay */}
      <div className={`fixed inset-0 bg-black/50 z-40 lg:hidden ${isCollapsed ? 'hidden' : 'block'}`} onClick={() => setIsCollapsed(true)} />
      
      <div className={`${isCollapsed ? '-translate-x-full' : 'translate-x-0'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-sidebar-bg transition-transform duration-200`}>
        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden absolute top-4 -right-12 text-white bg-sidebar-bg hover:bg-sidebar-bg/90"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-sidebar-active/20 px-6">
          <img 
            src="/Logo/Logotipo em Fundo Transparente.png" 
            alt="Prontivus" 
            className="h-12 w-auto"
          />
        </div>
        
        {/* Clinic Switcher */}
        <div className="px-3 py-2 border-b border-sidebar-active/20">
          <ClinicSwitcher />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === "/app/dashboard"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-active/10 text-sidebar-active border-l-4 border-sidebar-active"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground border-l-4 border-transparent"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-active/20 p-4">
          <div 
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-red-500/10 cursor-pointer transition-colors group"
            title="Clique para sair"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-active text-white text-sm font-semibold">
              {getUserInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground" title={user?.name}>
                {user?.name || "Usuário"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate" title={user?.email}>
                {user?.email || ""}
              </p>
              <p className="text-[10px] font-semibold text-sidebar-active/80 uppercase tracking-wide mt-0.5" title={`Função: ${user?.role}`}>
                {user?.role || "Função"}
              </p>
            </div>
            <LogOut className="h-4 w-4 text-sidebar-foreground/60 group-hover:text-red-500 transition-colors" />
          </div>
        </div>
      </div>
    </>
  );
}
