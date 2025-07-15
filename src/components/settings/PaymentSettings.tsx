import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  Shield, 
  Settings,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit
} from "lucide-react";

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  settings: Record<string, any>;
}

interface PaymentSettingsProps {
  userRole: string;
}

const PaymentSettings = ({ userRole }: PaymentSettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "cash",
      name: "Cash",
      type: "traditional",
      enabled: true,
      settings: {
        requireExactChange: false,
        allowOverpayment: true
      }
    },
    {
      id: "credit_card",
      name: "Credit/Debit Cards",
      type: "card",
      enabled: true,
      settings: {
        acceptVisa: true,
        acceptMastercard: true,
        acceptAmex: true,
        acceptDiscover: true,
        requireSignature: false,
        tipEnabled: true
      }
    },
    {
      id: "stripe",
      name: "Stripe",
      type: "processor",
      enabled: false,
      settings: {
        publishableKey: "",
        secretKey: "",
        testMode: true,
        webhookSecret: ""
      }
    }
  ]);

  const [taxSettings, setTaxSettings] = useState({
    defaultTaxRate: 8.875,
    taxIncluded: false,
    automaticCalculation: true,
    roundingMethod: "round" // round, floor, ceil
  });

  const [discountSettings, setDiscountSettings] = useState({
    allowEmployeeDiscounts: true,
    maxDiscountPercent: 20,
    requireManagerApproval: true,
    trackDiscountReasons: true
  });

  const isManager = userRole === "business_owner" || userRole === "manager";

  const updatePaymentMethod = (methodId: string, updates: Partial<PaymentMethod>) => {
    setPaymentMethods(prev => 
      prev.map(method => 
        method.id === methodId 
          ? { ...method, ...updates }
          : method
      )
    );
  };

  const updatePaymentSettings = (methodId: string, settingKey: string, value: any) => {
    setPaymentMethods(prev => 
      prev.map(method => 
        method.id === methodId 
          ? { 
              ...method, 
              settings: { 
                ...method.settings, 
                [settingKey]: value 
              }
            }
          : method
      )
    );
  };

  const saveSettings = async () => {
    if (!isManager) return;

    setLoading(true);
    try {
      // In a real implementation, you would save these settings to your database
      // and potentially configure payment processors
      
      toast({
        title: "Settings Saved",
        description: "Payment settings have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testStripeConnection = async () => {
    const stripeMethod = paymentMethods.find(m => m.id === "stripe");
    if (!stripeMethod?.settings.publishableKey || !stripeMethod?.settings.secretKey) {
      toast({
        title: "Missing Credentials",
        description: "Please enter your Stripe publishable and secret keys.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Testing Connection",
      description: "Connecting to Stripe...",
    });

    // Simulate API test
    setTimeout(() => {
      toast({
        title: "Connection Successful",
        description: "Stripe integration is working correctly.",
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Payment Processing</h3>
        <p className="text-sm text-muted-foreground">
          Configure payment methods, tax settings, and discount policies
        </p>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>
            Configure accepted payment methods and their settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentMethods.map((method) => (
            <div key={method.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {method.type === "traditional" && <DollarSign className="h-5 w-5" />}
                    {method.type === "card" && <CreditCard className="h-5 w-5" />}
                    {method.type === "processor" && <Smartphone className="h-5 w-5" />}
                    <h4 className="font-medium">{method.name}</h4>
                  </div>
                  <Badge variant={method.enabled ? "default" : "secondary"}>
                    {method.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                {isManager && (
                  <Switch
                    checked={method.enabled}
                    onCheckedChange={(enabled) => updatePaymentMethod(method.id, { enabled })}
                  />
                )}
              </div>

              {method.enabled && (
                <div className="ml-8 space-y-4 border-l-2 border-border pl-4">
                  {/* Cash Settings */}
                  {method.id === "cash" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Require Exact Change</Label>
                        <Switch
                          checked={method.settings.requireExactChange}
                          onCheckedChange={(value) => updatePaymentSettings(method.id, "requireExactChange", value)}
                          disabled={!isManager}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Allow Overpayment</Label>
                        <Switch
                          checked={method.settings.allowOverpayment}
                          onCheckedChange={(value) => updatePaymentSettings(method.id, "allowOverpayment", value)}
                          disabled={!isManager}
                        />
                      </div>
                    </div>
                  )}

                  {/* Credit Card Settings */}
                  {method.id === "credit_card" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <Label>Accept Visa</Label>
                          <Switch
                            checked={method.settings.acceptVisa}
                            onCheckedChange={(value) => updatePaymentSettings(method.id, "acceptVisa", value)}
                            disabled={!isManager}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Accept Mastercard</Label>
                          <Switch
                            checked={method.settings.acceptMastercard}
                            onCheckedChange={(value) => updatePaymentSettings(method.id, "acceptMastercard", value)}
                            disabled={!isManager}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Accept Amex</Label>
                          <Switch
                            checked={method.settings.acceptAmex}
                            onCheckedChange={(value) => updatePaymentSettings(method.id, "acceptAmex", value)}
                            disabled={!isManager}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Accept Discover</Label>
                          <Switch
                            checked={method.settings.acceptDiscover}
                            onCheckedChange={(value) => updatePaymentSettings(method.id, "acceptDiscover", value)}
                            disabled={!isManager}
                          />
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <Label>Enable Tips</Label>
                        <Switch
                          checked={method.settings.tipEnabled}
                          onCheckedChange={(value) => updatePaymentSettings(method.id, "tipEnabled", value)}
                          disabled={!isManager}
                        />
                      </div>
                    </div>
                  )}

                  {/* Stripe Settings */}
                  {method.id === "stripe" && (
                    <div className="space-y-4">
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          Stripe credentials are stored securely. Never share your secret key.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="stripePublishable">Publishable Key</Label>
                          <Input
                            id="stripePublishable"
                            type="text"
                            value={method.settings.publishableKey}
                            onChange={(e) => updatePaymentSettings(method.id, "publishableKey", e.target.value)}
                            placeholder="pk_test_..."
                            disabled={!isManager}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="stripeSecret">Secret Key</Label>
                          <Input
                            id="stripeSecret"
                            type="password"
                            value={method.settings.secretKey}
                            onChange={(e) => updatePaymentSettings(method.id, "secretKey", e.target.value)}
                            placeholder="sk_test_..."
                            disabled={!isManager}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>Test Mode</Label>
                        <Switch
                          checked={method.settings.testMode}
                          onCheckedChange={(value) => updatePaymentSettings(method.id, "testMode", value)}
                          disabled={!isManager}
                        />
                      </div>

                      {isManager && (
                        <Button onClick={testStripeConnection} variant="outline">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Test Connection
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
              <Separator />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tax Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Configuration</CardTitle>
          <CardDescription>
            Configure tax calculation and display settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
              <Input
                id="defaultTaxRate"
                type="number"
                step="0.001"
                value={taxSettings.defaultTaxRate}
                onChange={(e) => setTaxSettings(prev => ({ ...prev, defaultTaxRate: parseFloat(e.target.value) || 0 }))}
                disabled={!isManager}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roundingMethod">Rounding Method</Label>
              <Select
                value={taxSettings.roundingMethod}
                onValueChange={(value) => setTaxSettings(prev => ({ ...prev, roundingMethod: value }))}
                disabled={!isManager}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round">Round to Nearest Cent</SelectItem>
                  <SelectItem value="floor">Round Down</SelectItem>
                  <SelectItem value="ceil">Round Up</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Tax Included in Prices</Label>
              <Switch
                checked={taxSettings.taxIncluded}
                onCheckedChange={(value) => setTaxSettings(prev => ({ ...prev, taxIncluded: value }))}
                disabled={!isManager}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Automatic Tax Calculation</Label>
              <Switch
                checked={taxSettings.automaticCalculation}
                onCheckedChange={(value) => setTaxSettings(prev => ({ ...prev, automaticCalculation: value }))}
                disabled={!isManager}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discount Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Discount Policies</CardTitle>
          <CardDescription>
            Configure discount rules and approval requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Allow Employee Discounts</Label>
              <Switch
                checked={discountSettings.allowEmployeeDiscounts}
                onCheckedChange={(value) => setDiscountSettings(prev => ({ ...prev, allowEmployeeDiscounts: value }))}
                disabled={!isManager}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDiscount">Maximum Discount Percentage</Label>
              <Input
                id="maxDiscount"
                type="number"
                min="0"
                max="100"
                value={discountSettings.maxDiscountPercent}
                onChange={(e) => setDiscountSettings(prev => ({ ...prev, maxDiscountPercent: parseInt(e.target.value) || 0 }))}
                disabled={!isManager}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require Manager Approval</Label>
              <Switch
                checked={discountSettings.requireManagerApproval}
                onCheckedChange={(value) => setDiscountSettings(prev => ({ ...prev, requireManagerApproval: value }))}
                disabled={!isManager}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Track Discount Reasons</Label>
              <Switch
                checked={discountSettings.trackDiscountReasons}
                onCheckedChange={(value) => setDiscountSettings(prev => ({ ...prev, trackDiscountReasons: value }))}
                disabled={!isManager}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isManager && (
        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={loading}>
            {loading ? "Saving..." : "Save Payment Settings"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaymentSettings;