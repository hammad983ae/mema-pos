import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings,
  Upload,
  Save,
  Mail,
  Building2,
  Loader2,
  ExternalLink,
  HelpCircle
} from "lucide-react";

interface PayrollSettingsProps {
  userRole: string;
}

interface PayrollSettings {
  company_logo_url?: string;
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  email_subject?: string;
  email_template?: string;
  sender_email?: string;
  sender_name?: string;
  reply_to_email?: string;
  reply_to_name?: string;
}

export const PayrollSettings = ({ userRole }: PayrollSettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<PayrollSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      const { data: settingsData } = await supabase
        .from("payroll_settings")
        .select("*")
        .eq("business_id", membershipData.business_id)
        .single();

      if (settingsData) {
        setSettings(settingsData);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      const { error } = await supabase
        .from("payroll_settings")
        .upsert({
          business_id: membershipData.business_id,
          ...settings
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Payroll settings updated successfully",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Payroll Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-4 w-4" />
              <h3 className="font-medium">Company Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={settings.company_name || ""}
                  onChange={(e) => updateSetting("company_name", e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-email">Company Email</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={settings.company_email || ""}
                  onChange={(e) => updateSetting("company_email", e.target.value)}
                  placeholder="Enter company email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-phone">Company Phone</Label>
                <Input
                  id="company-phone"
                  value={settings.company_phone || ""}
                  onChange={(e) => updateSetting("company_phone", e.target.value)}
                  placeholder="Enter company phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-logo">Company Logo URL</Label>
                <Input
                  id="company-logo"
                  value={settings.company_logo_url || ""}
                  onChange={(e) => updateSetting("company_logo_url", e.target.value)}
                  placeholder="Enter logo URL"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-address">Company Address</Label>
              <Textarea
                id="company-address"
                value={settings.company_address || ""}
                onChange={(e) => updateSetting("company_address", e.target.value)}
                placeholder="Enter full company address"
                rows={3}
              />
            </div>
          </div>

          {/* Email Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-4 w-4" />
              <h3 className="font-medium">Email Settings</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-subject">Email Subject</Label>
              <Input
                id="email-subject"
                value={settings.email_subject || "Your Payroll Statement"}
                onChange={(e) => updateSetting("email_subject", e.target.value)}
                placeholder="Enter email subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-template">Email Template</Label>
              <Textarea
                id="email-template"
                value={settings.email_template || "Please find your payroll statement attached."}
                onChange={(e) => updateSetting("email_template", e.target.value)}
                placeholder="Enter email template"
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Available variables: {"{employee_name}, {period_start}, {period_end}, {company_name}"}
              </p>
            </div>
          </div>

          {/* Email Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <h3 className="font-medium">Email Configuration</h3>
              </div>
              <Button variant="outline" size="sm" asChild>
                <NavLink to="/email-setup">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Setup Guide
                </NavLink>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Configure the sender and reply-to email addresses for payroll emails. 
              Note: You must verify your domain with Resend to send from custom email addresses.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sender-email">Sender Email</Label>
                <Input
                  id="sender-email"
                  type="email"
                  value={settings.sender_email || ""}
                  onChange={(e) => updateSetting("sender_email", e.target.value)}
                  placeholder="payroll@yourcompany.com"
                />
                <p className="text-xs text-muted-foreground">
                  Email address that payroll emails will be sent from
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender-name">Sender Name</Label>
                <Input
                  id="sender-name"
                  value={settings.sender_name || ""}
                  onChange={(e) => updateSetting("sender_name", e.target.value)}
                  placeholder="Company Payroll"
                />
                <p className="text-xs text-muted-foreground">
                  Display name for the sender
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reply-to-email">Reply-To Email (Optional)</Label>
                <Input
                  id="reply-to-email"
                  type="email"
                  value={settings.reply_to_email || ""}
                  onChange={(e) => updateSetting("reply_to_email", e.target.value)}
                  placeholder="hr@yourcompany.com"
                />
                <p className="text-xs text-muted-foreground">
                  Where replies will be sent (if different from sender)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reply-to-name">Reply-To Name (Optional)</Label>
                <Input
                  id="reply-to-name"
                  value={settings.reply_to_name || ""}
                  onChange={(e) => updateSetting("reply_to_name", e.target.value)}
                  placeholder="HR Department"
                />
                <p className="text-xs text-muted-foreground">
                  Display name for replies
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};