import { Search, User, LogOut, Settings, Shield, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/Notifications/NotificationBell";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { OfflineSyncIndicator } from "@/components/OfflineSyncIndicator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/app/settings");
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
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patients, appointments..."
              className="pl-9 bg-muted/50"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <OfflineSyncIndicator />
          <OfflineIndicator />
          <ThemeToggle />
          <NotificationBell />
          
          {/* Auth Status Indicator */}
          <div className="flex items-center gap-1">
            {isAuthenticated ? (
              <Shield className="h-4 w-4 text-green-500" title="Autenticado" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" title="Não autenticado" />
            )}
          </div>
          
          {/* User Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || ""}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {user?.role || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Profile & Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
