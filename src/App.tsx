import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { initIndexedDB } from "@/lib/indexedDB";
import { useClinicStore } from "@/stores/clinicStore";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PERMISSIONS } from "@/lib/permissions";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Appointments from "./pages/Appointments";
import AppointmentRequests from "./pages/AppointmentRequests";
import MedicalRecordsAdvanced from "./pages/MedicalRecordsAdvanced";
import Invoices from "./pages/Invoices";
import Settings from "./pages/Settings";
import DigitalPrescriptions from "./pages/DigitalPrescriptions";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import TISSModule from "./pages/TISSModule";
import HealthPlanIntegration from "./pages/HealthPlanIntegration";
import TelemedicineRoom from "./pages/TelemedicineRoom";
import NotFound from "./pages/NotFound";
import WaitingRoom from "./pages/WaitingRoom";
import BIDashboard from "./pages/BIDashboard";
import ConsultationDetail from "./pages/ConsultationDetail";
import ConsultationImproved from "./pages/ConsultationImproved";
import AtendimentoMedico from "./pages/AtendimentoMedico";
import Billing from "./pages/Billing";
import Secretaria from "./pages/Secretaria";
import PatientCallSystem from "./components/PatientCallSystem";
import WaitingRoomMonitor from "./components/WaitingRoomMonitor";
import AdminTeamManager from "./pages/AdminTeamManager";
import ProntuarioMedico from "./pages/ProntuarioMedico";
import { RoleDemo } from "./components/RoleDemo";

const queryClient = new QueryClient();

function AppContent() {
  useEffect(() => {
    initIndexedDB();
    // Clinics will be fetched automatically after authentication
  }, []);

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected App Routes */}
        <Route path="/app" element={<Index />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Patient Management */}
          <Route path="patients" element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.PATIENTS_READ]}>
              <Patients />
            </ProtectedRoute>
          } />
          
          {/* Appointment Management */}
          <Route path="appointments" element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.APPOINTMENTS_READ]}>
              <Appointments />
            </ProtectedRoute>
          } />
          <Route path="appointment-requests" element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.APPOINTMENTS_READ]}>
              <AppointmentRequests />
            </ProtectedRoute>
          } />
          
          {/* Medical Records */}
          <Route path="records" element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.MEDICAL_RECORDS_READ]}>
              <MedicalRecordsAdvanced />
            </ProtectedRoute>
          } />
          
          {/* Prescriptions */}
          <Route path="prescriptions" element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.PRESCRIPTIONS_READ]}>
              <DigitalPrescriptions />
            </ProtectedRoute>
          } />
          
          {/* Billing & Financial */}
          <Route path="invoices" element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.INVOICES_READ]}>
              <Invoices />
            </ProtectedRoute>
          } />
          <Route path="billing" element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.BILLING_READ]}>
              <Billing />
            </ProtectedRoute>
          } />
          <Route path="tiss" element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.BILLING_READ]}>
              <TISSModule />
            </ProtectedRoute>
          } />
          <Route path="health-plans" element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.BILLING_READ]}>
              <HealthPlanIntegration />
            </ProtectedRoute>
          } />
          
          {/* Reception */}
          <Route path="secretaria" element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.APPOINTMENTS_READ]}>
              <Secretaria />
            </ProtectedRoute>
          } />
          <Route path="patient-call" element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.APPOINTMENTS_READ]}>
              <PatientCallSystem />
            </ProtectedRoute>
          } />
          <Route path="waiting-room-monitor" element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.APPOINTMENTS_READ]}>
              <WaitingRoomMonitor />
            </ProtectedRoute>
          } />
          
          {/* Consultation Management */}
          <Route path="consultations" element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.CONSULTATIONS_READ]}>
              <ConsultationImproved />
            </ProtectedRoute>
          } />
          <Route path="consultations/:id" element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.CONSULTATIONS_READ]}>
              <ConsultationDetail />
            </ProtectedRoute>
          } />
          <Route path="atendimento" element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.CONSULTATIONS_CREATE, PERMISSIONS.CONSULTATIONS_READ]}>
              <AtendimentoMedico />
            </ProtectedRoute>
          } />
          
          {/* Waiting Room */}
          <Route path="waiting-room" element={<WaitingRoom />} />
          <Route path="waiting-queue" element={<WaitingRoom />} />
          
          {/* Telemedicine */}
          <Route path="telemed/:sessionId" element={<TelemedicineRoom />} />
          
          {/* Reports & BI */}
          <Route path="bi-dashboard" element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.REPORTS_READ]}>
              <BIDashboard />
            </ProtectedRoute>
          } />
          
          {/* Medical Records - Patient View */}
          <Route path="prontuario/:patientId" element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.MEDICAL_RECORDS_READ]}>
              <ProntuarioMedico />
            </ProtectedRoute>
          } />
          
          {/* System Administration */}
          <Route path="team-management" element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.TEAM_MANAGEMENT_READ]}>
              <AdminTeamManager />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute requiredPermissions={[PERMISSIONS.SYSTEM_ADMIN]}>
              <Settings />
            </ProtectedRoute>
          } />
          
          {/* RBAC Demo - Available to all authenticated users */}
          <Route path="rbac-demo" element={<RoleDemo />} />
        </Route>
        
        {/* Backward compatibility - redirect old routes */}
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/patients" element={<Navigate to="/app/patients" replace />} />
        <Route path="/appointments" element={<Navigate to="/app/appointments" replace />} />
        <Route path="/records" element={<Navigate to="/app/records" replace />} />
        <Route path="/invoices" element={<Navigate to="/app/invoices" replace />} />
        <Route path="/waiting-room" element={<Navigate to="/app/waiting-room" replace />} />
        <Route path="/waiting-queue" element={<Navigate to="/app/waiting-queue" replace />} />
        <Route path="/bi-dashboard" element={<Navigate to="/app/bi-dashboard" replace />} />
        <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
        <Route path="/consultations/:id" element={<Navigate to="/app/consultations/:id" replace />} />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
