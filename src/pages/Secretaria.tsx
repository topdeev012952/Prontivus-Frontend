import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

interface PatientForm {
  id?: string;
  name: string;
  cpf: string;
  birth_date?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  insurance_provider?: string;
  payment_type?: "particular" | "convenio";
  notes?: string;
}

const cpfIsValid = (cpf: string) => {
  const digits = (cpf || "").replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  const calc = (base: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) sum += parseInt(base[i], 10) * (factor - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  const d1 = calc(digits.slice(0, 9), 10);
  const d2 = calc(digits.slice(0, 10), 11);
  return d1 === parseInt(digits[9], 10) && d2 === parseInt(digits[10], 10);
};

export default function Secretaria() {
  const { toast } = useToast();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<PatientForm>({ name: "", cpf: "", payment_type: "particular" });
  const [saving, setSaving] = useState(false);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const resp = await apiClient.request<any>(`/patients?page=1&size=50`);
      setPatients(resp?.items || Array.isArray(resp) ? resp.items ?? resp : []);
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao carregar pacientes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.cpf) {
      toast({ title: "Campos obrigatórios", description: "Nome e CPF são obrigatórios.", variant: "destructive" });
      return;
    }
    if (!cpfIsValid(form.cpf)) {
      toast({ title: "CPF inválido", description: "Informe um CPF válido.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const body = { ...form };
      if (form.id) {
        await apiClient.request(`/patients/${form.id}`, { method: "PATCH", body: JSON.stringify(body) });
        toast({ title: "Atualizado", description: "Paciente atualizado com sucesso." });
      } else {
        await apiClient.request(`/patients`, { method: "POST", body: JSON.stringify(body) });
        toast({ title: "Cadastrado", description: "Paciente criado com sucesso." });
      }
      setForm({ name: "", cpf: "", payment_type: "particular" });
      await loadPatients();
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao salvar paciente", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p: any) => {
    setForm({
      id: p.id,
      name: p.name || "",
      cpf: p.cpf || "",
      birth_date: p.birth_date || "",
      gender: p.gender || "",
      phone: p.phone || "",
      email: p.email || "",
      address: p.address || "",
      insurance_provider: p.insurance_provider || "",
      payment_type: p.payment_type || "particular",
      notes: p.notes || "",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.request(`/patients/${id}`, { method: "DELETE" });
      toast({ title: "Excluído", description: "Paciente excluído." });
      await loadPatients();
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao excluir paciente", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Secretaria</h1>
        <p className="text-muted-foreground mt-1">Cadastro de Pacientes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo/Editar Paciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome completo *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>CPF *</Label>
              <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
            </div>
            <div>
              <Label>Data de nascimento</Label>
              <Input type="date" value={form.birth_date || ""} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
            </div>
            <div>
              <Label>Gênero</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Endereço</Label>
              <Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label>Convênio</Label>
              <Input value={form.insurance_provider || ""} onChange={(e) => setForm({ ...form, insurance_provider: e.target.value })} placeholder="Unimed, Bradesco..." />
            </div>
            <div>
              <Label>Pagamento</Label>
              <Select value={form.payment_type} onValueChange={(v: any) => setForm({ ...form, payment_type: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="particular">Particular</SelectItem>
                  <SelectItem value="convenio">Convênio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Observações médicas</Label>
              <Input value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>{form.id ? "Salvar alterações" : "Salvar"}</Button>
            {form.id && (
              <Button variant="outline" onClick={() => setForm({ name: "", cpf: "", payment_type: "particular" })}>Cancelar</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Convênio</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.cpf}</TableCell>
                  <TableCell>{p.insurance_provider || "—"}</TableCell>
                  <TableCell>{p.payment_type || "particular"}</TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(p)}>Editar</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>Excluir</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


