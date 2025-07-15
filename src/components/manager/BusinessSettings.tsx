import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  CreditCard, 
  Clock, 
  Mail, 
  Phone, 
  MapPin,
  Percent,
  DollarSign,
  Settings,
  Globe,
  Shield,
  Bell,
  FileText,
  Save,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface BusinessConfig {
  // Basic Info
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  timezone: string;
  
  // Financial Settings
  default_currency: string;
  tax_rate: number;
  default_payment_method: string;
  enable_tips: boolean;
  max_discount_percent: number;
  
  // Operational Settings
  business_hours_start: string;
  business_hours_end: string;
  auto_print_receipts: boolean;
  require_customer_info: boolean;
  require_customer_for_checkout: boolean;
  enable_loyalty_program: boolean;
  
  // Security Settings
  pos_session_timeout: number;
  require_manager_approval: boolean;
  enable_audit_logs: boolean;
  
  // Notification Settings
  email_notifications: boolean;
  sms_notifications: boolean;
  low_stock_alerts: boolean;
  eod_report_reminders: boolean;
  
  // Receipt Settings
  receipt_header: string;
  receipt_footer: string;
  show_business_info: boolean;
  include_return_policy: boolean;
}

export const BusinessSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [businessContext, setBusinessContext] = useState(null);
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig>({
    // Basic Info
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    timezone: "America/New_York",
    
    // Financial Settings
    default_currency: "USD",
    tax_rate: 8.875,
    default_payment_method: "cash",
    enable_tips: true,
    max_discount_percent: 20,
    
    // Operational Settings
    business_hours_start: "09:00",
    business_hours_end: "20:00",
    auto_print_receipts: true,
    require_customer_info: false,
    require_customer_for_checkout: false,
    enable_loyalty_program: true,
    
    // Security Settings
    pos_session_timeout: 30,
    require_manager_approval: false,
    enable_audit_logs: true,
    
    // Notification Settings
    email_notifications: true,
    sms_notifications: false,
    low_stock_alerts: true,
    eod_report_reminders: true,
    
    // Receipt Settings
    receipt_header: "Thank you for your business!",
    receipt_footer: "Return policy: 30 days with receipt",
    show_business_info: true,
    include_return_policy: true
  });

  useEffect(() => {
    loadBusinessContext();
  }, [user?.id]);

  useEffect(() => {
    if (businessContext?.business_id) {
      loadBusinessSettings();
    }
  }, [businessContext]);

  const loadBusinessContext = async () => {
    if (!user?.id) return;
    
    try {
      const { data: userContext } = await supabase.rpc('get_user_business_context', {
        user_uuid: user.id
      });

      if (userContext && userContext.length > 0) {
        setBusinessContext(userContext[0]);
      }
    } catch (error) {
      console.error('Error loading business context:', error);
    }
  };

  const loadBusinessSettings = async () => {
    if (!businessContext?.business_id) return;
    
    try {
      setLoading(true);

      const { data: business, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessContext.business_id)
        .single();

      if (error) throw error;

      if (business) {
        setBusinessConfig(prev => ({
          ...prev,
          name: business.name || "",
          email: business.email || "",
          phone: business.phone || "",
          address: business.address || "",
          // Parse settings from JSON if available
          ...(business.settings ? business.settings as any : {})
        }));
      }
    } catch (error) {
      console.error('Error loading business settings:', error);
      toast({
        title: "Error",
        description: "Failed to load business settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveBusinessSettings = async () => {
    if (!businessContext?.business_id) {
      toast({
        title: "Error",
        description: "Business context not available",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('businesses')
        .update({
          name: businessConfig.name,
          email: businessConfig.email,
          phone: businessConfig.phone,
          address: businessConfig.address,
          settings: {
            // Financial Settings
            default_currency: businessConfig.default_currency,
            tax_rate: businessConfig.tax_rate,
            default_payment_method: businessConfig.default_payment_method,
            enable_tips: businessConfig.enable_tips,
            max_discount_percent: businessConfig.max_discount_percent,
            
            // Operational Settings
            business_hours_start: businessConfig.business_hours_start,
            business_hours_end: businessConfig.business_hours_end,
            auto_print_receipts: businessConfig.auto_print_receipts,
            require_customer_info: businessConfig.require_customer_info,
            require_customer_for_checkout: businessConfig.require_customer_for_checkout,
            enable_loyalty_program: businessConfig.enable_loyalty_program,
            
            // Security Settings
            pos_session_timeout: businessConfig.pos_session_timeout,
            require_manager_approval: businessConfig.require_manager_approval,
            enable_audit_logs: businessConfig.enable_audit_logs,
            
            // Notification Settings
            email_notifications: businessConfig.email_notifications,
            sms_notifications: businessConfig.sms_notifications,
            low_stock_alerts: businessConfig.low_stock_alerts,
            eod_report_reminders: businessConfig.eod_report_reminders,
            
            // Receipt Settings
            receipt_header: businessConfig.receipt_header,
            receipt_footer: businessConfig.receipt_footer,
            show_business_info: businessConfig.show_business_info,
            include_return_policy: businessConfig.include_return_policy,
            
            // Additional settings
            website: businessConfig.website,
            timezone: businessConfig.timezone
          }
        })
        .eq('id', businessContext.business_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Business settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving business settings:', error);
      toast({
        title: "Error",
        description: "Failed to save business settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (field: keyof BusinessConfig, value: any) => {
    setBusinessConfig(prev => ({ ...prev, [field]: value }));
  };

  const timezones = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Europe/Paris',
    'Asia/Tokyo', 'Australia/Sydney'
  ];

  const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' }
  ];

  const paymentMethods = ['cash', 'card', 'both'];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Business Settings</h2>
          <p className="text-muted-foreground">Configure your business information and operational preferences</p>
        </div>
        <Button 
          onClick={() => {
            console.log("Save All Settings clicked");
            saveBusinessSettings();
          }} 
          disabled={saving}
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save All Settings
        </Button>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operational">Operations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Business Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input
                    value={businessConfig.name}
                    onChange={(e) => updateConfig('name', e.target.value)}
                    placeholder="Your business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={businessConfig.email}
                    onChange={(e) => updateConfig('email', e.target.value)}
                    placeholder="contact@business.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={businessConfig.phone}
                    onChange={(e) => updateConfig('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={businessConfig.website}
                    onChange={(e) => updateConfig('website', e.target.value)}
                    placeholder="https://www.business.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={businessConfig.address}
                  onChange={(e) => updateConfig('address', e.target.value)}
                  placeholder="123 Main St, City, State 12345"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select
                  value={businessConfig.timezone}
                  onValueChange={(value) => updateConfig('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Settings Tab */}
        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Financial Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select
                    value={businessConfig.default_currency}
                    onValueChange={(value) => updateConfig('default_currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={businessConfig.tax_rate}
                    onChange={(e) => updateConfig('tax_rate', parseFloat(e.target.value))}
                    placeholder="8.875"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Default Payment Method</Label>
                  <Select
                    value={businessConfig.default_payment_method}
                    onValueChange={(value) => updateConfig('default_payment_method', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(method => (
                        <SelectItem key={method} value={method}>
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Discount (%)</Label>
                  <Input
                    type="number"
                    value={businessConfig.max_discount_percent}
                    onChange={(e) => updateConfig('max_discount_percent', parseInt(e.target.value))}
                    placeholder="20"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={businessConfig.enable_tips}
                  onCheckedChange={(checked) => updateConfig('enable_tips', checked)}
                />
                <Label>Enable Tips</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operational Settings Tab */}
        <TabsContent value="operational">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Operational Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Business Hours Start</Label>
                  <Input
                    type="time"
                    value={businessConfig.business_hours_start}
                    onChange={(e) => updateConfig('business_hours_start', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Business Hours End</Label>
                  <Input
                    type="time"
                    value={businessConfig.business_hours_end}
                    onChange={(e) => updateConfig('business_hours_end', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={businessConfig.auto_print_receipts}
                    onCheckedChange={(checked) => updateConfig('auto_print_receipts', checked)}
                  />
                  <Label>Auto-print receipts</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={businessConfig.require_customer_info}
                    onCheckedChange={(checked) => updateConfig('require_customer_info', checked)}
                  />
                  <Label>Require customer information for sales</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={businessConfig.require_customer_for_checkout}
                    onCheckedChange={(checked) => updateConfig('require_customer_for_checkout', checked)}
                  />
                  <Label>Require customer assignment before checkout</Label>
                  <p className="text-xs text-muted-foreground ml-2">
                    When enabled, staff must assign a customer before completing any transaction
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={businessConfig.enable_loyalty_program}
                    onCheckedChange={(checked) => updateConfig('enable_loyalty_program', checked)}
                  />
                  <Label>Enable loyalty program</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>POS Session Timeout (minutes)</Label>
                <Input
                  type="number"
                  value={businessConfig.pos_session_timeout}
                  onChange={(e) => updateConfig('pos_session_timeout', parseInt(e.target.value))}
                  placeholder="30"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={businessConfig.require_manager_approval}
                    onCheckedChange={(checked) => updateConfig('require_manager_approval', checked)}
                  />
                  <Label>Require manager approval for large discounts</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={businessConfig.enable_audit_logs}
                    onCheckedChange={(checked) => updateConfig('enable_audit_logs', checked)}
                  />
                  <Label>Enable audit logs</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={businessConfig.email_notifications}
                    onCheckedChange={(checked) => updateConfig('email_notifications', checked)}
                  />
                  <Label>Email notifications</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={businessConfig.sms_notifications}
                    onCheckedChange={(checked) => updateConfig('sms_notifications', checked)}
                  />
                  <Label>SMS notifications</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={businessConfig.low_stock_alerts}
                    onCheckedChange={(checked) => updateConfig('low_stock_alerts', checked)}
                  />
                  <Label>Low stock alerts</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={businessConfig.eod_report_reminders}
                    onCheckedChange={(checked) => updateConfig('eod_report_reminders', checked)}
                  />
                  <Label>End-of-day report reminders</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipt Settings Tab */}
        <TabsContent value="receipts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Receipt Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Receipt Header</Label>
                <Textarea
                  value={businessConfig.receipt_header}
                  onChange={(e) => updateConfig('receipt_header', e.target.value)}
                  placeholder="Thank you for your business!"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Receipt Footer</Label>
                <Textarea
                  value={businessConfig.receipt_footer}
                  onChange={(e) => updateConfig('receipt_footer', e.target.value)}
                  placeholder="Return policy: 30 days with receipt"
                  rows={3}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={businessConfig.show_business_info}
                    onCheckedChange={(checked) => updateConfig('show_business_info', checked)}
                  />
                  <Label>Show business information on receipts</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={businessConfig.include_return_policy}
                    onCheckedChange={(checked) => updateConfig('include_return_policy', checked)}
                  />
                  <Label>Include return policy on receipts</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};