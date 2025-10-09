import { useState, useEffect } from "react";
import { DollarSign, Receipt, TrendingUp, AlertCircle, Shield, Loader2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { StatsCard } from "@/components/Dashboard/StatsCard";

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      
      const [statsData, invoicesData] = await Promise.all([
        apiClient.request<any>("/dashboard/stats"),
        apiClient.request<any>("/invoices?page=1&size=50").catch(() => ({ items: [] })),
      ]);

      setStats(statsData);
      setInvoices(invoicesData.items || []);
    } catch (err) {
      console.error("Error loading finance dashboard:", err);
      setError("Failed to load financial data");
    } finally {
      setLoading(false);
    }
  };

  const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const overdueInvoices = invoices.filter(inv => 
    inv.status === 'pending' && new Date(inv.due_date) < new Date()
  );

  const totalPending = pendingInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Finance Dashboard</h1>
        <p className="text-muted-foreground">Financial overview and billing management</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Financial Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Monthly Revenue"
          value={`R$ ${((stats?.monthly_revenue || 0) / 1000).toFixed(1)}K`}
          change={stats?.revenue_change || "+0%"}
          icon={DollarSign}
          trend={stats?.revenue_change?.startsWith('+') ? 'up' : 'down'}
        />
        <StatsCard
          title="Paid This Month"
          value={`R$ ${(totalPaid / 1000).toFixed(1)}K`}
          change={`${paidInvoices.length} invoices`}
          icon={TrendingUp}
          trend="up"
        />
        <StatsCard
          title="Pending"
          value={`R$ ${(totalPending / 1000).toFixed(1)}K`}
          change={`${pendingInvoices.length} invoices`}
          icon={Receipt}
        />
        <StatsCard
          title="Overdue"
          value={overdueInvoices.length.toString()}
          change="Requires action"
          icon={AlertCircle}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Invoices</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate("/app/invoices")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {invoices.length > 0 ? (
              <div className="space-y-2">
                {invoices.slice(0, 6).map((invoice) => (
                  <div 
                    key={invoice.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate("/app/invoices")}
                  >
                    <div>
                      <p className="font-medium">R$ {Number(invoice.amount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(invoice.due_date || invoice.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge variant={
                      invoice.status === 'paid' ? "default" : 
                      invoice.status === 'overdue' ? "destructive" : 
                      "outline"
                    }>
                      {invoice.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                No invoices found
              </p>
            )}
          </CardContent>
        </Card>

        {/* TISS Submissions */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                TISS Status
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate("/app/tiss")}>
                Manage
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tissStatus.length > 0 ? (
              <div className="space-y-2">
                {tissStatus.slice(0, 6).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="text-sm font-medium">{job.job_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge variant={
                      job.status === 'success' ? "default" : 
                      job.status === 'failed' ? "destructive" : 
                      "outline"
                    }>
                      {job.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                No TISS submissions
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alerts */}
      {overdueInvoices.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{overdueInvoices.length} overdue invoice(s)</strong> - 
            Total: R$ {(calculateTotal(overdueInvoices)).toFixed(2)}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Button className="h-20 flex flex-col gap-2" onClick={() => navigate("/app/invoices")}>
          <FileText className="h-6 w-6" />
          <span>Create Invoice</span>
        </Button>
        <Button className="h-20 flex flex-col gap-2" variant="outline" onClick={() => navigate("/app/tiss")}>
          <Shield className="h-6 w-6" />
          <span>Submit to TISS</span>
        </Button>
        <Button className="h-20 flex flex-col gap-2" variant="outline" onClick={() => navigate("/app/bi-dashboard")}>
          <TrendingUp className="h-6 w-6" />
          <span>Financial Reports</span>
        </Button>
        <Button className="h-20 flex flex-col gap-2" variant="outline" onClick={() => navigate("/app/invoices")}>
          <AlertCircle className="h-6 w-6" />
          <span>Review Overdue</span>
        </Button>
      </div>
    </div>
  );
}
