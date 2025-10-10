import { useEffect } from "react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Header } from "@/components/Layout/Header";
import { Outlet, useNavigate } from "react-router-dom";
import { useGlobalShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function Index() {
  useGlobalShortcuts();
  const { checkAuth, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication on mount to restore session from localStorage
    const initAuth = async () => {
      await checkAuth();
      
      // If not authenticated after check, redirect to login
      if (!isAuthenticated && !isLoading) {
        navigate('/login', { replace: true });
      }
    };
    
    initAuth();
  }, []);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render protected content
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
