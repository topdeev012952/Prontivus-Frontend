import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';

export function AuthDebug() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const checkToken = () => {
    const token = localStorage.getItem('access_token');
    console.log('Token in localStorage:', token ? 'Present' : 'Missing');
    console.log('Token value:', token?.substring(0, 50) + '...');
  };
  
  const testApiCall = async () => {
    try {
      const response = await apiClient.request('/users/me');
      console.log('API call successful:', response);
    } catch (error) {
      console.error('API call failed:', error);
    }
  };
  
  const clearAuth = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.reload();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-sm">Debug de Autenticação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Status:</span>
            <Badge variant={isAuthenticated ? "default" : "destructive"}>
              {isLoading ? "Carregando..." : isAuthenticated ? "Autenticado" : "Não autenticado"}
            </Badge>
          </div>
          
          {user && (
            <div className="space-y-1">
              <div className="text-sm">
                <strong>Usuário:</strong> {user.name}
              </div>
              <div className="text-sm">
                <strong>Email:</strong> {user.email}
              </div>
              <div className="text-sm">
                <strong>Role:</strong> {user.role}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <Button onClick={checkToken} variant="outline" size="sm">
            Verificar Token
          </Button>
          <Button onClick={testApiCall} variant="outline" size="sm">
            Testar API Call
          </Button>
          <Button onClick={clearAuth} variant="destructive" size="sm">
            Limpar Auth
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
