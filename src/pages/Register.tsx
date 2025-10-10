import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, CheckCircle, Building2, User } from "lucide-react";
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
    role: "admin",  // Default to admin for first user
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
      setError("As senhas não coincidem");
      return;
    }

    if (formData.password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    if (formData.cnpjCpf.length < 11) {
      setError("CNPJ/CPF deve ter no mínimo 11 caracteres");
      return;
    }

    if (formData.clinicName.length < 2) {
      setError("Nome da clínica deve ter no mínimo 2 caracteres");
      return;
    }

    if (formData.adminName.length < 2) {
      setError("Nome do administrador deve ter no mínimo 2 caracteres");
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
          role: formData.role,  // Include role in registration
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
      const errorMessage = err instanceof Error ? err.message : "Falha no cadastro. Tente novamente.";
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
          <CardTitle className="text-2xl">Crie Sua Conta</CardTitle>
          <CardDescription>Cadastre sua clínica para começar a usar o Prontivus</CardDescription>
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
                Cadastro realizado com sucesso! Redirecionando para o login...
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Clinic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Informações da Clínica</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Nome da Clínica *</Label>
                  <Input
                    id="clinicName"
                    name="clinicName"
                    placeholder="Centro Médico"
                    value={formData.clinicName}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpjCpf">CNPJ/CPF * (mín. 11 dígitos)</Label>
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
                  <Label htmlFor="contactEmail">E-mail de Contato * (deve incluir .com, .org, etc.)</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    placeholder="contato@clinica.com.br"
                    pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Telefone de Contato *</Label>
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
              <div className="flex items-center gap-2 pb-2 border-b">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Conta do Administrador</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Nome Completo *</Label>
                  <Input
                    id="adminName"
                    name="adminName"
                    placeholder="Dr. João Silva"
                    value={formData.adminName}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">E-mail * (deve incluir .com, .org, etc.)</Label>
                  <Input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    placeholder="admin@clinica.com.br"
                    pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha * (mín. 8 caracteres)</Label>
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
                  <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
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

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="role">Função *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="doctor">Médico</SelectItem>
                      <SelectItem value="secretary">Secretário/Recepcionista</SelectItem>
                      <SelectItem value="patient">Paciente</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    O primeiro usuário geralmente é um Administrador
                  </p>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando Conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Já tem uma conta? </span>
            <button 
              type="button"
              onClick={() => navigate("/login")}
              className="text-primary font-medium hover:underline"
            >
              Entrar
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
