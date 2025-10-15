import { NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CalendarCheck,
  FileText, 
  Receipt, 
  Settings,
  LogOut,
  Menu,
  Pill,
  Shield,
  Building2,
  Stethoscope,
  DollarSign,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ClinicSwitcher } from "@/components/ClinicSwitcher";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  isNew?: boolean;
}

const navigationSections: NavigationSection[] = [
  {
    title: "Principal",
    items: [
      { name: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Atendimento Clínico",
    items: [
      { name: "Atendimento Médico", href: "/app/atendimento", icon: Stethoscope },
      { name: "Pacientes", href: "/app/patients", icon: Users },
      { name: "Prontuários", href: "/app/records", icon: FileText },
      { name: "Prescrições", href: "/app/prescriptions", icon: Pill },
    ],
  },
  {
    title: "Secretaria",
    items: [
      { name: "Agendamentos", href: "/app/appointments", icon: Calendar },
      { name: "Solicitações", href: "/app/appointment-requests", icon: CalendarCheck },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { name: "Faturamento", href: "/app/billing", icon: DollarSign },
      { name: "Faturas", href: "/app/invoices", icon: Receipt },
      { name: "Planos de Saúde", href: "/app/health-plans", icon: Building2 },
      { name: "Módulo TISS", href: "/app/tiss", icon: Shield },
    ],
  },
  {
    title: "Sistema",
    items: [
      { name: "Dashboard BI", href: "/app/bi-dashboard", icon: BarChart3 },
      { name: "Configurações", href: "/app/settings", icon: Settings },
    ],
  },
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
        <div className="flex h-32 items-center justify-center border-b border-sidebar-active/20 px-6">
          <img 
            src="/Logo/Prontivus Horizontal Transparents.png" 
            alt="Prontivus" 
            className="h-30 w-auto"
          />
        </div>
        
        {/* Clinic Switcher */}
        <div className="px-3 py-2 border-b border-sidebar-active/20">
          <ClinicSwitcher />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 px-3 py-4 overflow-y-auto">
          {navigationSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {/* Section Header */}
              <h3 className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                {section.title}
              </h3>
              
              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === "/app/dashboard"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all group relative",
                        isActive
                          ? "bg-sidebar-active/10 text-sidebar-active border-l-4 border-sidebar-active"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground border-l-4 border-transparent"
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    
                    {/* "New" Badge */}
                    {item.isNew && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-green-500 text-white rounded-full">
                        Novo
                      </span>
                    )}
                    
                    {/* Optional Badge */}
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-sidebar-active/20 text-sidebar-active rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
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
