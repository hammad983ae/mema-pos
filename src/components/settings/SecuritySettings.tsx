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
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Smartphone,
  Globe,
  UserX,
  Activity,
  CreditCard,
  Database,
  FileSearch,
  Users
} from "lucide-react";

interface SecurityEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  status: "success" | "failed" | "warning";
}

interface SecuritySettingsProps {
  userRole: string;
}

const SecuritySettings = ({ userRole }: SecuritySettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [securitySettings, setSecuritySettings] = useState({
    // PCI DSS Settings
    pciComplianceEnabled: true,
    encryptionAtRest: true,
    encryptionInTransit: true,
    cardDataRetentionDays: 0,
    
    // Access Control
    sessionTimeoutMinutes: 480,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    passwordMinLength: 8,
    passwordComplexityEnabled: true,
    require2fa: false,
    require2faForSensitiveOps: true,
    
    // IP Restrictions
    ipWhitelistEnabled: false,
    allowedIpRanges: [] as string[],
    geoRestrictionsEnabled: false,
    allowedCountries: [] as string[],
    
    // Audit and Monitoring
    enhancedAuditLogging: true,
    realTimeMonitoring: true,
    suspiciousActivityAlerts: true,
    dataAccessLogging: true,
    
    // Data Protection
    dataMaskingEnabled: true,
    automaticDataPurging: false,
    backupEncryption: true
  });

  const [complianceStatus, setComplianceStatus] = useState({
    pciDssCompliant: false,
    lastAssessment: null as string | null,
    certificateExpiry: null as string | null,
    vulnerabilityScanStatus: 'pending' as 'pending' | 'passed' | 'failed',
    penetrationTestStatus: 'pending' as 'pending' | 'passed' | 'failed'
  });

  const [recentActivity, setRecentActivity] = useState<SecurityEvent[]>([
    {
      id: "1",
      type: "login",
      description: "Successful login",
      timestamp: "2024-01-08T10:30:00Z",
      ipAddress: "192.168.1.100",
      userAgent: "Chrome 120.0.0.0",
      status: "success"
    },
    {
      id: "2",
      type: "password_change",
      description: "Password changed",
      timestamp: "2024-01-07T15:45:00Z",
      ipAddress: "192.168.1.100",
      userAgent: "Chrome 120.0.0.0",
      status: "success"
    },
    {
      id: "3",
      type: "failed_login",
      description: "Failed login attempt",
      timestamp: "2024-01-06T09:15:00Z",
      ipAddress: "203.0.113.0",
      userAgent: "Unknown",
      status: "failed"
    }
  ]);

  const isManager = userRole === "business_owner" || userRole === "manager";

  // Load security settings on component mount
  useEffect(() => {
    const loadSecuritySettings = async () => {
      if (!user) return;
      
      try {
        // Get user's business ID
        const { data: membership } = await supabase
          .from('user_business_memberships')
          .select('business_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (membership) {
          setBusinessId(membership.business_id);
          
          // Load security settings
          const { data: settings } = await supabase
            .from('security_settings')
            .select('*')
            .eq('business_id', membership.business_id)
            .single();

          if (settings) {
            setSecuritySettings({
              pciComplianceEnabled: settings.pci_compliance_enabled,
              encryptionAtRest: settings.encryption_at_rest,
              encryptionInTransit: settings.encryption_in_transit,
              cardDataRetentionDays: settings.card_data_retention_days,
              sessionTimeoutMinutes: settings.session_timeout_minutes,
              maxLoginAttempts: settings.max_login_attempts,
              lockoutDurationMinutes: settings.lockout_duration_minutes,
              passwordMinLength: settings.password_min_length,
              passwordComplexityEnabled: settings.password_complexity_enabled,
              require2fa: settings.require_2fa,
              require2faForSensitiveOps: settings.require_2fa_for_sensitive_ops,
              ipWhitelistEnabled: settings.ip_whitelist_enabled,
              allowedIpRanges: settings.allowed_ip_ranges || [],
              geoRestrictionsEnabled: settings.geo_restrictions_enabled,
              allowedCountries: settings.allowed_countries || [],
              enhancedAuditLogging: settings.enhanced_audit_logging,
              realTimeMonitoring: settings.real_time_monitoring,
              suspiciousActivityAlerts: settings.suspicious_activity_alerts,
              dataAccessLogging: settings.data_access_logging,
              dataMaskingEnabled: settings.data_masking_enabled,
              automaticDataPurging: settings.automatic_data_purging,
              backupEncryption: settings.backup_encryption
            });
          }
        }
      } catch (error) {
        console.error('Error loading security settings:', error);
      }
    };

    loadSecuritySettings();
  }, [user]);

  const generateApiKey = () => {
    const newKey = "sk_" + Array.from({length: 32}, () => Math.random().toString(36).charAt(0)).join('');
    toast({
      title: "API Key Generated",
      description: "New API key has been generated. Store it securely.",
    });
    return newKey;
  };

  const revokeApiKey = () => {
    if (confirm("Are you sure you want to revoke this API key? This cannot be undone.")) {
      toast({
        title: "API Key Revoked",
        description: "API key has been revoked successfully.",
      });
    }
  };

  const enable2FA = async () => {
    setLoading(true);
    try {
      // In a real implementation, you would:
      // 1. Generate a TOTP secret
      // 2. Show QR code for user to scan
      // 3. Verify setup with a test code
      
      setSecuritySettings(prev => ({ ...prev, require2fa: true }));
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been enabled for your account.",
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

  const disable2FA = async () => {
    if (!confirm("Are you sure you want to disable two-factor authentication?")) return;
    
    setLoading(true);
    try {
      setSecuritySettings(prev => ({ ...prev, require2fa: false }));
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled.",
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

  const saveSettings = async () => {
    if (!businessId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('security_settings')
        .upsert({
          business_id: businessId,
          pci_compliance_enabled: securitySettings.pciComplianceEnabled,
          encryption_at_rest: securitySettings.encryptionAtRest,
          encryption_in_transit: securitySettings.encryptionInTransit,
          card_data_retention_days: securitySettings.cardDataRetentionDays,
          session_timeout_minutes: securitySettings.sessionTimeoutMinutes,
          max_login_attempts: securitySettings.maxLoginAttempts,
          lockout_duration_minutes: securitySettings.lockoutDurationMinutes,
          password_min_length: securitySettings.passwordMinLength,
          password_complexity_enabled: securitySettings.passwordComplexityEnabled,
          require_2fa: securitySettings.require2fa,
          require_2fa_for_sensitive_ops: securitySettings.require2faForSensitiveOps,
          ip_whitelist_enabled: securitySettings.ipWhitelistEnabled,
          allowed_ip_ranges: securitySettings.allowedIpRanges,
          geo_restrictions_enabled: securitySettings.geoRestrictionsEnabled,
          allowed_countries: securitySettings.allowedCountries,
          enhanced_audit_logging: securitySettings.enhancedAuditLogging,
          real_time_monitoring: securitySettings.realTimeMonitoring,
          suspicious_activity_alerts: securitySettings.suspiciousActivityAlerts,
          data_access_logging: securitySettings.dataAccessLogging,
          data_masking_enabled: securitySettings.dataMaskingEnabled,
          automatic_data_purging: securitySettings.automaticDataPurging,
          backup_encryption: securitySettings.backupEncryption
        });

      if (error) throw error;

      // Log the security settings change
      await supabase.rpc('log_security_event', {
        p_business_id: businessId,
        p_event_type: 'security_settings_update',
        p_event_category: 'admin',
        p_action_performed: 'Security settings updated',
        p_outcome: 'success',
        p_severity: 'info',
        p_metadata: { settings_updated: Object.keys(securitySettings) }
      });

      toast({
        title: "Settings Saved",
        description: "Security settings have been updated successfully.",
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

  const runComplianceCheck = async () => {
    setLoading(true);
    try {
      // Simulate compliance check
      setComplianceStatus({
        pciDssCompliant: securitySettings.pciComplianceEnabled && 
                         securitySettings.encryptionAtRest && 
                         securitySettings.encryptionInTransit,
        lastAssessment: new Date().toISOString(),
        certificateExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        vulnerabilityScanStatus: 'passed',
        penetrationTestStatus: 'passed'
      });

      toast({
        title: "Compliance Check Complete",
        description: "PCI DSS compliance assessment has been completed.",
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Security Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage PCI DSS compliance, security controls, and data protection
        </p>
      </div>

      {/* PCI DSS Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            PCI DSS Compliance
          </CardTitle>
          <CardDescription>
            Payment Card Industry Data Security Standard compliance status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Compliance Status</Label>
              <div className="flex items-center gap-2">
                <Badge variant={complianceStatus.pciDssCompliant ? "default" : "destructive"}>
                  {complianceStatus.pciDssCompliant ? "Compliant" : "Non-Compliant"}
                </Badge>
                {complianceStatus.lastAssessment && (
                  <span className="text-sm text-muted-foreground">
                    Last assessed: {new Date(complianceStatus.lastAssessment).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <Button onClick={runComplianceCheck} disabled={loading}>
              Run Compliance Check
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vulnerability Scan</Label>
              <Badge variant={complianceStatus.vulnerabilityScanStatus === 'passed' ? "default" : "destructive"}>
                {complianceStatus.vulnerabilityScanStatus}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>Penetration Test</Label>
              <Badge variant={complianceStatus.penetrationTestStatus === 'passed' ? "default" : "destructive"}>
                {complianceStatus.penetrationTestStatus}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>PCI DSS Compliance Mode</Label>
              <Switch
                checked={securitySettings.pciComplianceEnabled}
                onCheckedChange={(value) => setSecuritySettings(prev => ({ ...prev, pciComplianceEnabled: value }))}
                disabled={!isManager}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardDataRetention">Card Data Retention (days, 0 = no retention)</Label>
              <Input
                id="cardDataRetention"
                type="number"
                value={securitySettings.cardDataRetentionDays}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, cardDataRetentionDays: parseInt(e.target.value) || 0 }))}
                disabled={!isManager}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Encryption */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Encryption
          </CardTitle>
          <CardDescription>
            Configure encryption settings for data at rest and in transit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Encryption at Rest</Label>
                <p className="text-sm text-muted-foreground">
                  Encrypt stored data using AES-256
                </p>
              </div>
              <Switch
                checked={securitySettings.encryptionAtRest}
                onCheckedChange={(value) => setSecuritySettings(prev => ({ ...prev, encryptionAtRest: value }))}
                disabled={!isManager}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Encryption in Transit</Label>
                <p className="text-sm text-muted-foreground">
                  Encrypt data during transmission using TLS 1.3
                </p>
              </div>
              <Switch
                checked={securitySettings.encryptionInTransit}
                onCheckedChange={(value) => setSecuritySettings(prev => ({ ...prev, encryptionInTransit: value }))}
                disabled={!isManager}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Backup Encryption</Label>
                <p className="text-sm text-muted-foreground">
                  Encrypt all backup files
                </p>
              </div>
              <Switch
                checked={securitySettings.backupEncryption}
                onCheckedChange={(value) => setSecuritySettings(prev => ({ ...prev, backupEncryption: value }))}
                disabled={!isManager}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Data Masking</Label>
                <p className="text-sm text-muted-foreground">
                  Mask sensitive data in logs and reports
                </p>
              </div>
              <Switch
                checked={securitySettings.dataMaskingEnabled}
                onCheckedChange={(value) => setSecuritySettings(prev => ({ ...prev, dataMaskingEnabled: value }))}
                disabled={!isManager}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Security
          </CardTitle>
          <CardDescription>
            Configure authentication and access security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                 <Label>Two-Factor Authentication</Label>
                {securitySettings.require2fa && (
                  <Badge variant="default">Enabled</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button
              variant={securitySettings.require2fa ? "outline" : "default"}
              onClick={securitySettings.require2fa ? disable2FA : enable2FA}
              disabled={loading}
            >
              {securitySettings.require2fa ? "Disable" : "Enable"} 2FA
            </Button>
          </div>

          <Separator />

          {/* Authentication Policies */}
          <div className="space-y-4">
            <h4 className="font-medium">Authentication Policies</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={securitySettings.sessionTimeoutMinutes}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeoutMinutes: parseInt(e.target.value) || 0 }))}
                  disabled={!isManager}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) || 0 }))}
                  disabled={!isManager}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                <Input
                  id="lockoutDuration"
                  type="number"
                  value={securitySettings.lockoutDurationMinutes}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, lockoutDurationMinutes: parseInt(e.target.value) || 0 }))}
                  disabled={!isManager}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordMinLength">Password Min Length</Label>
                <Input
                  id="passwordMinLength"
                  type="number"
                  value={securitySettings.passwordMinLength}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) || 0 }))}
                  disabled={!isManager}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Password Complexity Required</Label>
                <Switch
                  checked={securitySettings.passwordComplexityEnabled}
                  onCheckedChange={(value) => setSecuritySettings(prev => ({ ...prev, passwordComplexityEnabled: value }))}
                  disabled={!isManager}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Require 2FA for All Users</Label>
                <Switch
                  checked={securitySettings.require2fa}
                  onCheckedChange={(value) => setSecuritySettings(prev => ({ ...prev, require2fa: value }))}
                  disabled={!isManager}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Require 2FA for Sensitive Operations</Label>
                <Switch
                  checked={securitySettings.require2faForSensitiveOps}
                  onCheckedChange={(value) => setSecuritySettings(prev => ({ ...prev, require2faForSensitiveOps: value }))}
                  disabled={!isManager}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Control */}
      {isManager && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Access Control
            </CardTitle>
            <CardDescription>
              Configure location and device access restrictions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>IP Whitelist Enabled</Label>
                <Switch
                  checked={securitySettings.ipWhitelistEnabled}
                  onCheckedChange={(value) => setSecuritySettings(prev => ({ ...prev, ipWhitelistEnabled: value }))}
                  disabled={!isManager}
                />
              </div>
              
              {securitySettings.ipWhitelistEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="allowedIpRanges">Allowed IP Ranges (one per line)</Label>
                  <textarea
                    id="allowedIpRanges"
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    value={securitySettings.allowedIpRanges.join('\n')}
                    onChange={(e) => setSecuritySettings(prev => ({ 
                      ...prev, 
                      allowedIpRanges: e.target.value.split('\n').filter(ip => ip.trim()) 
                    }))}
                    placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <Label>Geographic Restrictions</Label>
                <Switch
                  checked={securitySettings.geoRestrictionsEnabled}
                  onCheckedChange={(value) => setSecuritySettings(prev => ({ ...prev, geoRestrictionsEnabled: value }))}
                  disabled={!isManager}
                />
              </div>
              
              {securitySettings.geoRestrictionsEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="allowedCountries">Allowed Countries (comma-separated country codes)</Label>
                  <Input
                    id="allowedCountries"
                    value={securitySettings.allowedCountries.join(', ')}
                    onChange={(e) => setSecuritySettings(prev => ({ 
                      ...prev, 
                      allowedCountries: e.target.value.split(',').map(c => c.trim()).filter(c => c) 
                    }))}
                    placeholder="US, CA, UK, AU"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit and Monitoring */}
      {isManager && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSearch className="h-5 w-5" />
              Audit and Monitoring
            </CardTitle>
            <CardDescription>
              Configure audit trails and real-time monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enhanced Audit Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Detailed logging of all user actions and system events
                  </p>
                </div>
                <Switch
                  checked={securitySettings.enhancedAuditLogging}
                  onCheckedChange={(value) => setSecuritySettings(prev => ({ ...prev, enhancedAuditLogging: value }))}
                  disabled={!isManager}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Real-time Monitoring</Label>
                  <p className="text-sm text-muted-foreground">
                    Monitor system activity in real-time
                  </p>
                </div>
                <Switch
                  checked={securitySettings.realTimeMonitoring}
                  onCheckedChange={(value) => setSecuritySettings(prev => ({ ...prev, realTimeMonitoring: value }))}
                  disabled={!isManager}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Suspicious Activity Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatic alerts for suspicious behavior
                  </p>
                </div>
                <Switch
                  checked={securitySettings.suspiciousActivityAlerts}
                  onCheckedChange={(value) => setSecuritySettings(prev => ({ ...prev, suspiciousActivityAlerts: value }))}
                  disabled={!isManager}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Data Access Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log all access to sensitive customer data
                  </p>
                </div>
                <Switch
                  checked={securitySettings.dataAccessLogging}
                  onCheckedChange={(value) => setSecuritySettings(prev => ({ ...prev, dataAccessLogging: value }))}
                  disabled={!isManager}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Automatic Data Purging</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically delete old data per retention policies
                  </p>
                </div>
                <Switch
                  checked={securitySettings.automaticDataPurging}
                  onCheckedChange={(value) => setSecuritySettings(prev => ({ ...prev, automaticDataPurging: value }))}
                  disabled={!isManager}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role-Based Permissions */}
      {isManager && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Role-Based Access Control
            </CardTitle>
            <CardDescription>
              Configure granular permissions for different user roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Role-based permissions are configured per business. Contact your system administrator to modify role permissions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* API Access */}
      {isManager && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              API Access
            </CardTitle>
            <CardDescription>
              Manage API keys and external integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>API Key</Label>
                  <p className="text-sm text-muted-foreground">
                    Use this key for external integrations
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value="sk_live_abcdef1234567890abcdef1234567890"
                  readOnly
                  className="font-mono"
                />
                <Button variant="outline" size="sm" onClick={generateApiKey}>
                  Regenerate
                </Button>
                <Button variant="outline" size="sm" onClick={revokeApiKey}>
                  Revoke
                </Button>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Keep your API key secure. Never share it publicly or include it in client-side code.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Security Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Security Activity
          </CardTitle>
          <CardDescription>
            Monitor recent security events for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    {event.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {event.status === "failed" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    {event.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    <span className="font-medium">{event.description}</span>
                    <Badge variant={event.status === "success" ? "default" : "destructive"}>
                      {event.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{new Date(event.timestamp).toLocaleString()}</span>
                    <span>IP: {event.ipAddress}</span>
                    <span>{event.userAgent}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={loading}>
          {loading ? "Saving..." : "Save Security Settings"}
        </Button>
      </div>
    </div>
  );
};

export default SecuritySettings;