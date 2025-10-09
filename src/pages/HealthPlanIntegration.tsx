import { useState, useEffect } from "react";
import { Shield, Plus, Check, X, Key, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiClient } from "@/lib/api";

interface OAuth2Provider {
  id: string;
  name: string;
  base_url: string;
  client_id: string;
  is_active: boolean;
  last_token_refresh?: string;
  token_expires_at?: string;
  status: "connected" | "disconnected" | "error";
}

export default function HealthPlanIntegration() {
  const [providers, setProviders] = useState<OAuth2Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    base_url: "",
    client_id: "",
    client_secret: "",
    scope: "",
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      // Using TISS providers as OAuth2 providers for now
      const data = await apiClient.request<any[]>("/tiss/providers");
      setProviders(data.map(p => ({
        id: p.id,
        name: p.name,
        base_url: p.endpoint_url,
        client_id: p.username,
        is_active: p.status === "active",
        status: p.status === "active" ? "connected" : "disconnected",
      })));
    } catch (err: any) {
      console.error("Error loading providers:", err);
      setError("Failed to load health plan integrations");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError("");

      // In production: POST to dedicated OAuth2 endpoint
      // For now: use TISS endpoint
      await apiClient.request("/tiss/providers", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          code: formData.name.toUpperCase().replace(/\s/g, "_"),
          cnpj: "00.000.000/0000-00",
          endpoint_url: formData.base_url,
          environment: "production",
          username: formData.client_id,
          password: formData.client_secret,
          timeout_seconds: 30,
          max_retries: 3,
        }),
      });

      setSuccess("Health plan integration created successfully!");
      setShowCreateDialog(false);
      resetForm();
      await loadProviders();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to create integration");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      base_url: "",
      client_id: "",
      client_secret: "",
      scope: "",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      setError("");
      await apiClient.request(`/tiss/providers/${id}`, { method: 'DELETE' });
      await loadProviders();
    } catch (err: any) {
      setError(err.message || 'Failed to delete integration');
    }
  };

  const handleEdit = (p: OAuth2Provider) => {
    setEditingId(p.id);
    setShowCreateDialog(true);
    setFormData({
      name: p.name,
      base_url: p.base_url,
      client_id: p.client_id,
      client_secret: "", // keep empty unless changing
      scope: "",
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return handleCreateProvider(e);

    try {
      setSaving(true);
      setError("");

      await apiClient.request(`/tiss/providers/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: formData.name,
          code: formData.name.toUpperCase().replace(/\s/g, "_"),
          cnpj: "00.000.000/0000-00",
          endpoint_url: formData.base_url,
          environment: "production",
          username: formData.client_id,
          password: formData.client_secret || undefined,
          timeout_seconds: 30,
          max_retries: 3,
        })
      });

      setSuccess('Integration updated!');
      setShowCreateDialog(false);
      setEditingId(null);
      resetForm();
      await loadProviders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update integration');
    } finally {
      setSaving(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800";
      case "disconnected":
        return "bg-gray-100 text-gray-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Health Plan Integrations</h1>
          <p className="text-muted-foreground">
            Manage OAuth2 connections with health plan APIs
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          New Integration
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {providers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {providers.map((provider) => (
            <Card key={provider.id} className="shadow-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {provider.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      OAuth2 Integration
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(provider.status)}>
                    {provider.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{provider.base_url}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs">{provider.client_id}</span>
                  </div>
                  {provider.token_expires_at && (
                    <div className="text-xs text-muted-foreground">
                      Token expires: {new Date(provider.token_expires_at).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Switch checked={provider.is_active} />
                    <span className="text-sm">{provider.is_active ? "Active" : "Inactive"}</span>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto" onClick={() => handleEdit(provider)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(provider.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No integrations configured</h3>
            <p className="text-muted-foreground mb-4">
              Connect your first health plan API
            </p>
            <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4" />
              Add Integration
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Health Plan Integration</DialogTitle>
            <DialogDescription>
              Configure OAuth2 credentials for health plan API access
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={editingId ? handleSave : handleCreateProvider}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="integration_name">Provider Name *</Label>
                <Input
                  id="integration_name"
                  placeholder="e.g., Unimed, Bradesco Saúde"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="base_url">Base API URL *</Label>
                <Input
                  id="base_url"
                  placeholder="https://api.healthplan.com"
                  value={formData.base_url}
                  onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="client_id">Client ID *</Label>
                <Input
                  id="client_id"
                  placeholder="OAuth2 Client ID"
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="client_secret">Client Secret *</Label>
                <Input
                  id="client_secret"
                  type="password"
                  placeholder="OAuth2 Client Secret (encrypted)"
                  value={formData.client_secret}
                  onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  🔒 Will be encrypted and securely stored
                </p>
              </div>

              <div>
                <Label htmlFor="scope">OAuth2 Scope (optional)</Label>
                <Input
                  id="scope"
                  placeholder="e.g., read:patients write:appointments"
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Integration"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

