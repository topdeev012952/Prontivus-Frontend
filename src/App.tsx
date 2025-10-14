import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { initIndexedDB } from "@/lib/indexedDB";
import { useClinicStore } from "@/stores/clinicStore";
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
import Billing from "./pages/Billing";

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
          <Route path="patients" element={<Patients />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="appointment-requests" element={<AppointmentRequests />} />
            <Route path="records" element={<MedicalRecordsAdvanced />} />
          <Route path="prescriptions" element={<DigitalPrescriptions />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="billing" element={<Billing />} />
          <Route path="tiss" element={<TISSModule />} />
          <Route path="health-plans" element={<HealthPlanIntegration />} />
          <Route path="telemed/:sessionId" element={<TelemedicineRoom />} />
          <Route path="waiting-room" element={<WaitingRoom />} />
          <Route path="bi-dashboard" element={<BIDashboard />} />
          <Route path="consultations" element={<ConsultationImproved />} />
          <Route path="consultations/:id" element={<ConsultationDetail />} />
          <Route path="waiting-queue" element={<WaitingRoom />} />
          <Route path="settings" element={<Settings />} />
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
