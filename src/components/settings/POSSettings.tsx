import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingCart, DollarSign, Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { POSCredentials } from "@/components/pos/POSCredentials";

interface POSSettingsData {
  minimum_sale_amount: number;
  require_manager_approval: boolean;
  manager_notification_enabled: boolean;
}

interface ProfileData {
  username: string;
  pos_pin: string;
}

export const POSSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState<string>("");
  const [profile, setProfile] = useState<ProfileData>({
    username: "",
    pos_pin: ""
  });
  const [settings, setSettings] = useState<POSSettingsData>({
    minimum_sale_amount: 0,
    require_manager_approval: false,
    manager_notification_enabled: true
  });

  useEffect(() => {
    if (user) {
      fetchPOSSettings();
    }
  }, [user]);

  const fetchPOSSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user's business ID
      const { data: membership } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membership) {
        throw new Error("No active business membership found");
      }

      setBusinessId(membership.business_id);

      // Fetch user profile data for POS credentials
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, pos_pin")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile({
          username: profileData.username || "",
          pos_pin: profileData.pos_pin || ""
        });
      }

      // Fetch POS settings
      const { data: posSettings, error } = await supabase
        .from("business_pos_settings")
        .select("*")
        .eq("business_id", membership.business_id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (posSettings) {
        setSettings({
          minimum_sale_amount: posSettings.minimum_sale_amount || 0,
          require_manager_approval: posSettings.require_manager_approval || false,
          manager_notification_enabled: posSettings.manager_notification_enabled || true
        });
      }
    } catch (error: any) {
      console.error("Error fetching POS settings:", error);
      toast({
        title: "Error",
        description: "Failed to load POS settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePOSSettings = async () => {
    if (!businessId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("business_pos_settings")
        .upsert({
          business_id: businessId,
          minimum_sale_amount: settings.minimum_sale_amount,
          require_manager_approval: settings.require_manager_approval,
          manager_notification_enabled: settings.manager_notification_enabled,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "business_id"
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "POS settings have been updated successfully",
      });
    } catch (error: any) {
      console.error("Error saving POS settings:", error);
      toast({
        title: "Error",
        description: "Failed to save POS settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            POS Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading POS settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            POS System Settings
          </CardTitle>
          <CardDescription>
            Configure your Point of Sale system settings and security requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              These settings apply to all POS transactions across your business. Changes will take effect immediately.
            </AlertDescription>
          </Alert>

          {/* Sale Amount Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <h3 className="text-lg font-medium">Transaction Controls</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minimumSaleAmount">Minimum Sale Amount ($)</Label>
              <Input
                id="minimumSaleAmount"
                type="number"
                min="0"
                step="0.01"
                value={settings.minimum_sale_amount}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  minimum_sale_amount: parseFloat(e.target.value) || 0
                }))}
                placeholder="0.00"
              />
              <p className="text-sm text-muted-foreground">
                The minimum amount required for a sale transaction. Set to 0 for no minimum.
              </p>
            </div>
          </div>

          {/* Manager Approval Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <h3 className="text-lg font-medium">Security & Approvals</h3>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requireManagerApproval">Require Manager Approval</Label>
                <p className="text-sm text-muted-foreground">
                  Require manager approval for large transactions or refunds
                </p>
              </div>
              <Switch
                id="requireManagerApproval"
                checked={settings.require_manager_approval}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  require_manager_approval: checked
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="managerNotifications">Manager Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications to managers for important POS events
                </p>
              </div>
              <Switch
                id="managerNotifications"
                checked={settings.manager_notification_enabled}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  manager_notification_enabled: checked
                }))}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={savePOSSettings} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
            <Button variant="outline" onClick={fetchPOSSettings}>
              Reset Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* POS Access Information */}
      <Card>
        <CardHeader>
          <CardTitle>POS Access Information</CardTitle>
          <CardDescription>
            Information about how employees access the POS system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>POS Login Requirements:</strong><br />
              • Business Code: Found in your business settings<br />
              • Store Name: Configured in store locations<br />
              • Username: Employee's unique username<br />
              • PIN: 6-digit PIN set by employee or manager
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground">
            <p><strong>For POS Settings:</strong> Access through Business Owner/Manager dashboard → Settings</p>
            <p><strong>For POS Usage:</strong> Access the POS system directly with employee credentials</p>
          </div>
        </CardContent>
      </Card>

      {/* POS Credentials */}
      <POSCredentials 
        username={profile.username}
        currentPin={profile.pos_pin}
        canEdit={true}
      />
    </div>
  );
};