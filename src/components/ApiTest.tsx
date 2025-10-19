import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/api';

export function ApiTest() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const testEndpoint = async (name: string, endpoint: string) => {
    setLoading(prev => ({ ...prev, [name]: true }));
    try {
      const result = await apiClient.request(endpoint);
      setResults(prev => ({ ...prev, [name]: { success: true, data: result } }));
    } catch (error: any) {
      setResults(prev => ({ ...prev, [name]: { success: false, error: error.message } }));
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  const endpoints = [
    { name: 'Users Me', endpoint: '/users/me' },
    { name: 'Consultation Queue', endpoint: '/consultation_management/queue' },
    { name: 'Patients List', endpoint: '/patients/list?page=1&size=5' },
    { name: 'Medical Records', endpoint: '/medical_records/list?page=1&size=5' },
  ];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-sm">Teste de API</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {endpoints.map(({ name, endpoint }) => (
            <div key={name} className="space-y-2">
              <Button
                onClick={() => testEndpoint(name, endpoint)}
                disabled={loading[name]}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {loading[name] ? 'Testando...' : `Testar ${name}`}
              </Button>
              
              {results[name] && (
                <div className="text-xs p-2 rounded border">
                  <div className={`font-semibold ${results[name].success ? 'text-green-600' : 'text-red-600'}`}>
                    {results[name].success ? '✅ Sucesso' : '❌ Erro'}
                  </div>
                  <div className="mt-1 break-all">
                    {results[name].success 
                      ? JSON.stringify(results[name].data).substring(0, 100) + '...'
                      : results[name].error
                    }
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
