import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { apiClient } from "@/lib/api";

export default function Register() {
  const [formData, setFormData] = useState({
    clinicName: "",
    cnpjCpf: "",
    contactEmail: "",
    contactPhone: "",
    adminName: "",
    adminEmail: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (formData.cnpjCpf.length < 11) {
      setError("CNPJ/CPF must be at least 11 characters long");
      return;
    }

    if (formData.clinicName.length < 2) {
      setError("Clinic name must be at least 2 characters long");
      return;
    }

    if (formData.adminName.length < 2) {
      setError("Admin name must be at least 2 characters long");
      return;
    }

    setIsLoading(true);

    try {
      // Log the data being sent for debugging
      const registrationData = {
        clinic: {
          name: formData.clinicName,
          cnpj_cpf: formData.cnpjCpf,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone,
        },
        user: {
          name: formData.adminName,
          email: formData.adminEmail,
          password: formData.password,
        },
      };
      
      console.log('Sending registration data:', {
        ...registrationData,
        user: { ...registrationData.user, password: '[REDACTED]' }
      });

      // Register clinic and admin user
      await apiClient.request('/auth/register', {
        method: 'POST',
        requiresAuth: false,
        body: JSON.stringify(registrationData),
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error('Registration error details:', err);
      const errorMessage = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-medical">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/Logo/Logotipo em Fundo Transparente.png" 
              alt="Prontivus" 
              className="h-32 w-auto"
            />
          </div>
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>Register your clinic to get started with Prontivus</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Registration successful! Redirecting to login...
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Clinic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Clinic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Clinic Name *</Label>
                  <Input
                    id="clinicName"
                    name="clinicName"
                    placeholder="Medical Center"
                    value={formData.clinicName}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpjCpf">CNPJ/CPF * (min. 11 digits)</Label>
                  <Input
                    id="cnpjCpf"
                    name="cnpjCpf"
                    placeholder="12345678901234"
                    minLength={11}
                    value={formData.cnpjCpf}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email * (must include .com, .org, etc.)</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    placeholder="contact@clinic.com"
                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone *</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Admin User Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Administrator Account</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Full Name *</Label>
                  <Input
                    id="adminName"
                    name="adminName"
                    placeholder="Dr. John Doe"
                    value={formData.adminName}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email * (must include .com, .org, etc.)</Label>
                  <Input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    placeholder="admin@clinic.com"
                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password * (min. 8 characters)</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    minLength={8}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <button 
              type="button"
              onClick={() => navigate("/login")}
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
