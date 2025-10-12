import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, CheckCircle, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PaymentSettings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    pix_provider: "mercado_pago",
    pix_api_key: "",
    pix_api_secret: "",
    boleto_provider: "banco_brasil",
    boleto_api_key: "",
    paypal_client_id: "",
    paypal_secret: "",
    paypal_mode: "sandbox"
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real app, this would call an API to save settings
      // For now, we'll just save to localStorage
      localStorage.setItem('payment_settings', JSON.stringify(settings));
      
      toast({
        title: "Settings Saved",
        description: "Payment provider settings have been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Payment Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure payment providers for PIX, Boleto, and PayPal
        </p>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Important:</strong> These settings should be configured in your <code>.env</code> file for production use.
          This UI is for testing and configuration purposes.
        </AlertDescription>
      </Alert>

      {/* PIX Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            PIX Configuration
          </CardTitle>
          <CardDescription>
            Configure PIX payment provider (Mercado Pago or PagSeguro)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="pix_provider">PIX Provider</Label>
            <Select
              value={settings.pix_provider}
              onValueChange={(value) => setSettings({...settings, pix_provider: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mercado_pago">Mercado Pago</SelectItem>
                <SelectItem value="pagseguro">PagSeguro</SelectItem>
                <SelectItem value="generic">Generic (Testing)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pix_key">PIX API Key</Label>
            <Input
              id="pix_key"
              type="password"
              value={settings.pix_api_key}
              onChange={(e) => setSettings({...settings, pix_api_key: e.target.value})}
              placeholder="APP-XXXXXXXXXXXX or your access token"
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from {settings.pix_provider === "mercado_pago" ? "Mercado Pago" : "PagSeguro"} developer dashboard
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pix_secret">PIX API Secret (Optional)</Label>
            <Input
              id="pix_secret"
              type="password"
              value={settings.pix_api_secret}
              onChange={(e) => setSettings({...settings, pix_api_secret: e.target.value})}
              placeholder="Secret key if required"
            />
          </div>
        </CardContent>
      </Card>

      {/* Boleto Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Boleto Configuration</CardTitle>
          <CardDescription>
            Configure Boleto (bank slip) payment provider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="boleto_provider">Boleto Provider</Label>
            <Select
              value={settings.boleto_provider}
              onValueChange={(value) => setSettings({...settings, boleto_provider: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="banco_brasil">Banco do Brasil</SelectItem>
                <SelectItem value="bradesco">Bradesco</SelectItem>
                <SelectItem value="itau">Itaú</SelectItem>
                <SelectItem value="generic">Generic (Testing)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="boleto_key">Boleto API Key</Label>
            <Input
              id="boleto_key"
              type="password"
              value={settings.boleto_api_key}
              onChange={(e) => setSettings({...settings, boleto_api_key: e.target.value})}
              placeholder="API key from your bank"
            />
          </div>
        </CardContent>
      </Card>

      {/* PayPal Settings */}
      <Card>
        <CardHeader>
          <CardTitle>PayPal Configuration</CardTitle>
          <CardDescription>
            Configure PayPal payment integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="paypal_mode">PayPal Mode</Label>
            <Select
              value={settings.paypal_mode}
              onValueChange={(value) => setSettings({...settings, paypal_mode: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                <SelectItem value="live">Live (Production)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="paypal_client">PayPal Client ID</Label>
            <Input
              id="paypal_client"
              type="password"
              value={settings.paypal_client_id}
              onChange={(e) => setSettings({...settings, paypal_client_id: e.target.value})}
              placeholder="Client ID from PayPal developer dashboard"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="paypal_secret">PayPal Secret</Label>
            <Input
              id="paypal_secret"
              type="password"
              value={settings.paypal_secret}
              onChange={(e) => setSettings({...settings, paypal_secret: e.target.value})}
              placeholder="Secret key from PayPal"
            />
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Production Configuration</CardTitle>
          <CardDescription>
            For production, add these to your backend <code>.env</code> file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`# PIX Configuration
PIX_PROVIDER=${settings.pix_provider}
PIX_API_KEY=your_api_key_here
PIX_API_SECRET=your_secret_here

# Boleto Configuration  
BOLETO_PROVIDER=${settings.boleto_provider}
BOLETO_API_KEY=your_api_key_here

# PayPal Configuration
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_SECRET=your_secret_here
PAYPAL_MODE=${settings.paypal_mode}
`}
          </pre>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
          {saving ? (
            <>
              <Settings className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

