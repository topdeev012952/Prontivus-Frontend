import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Trash2, Edit, RefreshCw, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TISSOperator {
  id: string;
  name: string;
  registration_number: string;
  api_url: string;
  settings?: {
    supports_sadt?: boolean;
    supports_consultation?: boolean;
    timeout?: number;
  };
  created_at: string;
}

export function TISSOperatorManagement() {
  const { toast } = useToast();
  const [operators, setOperators] = useState<TISSOperator[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOperator, setEditingOperator] = useState<TISSOperator | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    registration_number: "",
    api_url: "",
    api_key: "",
    api_secret: "",
    supports_sadt: true,
    supports_consultation: true,
    timeout: 30
  });

  useEffect(() => {
    loadOperators();
  }, []);

  const loadOperators = async () => {
    setLoading(true);
    try {
      const baseUrl = (import.meta as any).env?.VITE_API_URL || 'https://prontivus-backend-wnw2.onrender.com/api/v1';
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${baseUrl}/tiss/operators`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOperators(data.operators || []);
      }
    } catch (error) {
      console.error('Failed to load operators:', error);
      toast({
        title: "Error",
        description: "Failed to load TISS operators",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddOperator = async () => {
    if (!formData.name || !formData.registration_number || !formData.api_url) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const baseUrl = (import.meta as any).env?.VITE_API_URL || 'https://prontivus-backend-wnw2.onrender.com/api/v1';
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${baseUrl}/tiss/operators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          name: formData.name,
          registration_number: formData.registration_number,
          api_url: formData.api_url,
          api_key: formData.api_key,
          api_secret: formData.api_secret,
          settings: {
            supports_sadt: formData.supports_sadt,
            supports_consultation: formData.supports_consultation,
            timeout: formData.timeout
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to add operator");
      }

      toast({
        title: "Success",
        description: "TISS operator added successfully",
      });

      // Reset form
      setFormData({
        name: "",
        registration_number: "",
        api_url: "",
        api_key: "",
        api_secret: "",
        supports_sadt: true,
        supports_consultation: true,
        timeout: 30
      });
      setShowAddModal(false);
      loadOperators();
    } catch (error: any) {
      console.error('Failed to add operator:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add TISS operator",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (operatorId: string) => {
    setLoading(true);
    try {
      const baseUrl = (import.meta as any).env?.VITE_API_URL || 'https://prontivus-backend-wnw2.onrender.com/api/v1';
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${baseUrl}/tiss/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          provider_id: operatorId
        })
      });

      if (!response.ok) {
        throw new Error("Connection test failed");
      }

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Connection Successful",
          description: "TISS operator connection is working",
        });
      } else {
        throw new Error(data.error || "Connection test failed");
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to TISS operator",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOperator = async (operatorId: string) => {
    if (!confirm("Are you sure you want to delete this operator?")) {
      return;
    }

    setLoading(true);
    try {
      const baseUrl = (import.meta as any).env?.VITE_API_URL || 'https://prontivus-backend-wnw2.onrender.com/api/v1';
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${baseUrl}/tiss/operators/${operatorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete operator");
      }

      toast({
        title: "Success",
        description: "TISS operator deleted",
      });

      loadOperators();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete operator",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">TISS Operators</h2>
          <p className="text-muted-foreground">
            Manage insurance operators for TISS integration
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Operator
        </Button>
      </div>

      {operators.length === 0 && !loading ? (
        <Alert>
          <AlertDescription>
            No TISS operators configured yet. Add an operator to start sending SADT requests and consultations to insurance companies.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {operators.map((operator) => (
            <Card key={operator.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {operator.name}
                </CardTitle>
                <CardDescription>
                  Reg: {operator.registration_number}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">API URL</p>
                  <p className="text-xs font-mono break-all">{operator.api_url}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {operator.settings?.supports_sadt && (
                    <Badge variant="secondary">SADT</Badge>
                  )}
                  {operator.settings?.supports_consultation && (
                    <Badge variant="secondary">Consultation</Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection(operator.id)}
                    disabled={loading}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteOperator(operator.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading && operators.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Add Operator Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add TISS Operator</DialogTitle>
            <DialogDescription>
              Configure a new insurance operator for TISS integration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Popular Operators:</strong> Unimed, Bradesco Saúde, SulAmérica, Amil, Golden Cross, etc.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Operator Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Unimed São Paulo"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reg">Registration Number *</Label>
                <Input
                  id="reg"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
                  placeholder="ANS registration number"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="api_url">API URL *</Label>
                <Input
                  id="api_url"
                  value={formData.api_url}
                  onChange={(e) => setFormData({...formData, api_url: e.target.value})}
                  placeholder="https://api.operator.com.br/tiss"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="api_key">API Key</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                    placeholder="API key from operator"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="api_secret">API Secret</Label>
                  <Input
                    id="api_secret"
                    type="password"
                    value={formData.api_secret}
                    onChange={(e) => setFormData({...formData, api_secret: e.target.value})}
                    placeholder="API secret from operator"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Supported Services</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.supports_sadt}
                      onChange={(e) => setFormData({...formData, supports_sadt: e.target.checked})}
                    />
                    <span className="text-sm">SADT (Exams)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.supports_consultation}
                      onChange={(e) => setFormData({...formData, supports_consultation: e.target.checked})}
                    />
                    <span className="text-sm">Consultations</span>
                  </label>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="timeout">Connection Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => setFormData({...formData, timeout: parseInt(e.target.value)})}
                  min="10"
                  max="120"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddOperator} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Operator"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

