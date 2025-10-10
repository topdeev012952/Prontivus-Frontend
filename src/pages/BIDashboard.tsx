import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Calendar, FileText, DollarSign, Loader2, RefreshCw, Download } from 'lucide-react';
import { apiClient } from '@/lib/api';

const COLORS = ['#2563eb', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface AppointmentWeekData {
  week: string;
  appointments: number;
}

interface RevenueMonthData {
  month: string;
  revenue: number;
}

interface DemographicData {
  name: string;
  value: number;
}

interface StatusData {
  name: string;
  value: number;
}

interface DoctorData {
  doctor: string;
  appointments: number;
}

interface MonthlySummary {
  appointments: number;
  new_patients: number;
  revenue: number;
  medical_records: number;
}

export default function BIDashboard() {
  const [appointmentData, setAppointmentData] = useState<AppointmentWeekData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueMonthData[]>([]);
  const [demographicsData, setDemographicsData] = useState<DemographicData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [doctorsData, setDoctorsData] = useState<DoctorData[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAllReports();
  }, []);

  const loadAllReports = async () => {
    try {
      setLoading(true);
      setError("");

      // Load all reports in parallel
      const [appointments, revenue, demographics, status, doctors, summary] = await Promise.all([
        apiClient.request<AppointmentWeekData[]>('/reports/appointments-by-week').catch(() => []),
        apiClient.request<RevenueMonthData[]>('/reports/revenue-by-month').catch(() => []),
        apiClient.request<DemographicData[]>('/reports/patient-demographics').catch(() => []),
        apiClient.request<StatusData[]>('/reports/appointments-by-status').catch(() => []),
        apiClient.request<DoctorData[]>('/reports/top-doctors').catch(() => []),
        apiClient.request<MonthlySummary>('/reports/monthly-summary').catch(() => null),
      ]);

      setAppointmentData(appointments);
      setRevenueData(revenue);
      setDemographicsData(demographics);
      setStatusData(status);
      setDoctorsData(doctors);
      setMonthlySummary(summary);
    } catch (err) {
      console.error("Error loading reports:", err);
      setError("Failed to load BI dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllReports();
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            Analytics and insights for your clinic performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={async () => {
              try {
                const baseUrl = (import.meta as any).env?.VITE_API_URL || 'https://prontivus-backend-wnw2.onrender.com/api/v1';
                const token = localStorage.getItem('access_token');
                const url = `${baseUrl}/reports/export/csv?report_type=appointments`;
                const res = await fetch(url, {
                  method: 'GET',
                  headers: {
                    Authorization: token ? `Bearer ${token}` : '',
                  },
                });
                if (!res.ok) {
                  throw new Error(`Export failed: ${res.status}`);
                }
                const blob = await res.blob();
                const href = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = href;
                a.download = `appointments_report_${new Date().toISOString().slice(0,10)}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(href);
              } catch (e) {
                console.error(e);
                setError('Failed to export CSV.');
              }
            }} 
            variant="outline" 
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="gap-2"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Monthly Summary Cards */}
      {monthlySummary && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Appointments This Month</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{monthlySummary.appointments}</div>
              <p className="text-xs text-muted-foreground">
                Total scheduled
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Patients</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{monthlySummary.new_patients}</div>
              <p className="text-xs text-muted-foreground">
                Registered this month
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(monthlySummary.revenue)}</div>
              <p className="text-xs text-muted-foreground">
                Paid invoices this month
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{monthlySummary.medical_records}</div>
              <p className="text-xs text-muted-foreground">
                Created this month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appointments">Appointments Trend</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="doctors">Top Doctors</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Appointments by Week</CardTitle>
              <CardDescription>
                Appointment trends over the last 12 weeks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appointmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={appointmentData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="week" 
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: '#888' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: '#888' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="appointments" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={{ fill: '#2563eb', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Appointments"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                  <p>No appointment data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Month</CardTitle>
              <CardDescription>
                Monthly revenue from paid invoices over the last 12 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: '#888' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: '#888' }}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar 
                      dataKey="revenue" 
                      fill="#14b8a6" 
                      radius={[8, 8, 0, 0]}
                      name="Revenue"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                  <p>No revenue data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Patient Demographics by Gender</CardTitle>
                <CardDescription>
                  Distribution of patients by gender
                </CardDescription>
              </CardHeader>
              <CardContent>
                {demographicsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={demographicsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {demographicsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <p>No demographics data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appointments by Status</CardTitle>
                <CardDescription>
                  Distribution of appointments by current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <p>No status data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="doctors">
          <Card>
            <CardHeader>
              <CardTitle>Top Doctors by Appointments</CardTitle>
              <CardDescription>
                Doctors with most appointments this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              {doctorsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={doctorsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      dataKey="doctor" 
                      type="category"
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="appointments" 
                      fill="#8b5cf6" 
                      radius={[0, 8, 8, 0]}
                      name="Appointments"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                  <p>No doctor data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Appointment Trends</p>
                <p className="text-sm text-muted-foreground">
                  {appointmentData.length > 0 && appointmentData[appointmentData.length - 1].appointments > 0
                    ? `${appointmentData[appointmentData.length - 1].appointments} appointments this week`
                    : "No recent appointment data"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-medium">Revenue Performance</p>
                <p className="text-sm text-muted-foreground">
                  {monthlySummary && monthlySummary.revenue > 0
                    ? `${formatCurrency(monthlySummary.revenue)} this month`
                    : "No revenue this month"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">Patient Growth</p>
                <p className="text-sm text-muted-foreground">
                  {monthlySummary && monthlySummary.new_patients > 0
                    ? `${monthlySummary.new_patients} new patients this month`
                    : "No new patients this month"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium">Documentation</p>
                <p className="text-sm text-muted-foreground">
                  {monthlySummary && monthlySummary.medical_records > 0
                    ? `${monthlySummary.medical_records} records created this month`
                    : "No records this month"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-500/10 rounded-lg">
                <p className="text-xs text-muted-foreground">Total Gender Categories</p>
                <p className="text-2xl font-bold text-blue-600">{demographicsData.length}</p>
              </div>
              <div className="p-4 bg-purple-500/10 rounded-lg">
                <p className="text-xs text-muted-foreground">Active Doctors</p>
                <p className="text-2xl font-bold text-purple-600">{doctorsData.length}</p>
              </div>
              <div className="p-4 bg-green-500/10 rounded-lg">
                <p className="text-xs text-muted-foreground">Status Categories</p>
                <p className="text-2xl font-bold text-green-600">{statusData.length}</p>
              </div>
              <div className="p-4 bg-amber-500/10 rounded-lg">
                <p className="text-xs text-muted-foreground">Weeks Tracked</p>
                <p className="text-2xl font-bold text-amber-600">{appointmentData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}