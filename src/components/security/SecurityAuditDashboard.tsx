import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Lock, Eye, EyeOff, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SecurityMetrics {
  failedPinAttempts: number;
  activeUsers: number;
  recentRoleChanges: number;
  suspiciousActivity: number;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  created_at: string;
  user_id: string;
  resource_accessed: string;
  action_performed: string;
  outcome: string;
}

export const SecurityAuditDashboard = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    failedPinAttempts: 0,
    activeUsers: 0,
    recentRoleChanges: 0,
    suspiciousActivity: 0,
  });
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityMetrics();
    loadSecurityEvents();
  }, []);

  const loadSecurityMetrics = async () => {
    try {
      // Get failed PIN attempts in last 24 hours
      const { data: pinAttempts } = await supabase
        .from('pin_attempts')
        .select('*')
        .eq('success', false)
        .gte('attempted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get recent role changes
      const { data: roleChanges } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('action', 'role_changed')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Get active users
      const { data: activeUsers } = await supabase
        .from('user_business_memberships')
        .select('*')
        .eq('is_active', true);

      setMetrics({
        failedPinAttempts: pinAttempts?.length || 0,
        activeUsers: activeUsers?.length || 0,
        recentRoleChanges: roleChanges?.length || 0,
        suspiciousActivity: (pinAttempts?.length || 0) + (roleChanges?.length || 0),
      });
    } catch (error) {
      console.error('Error loading security metrics:', error);
    }
  };

  const loadSecurityEvents = async () => {
    try {
      const { data: events } = await supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      setSecurityEvents(events || []);
    } catch (error) {
      console.error('Error loading security events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case 'success':
        return 'default';
      case 'failure':
        return 'destructive';
      case 'blocked':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const exportSecurityReport = async () => {
    try {
      const report = {
        generatedAt: new Date().toISOString(),
        metrics,
        events: securityEvents,
      };
      
      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json',
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-audit-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Security Report Exported",
        description: "Security audit report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export security report.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security Audit Dashboard
          </h2>
          <p className="text-muted-foreground">
            Monitor security events and system integrity
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSensitiveData(!showSensitiveData)}
            className="flex items-center gap-2"
          >
            {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showSensitiveData ? 'Hide' : 'Show'} Sensitive Data
          </Button>
          <Button onClick={exportSecurityReport} className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed PIN Attempts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.failedPinAttempts}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <User className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role Changes</CardTitle>
            <Lock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.recentRoleChanges}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.suspiciousActivity}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No security events recorded
              </p>
            ) : (
              securityEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                      <span className="font-medium">{event.event_type}</span>
                      <Badge variant={getOutcomeColor(event.outcome)}>
                        {event.outcome}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Action: {event.action_performed}
                    </p>
                    {showSensitiveData && (
                      <p className="text-xs text-muted-foreground">
                        Resource: {event.resource_accessed}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(event.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};