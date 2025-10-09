import { useState, useEffect } from "react";
import { User, Building2, Shield, Bell, Save, Loader2, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiClient } from "@/lib/api";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  clinic_id: string;
}

interface ClinicInfo {
  id: string;
  name: string;
  cnpj_cpf: string;
  contact_email: string;
  contact_phone: string;
  logo_url?: string;
  status: string;
  settings?: Record<string, any>;
}

export default function Settings() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Form states
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
  });

  const [clinicData, setClinicData] = useState({
    name: "",
    contact_email: "",
    contact_phone: "",
    logo_url: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    newAppointments: true,
    patientMessages: true,
    paymentUpdates: true,
    systemUpdates: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      // Load current user info
      const user = await apiClient.request<UserInfo>("/users/me");
      setUserInfo(user);
      setProfileData({
        name: user.name,
        phone: user.phone || "",
      });

      // Load clinic info
      const clinic = await apiClient.request<ClinicInfo>(`/clinics/${user.clinic_id}`);
      setClinicInfo(clinic);
      setClinicData({
        name: clinic.name,
        contact_email: clinic.contact_email,
        contact_phone: clinic.contact_phone,
        logo_url: clinic.logo_url || "",
      });
      
      if (clinic.logo_url) {
        setLogoPreview(clinic.logo_url);
      }

      // Load notification settings from clinic settings if available
      if (clinic.settings?.notifications) {
        setNotificationSettings(clinic.settings.notifications);
      }
    } catch (err: any) {
      console.error("Error loading settings:", err);
      setError(err.message || "Failed to load settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userInfo) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await apiClient.request(`/users/${userInfo.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone || null,
        }),
      });

      setSuccess("Profile updated successfully!");
      await loadSettings(); // Reload to get updated data
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClinicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clinicInfo) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await apiClient.request(`/clinics/${clinicInfo.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: clinicData.name,
          contact_email: clinicData.contact_email,
          contact_phone: clinicData.contact_phone,
          logo_url: clinicData.logo_url || null,
        }),
      });

      setSuccess("Clinic settings updated successfully!");
      await loadSettings(); // Reload to get updated data
    } catch (err: any) {
      console.error("Error updating clinic:", err);
      setError(err.message || "Failed to update clinic settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await apiClient.request("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
        }),
      });

      setSuccess("Password changed successfully!");
      
      // Reset form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      console.error("Error changing password:", err);
      setError(err.message || "Failed to change password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = async (key: string, value: boolean) => {
    if (!clinicInfo) return;

    const updated = { ...notificationSettings, [key]: value };
    setNotificationSettings(updated);

    try {
      // Update clinic settings with notification preferences
      await apiClient.request(`/clinics/${clinicInfo.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          settings: {
            ...(clinicInfo.settings || {}),
            notifications: updated
          }
        }),
      });

      setSuccess("Notification preferences updated!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error updating notifications:", err);
      setError("Failed to update notification settings");
      // Revert change
      setNotificationSettings(notificationSettings);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, just show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        setLogoPreview(preview);
        setClinicData({ ...clinicData, logo_url: preview });
      };
      reader.readAsDataURL(file);
      
      // TODO: In production, upload to S3/MinIO and get URL
      setSuccess("Logo preview updated. Click 'Save Branding' to apply.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your clinic and account settings</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Current User Info */}
      {userInfo && (
        <Card className="shadow-card border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{userInfo.name}</h2>
                <p className="text-sm text-muted-foreground">{userInfo.email}</p>
                <p className="text-xs text-muted-foreground">Role: {userInfo.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="clinic">Clinic</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Read-only)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userInfo?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="+55 11 98765-4321"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role (Read-only)</Label>
                    <Input
                      id="role"
                      value={userInfo?.role || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinic" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Clinic Information
              </CardTitle>
              <CardDescription>Update your clinic's information and branding</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleClinicSubmit} className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-3">
                <Label>Clinic Logo</Label>
                <div className="flex items-center gap-4">
                    <div className="h-24 w-24 rounded-lg border-2 border-dashed border-muted flex items-center justify-center bg-muted/20 overflow-hidden">
                    {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <Label htmlFor="logo" className="cursor-pointer">
                      <Button type="button" variant="outline" asChild>
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Logo
                          </span>
                      </Button>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clinicName">Clinic Name</Label>
                    <Input
                      id="clinicName"
                      value={clinicData.name}
                      onChange={(e) => setClinicData({ ...clinicData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ/CPF (Read-only)</Label>
                    <Input
                      id="cnpj"
                      value={clinicInfo?.cnpj_cpf || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clinicEmail">Contact Email</Label>
                    <Input
                      id="clinicEmail"
                      type="email"
                      value={clinicData.contact_email}
                      onChange={(e) => setClinicData({ ...clinicData, contact_email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicPhone">Contact Phone</Label>
                    <Input
                      id="clinicPhone"
                      value={clinicData.contact_phone}
                      onChange={(e) => setClinicData({ ...clinicData, contact_phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

              <div className="space-y-2">
                  <Label htmlFor="status">Status (Read-only)</Label>
                  <Input 
                    id="status"
                    value={clinicInfo?.status || ""}
                    disabled
                    className="bg-muted capitalize"
                  />
              </div>

                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Clinic Settings
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your password and authentication</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
                </form>

              <div className="pt-6 border-t mt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch 
                    checked={twoFactorEnabled}
                    onCheckedChange={(checked) => {
                      setTwoFactorEnabled(checked);
                      setSuccess(checked ? "2FA Enabled (Demo)" : "2FA Disabled (Demo)");
                      setTimeout(() => setSuccess(""), 3000);
                    }}
                  />
                </div>
                {twoFactorEnabled && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Scan this QR code with your authenticator app</p>
                    <div className="h-32 w-32 bg-background border rounded flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">QR Code Placeholder</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      2FA implementation ready - requires backend endpoint
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Appointments</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when a new appointment is scheduled
                    </p>
                  </div>
                  <Switch 
                    checked={notificationSettings.newAppointments}
                    onCheckedChange={(checked) => handleNotificationToggle('newAppointments', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Patient Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for patient messages
                    </p>
                  </div>
                  <Switch 
                    checked={notificationSettings.patientMessages}
                    onCheckedChange={(checked) => handleNotificationToggle('patientMessages', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Payment Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about payment confirmations
                    </p>
                  </div>
                  <Switch 
                    checked={notificationSettings.paymentUpdates}
                    onCheckedChange={(checked) => handleNotificationToggle('paymentUpdates', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive important system and feature updates
                    </p>
                  </div>
                  <Switch 
                    checked={notificationSettings.systemUpdates}
                    onCheckedChange={(checked) => handleNotificationToggle('systemUpdates', checked)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Notification preferences are saved automatically
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}