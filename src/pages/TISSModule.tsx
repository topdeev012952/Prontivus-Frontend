import { useState, useEffect } from "react";
import { Shield, Plus, RefreshCw, Loader2, CheckCircle2, XCircle, Clock, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api";

interface TISSProvider {
  id: string;
  name: string;
  code: string;
  cnpj: string;
  endpoint_url: string;
  environment: string;
  username: string;
  status: string;
  created_at: string;
}

interface TISSJob {
  id: string;
  provider_id: string;
  job_type: string;
  status: string;
  invoice_id?: string;
  procedure_code?: string;
  created_at: string;
  processed_at?: string;
  error_message?: string;
}

interface TISSStats {
  total_providers: number;
  active_providers: number;
  total_jobs: number;
  jobs_today: number;
  pending_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  jobs_this_week: number;
  success_rate: number;
}

export default function TISSModule() {
  const [providers, setProviders] = useState<TISSProvider[]>([]);
  const [jobs, setJobs] = useState<TISSJob[]>([]);
  const [stats, setStats] = useState<TISSStats>({
    total_providers: 0,
    active_providers: 0,
    total_jobs: 0,
    jobs_today: 0,
    pending_jobs: 0,
    completed_jobs: 0,
    failed_jobs: 0,
    jobs_this_week: 0,
    success_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    cnpj: "",
    endpoint_url: "",
    environment: "production",
    username: "",
    password: "",
    timeout_seconds: 30,
    max_retries: 3,
    notes: "",
  });

  useEffect(() => {
    loadProviders();
    loadJobs();
    loadStats();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await apiClient.request<TISSProvider[]>("/tiss/providers");
      setProviders(data);
    } catch (err: any) {
      console.error("Error loading providers:", err);
      setError("Failed to load TISS providers");
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const data = await apiClient.request<TISSJob[]>("/tiss/jobs?limit=50");
      setJobs(data);
    } catch (err) {
      console.error("Error loading jobs:", err);
    }
  };

  const loadStats = async () => {
    try {
      const data = await apiClient.request<TISSStats>("/tiss/stats");
      setStats(data);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await apiClient.request("/tiss/providers", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      setSuccess("TISS provider created successfully!");
      setShowCreateDialog(false);
      resetForm();
      await loadProviders();
      await loadStats();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error creating provider:", err);
      setError(err.message || "Failed to create TISS provider");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (providerId: string) => {
    try {
      setTestingConnection(providerId);
      setError("");

      const result = await apiClient.request(`/tiss/providers/${providerId}/test`, {
        method: "POST",
      });

      if (result.success) {
        setSuccess(`Connection test successful! ${result.message}`);
      } else {
        setError(`Connection test failed: ${result.message}`);
      }
      
      setTimeout(() => {
        setSuccess("");
        setError("");
      }, 5000);
    } catch (err: any) {
      console.error("Error testing connection:", err);
      setError(err.message || "Connection test failed");
      setTimeout(() => setError(""), 5000);
    } finally {
      setTestingConnection(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      cnpj: "",
      endpoint_url: "",
      environment: "production",
      username: "",
      password: "",
      timeout_seconds: 30,
      max_retries: 3,
      notes: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", label: "Active" },
      inactive: { color: "bg-gray-100 text-gray-800", label: "Inactive" },
      testing: { color: "bg-yellow-100 text-yellow-800", label: "Testing" },
      error: { color: "bg-red-100 text-red-800", label: "Error" },
    };
    
    const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || statusConfig.inactive;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getJobStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">TISS Module</h1>
          <p className="text-muted-foreground">
            Manage health plan integrations and SADT submissions
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          New Provider
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

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provedores TISS</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_providers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_providers} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs TISS</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_jobs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.jobs_today} hoje • {stats.jobs_this_week} esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending_jobs}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando processamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.success_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.completed_jobs} concluídos • {stats.failed_jobs} falhas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="providers" className="w-full">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="jobs">TISS Jobs</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          {providers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider) => (
                <Card key={provider.id} className="shadow-card">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Code: {provider.code}
                        </p>
                      </div>
                      {getStatusBadge(provider.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-1">
                      <p><strong>CNPJ:</strong> {provider.cnpj}</p>
                      <p><strong>Environment:</strong> {provider.environment}</p>
                      <p className="truncate">
                        <strong>Endpoint:</strong> {provider.endpoint_url}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => handleTestConnection(provider.id)}
                        disabled={testingConnection === provider.id}
                      >
                        {testingConnection === provider.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Server className="h-4 w-4" />
                            Test
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                      >
                        Edit
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
                <h3 className="text-lg font-semibold mb-2">No TISS providers configured</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first health plan integration
                </p>
                <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Add Provider
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>TISS Job Queue</CardTitle>
                <Button variant="outline" size="sm" className="gap-2" onClick={loadJobs}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {jobs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Procedure</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getJobStatusIcon(job.status)}
                            <span className="text-sm">{job.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{job.job_type}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {job.invoice_id?.slice(0, 8) || "-"}
                        </TableCell>
                        <TableCell>{job.procedure_code || "-"}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(job.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {job.status === "failed" && (
                            <Button variant="ghost" size="sm">
                              Retry
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No TISS jobs found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>TISS Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                Log viewing coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Provider Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add TISS Provider</DialogTitle>
            <DialogDescription>
              Configure a new health plan integration (convênio)
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProvider}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Provider Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Unimed SP"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">Provider Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g., UNIMED001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endpoint_url">API Endpoint URL *</Label>
                <Input
                  id="endpoint_url"
                  placeholder="https://api.healthplan.com/tiss"
                  value={formData.endpoint_url}
                  onChange={(e) => setFormData({ ...formData, endpoint_url: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="environment">Environment *</Label>
                  <Select
                    value={formData.environment}
                    onValueChange={(value) => setFormData({ ...formData, environment: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="homologation">Homologation</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeout">Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={formData.timeout_seconds}
                    onChange={(e) => setFormData({ ...formData, timeout_seconds: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  placeholder="API username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="API password (will be encrypted)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  🔒 Password will be encrypted with AES-256
                </p>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this provider..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
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
                    Creating...
                  </>
                ) : (
                  "Create Provider"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

