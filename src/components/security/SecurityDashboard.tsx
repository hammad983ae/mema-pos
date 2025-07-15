import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  User, 
  Eye,
  RefreshCw,
  Activity,
  Bell,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface SecurityEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  event_description: string;
  severity: string;
  ip_address: unknown;
  user_agent: string | null;
  additional_data: any;
  created_at: string;
}

interface PinAttempt {
  id: string;
  user_id: string;
  attempted_at: string;
  success: boolean;
  ip_address: unknown;
  user_agent: string | null;
}

interface UserSession {
  id: string;
  user_id: string;
  business_id: string;
  session_token: string;
  expires_at: string;
  last_activity: string;
  ip_address: unknown;
  user_agent: string | null;
  is_active: boolean;
  created_at: string;
}

export const SecurityDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [pinAttempts, setPinAttempts] = useState<PinAttempt[]>([]);
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      initializeDashboard();
    }
  }, [user]);

  const initializeDashboard = async () => {
    try {
      // Get business context
      const { data: userContext } = await supabase.rpc('get_user_business_context', {
        user_uuid: user?.id
      });

      if (userContext && userContext.length > 0) {
        const bizId = userContext[0].business_id;
        setBusinessId(bizId);
        await loadSecurityData(bizId);
      }
    } catch (error) {
      console.error('Error initializing security dashboard:', error);
    }
  };

  const loadSecurityData = async (bizId: string) => {
    setLoading(true);
    try {
      // Load security events
      const { data: events } = await supabase
        .from('security_events')
        .select('*')
        .eq('business_id', bizId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (events) setSecurityEvents(events);

      // Load PIN attempts
      const { data: attempts } = await supabase
        .from('pin_attempts')
        .select('*')
        .order('attempted_at', { ascending: false })
        .limit(100);

      if (attempts) setPinAttempts(attempts);

      // Load active sessions
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('business_id', bizId)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (sessions) setActiveSessions(sessions);

    } catch (error) {
      console.error('Error loading security data:', error);
      toast({
        title: "Error",
        description: "Failed to load security data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const refreshData = () => {
    if (businessId) {
      loadSecurityData(businessId);
    }
  };

  // Security metrics
  const failedPinAttempts = pinAttempts.filter(attempt => !attempt.success).length;
  const criticalEvents = securityEvents.filter(event => event.severity === 'critical').length;
  const warningEvents = securityEvents.filter(event => event.severity === 'warning').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
          <p className="text-muted-foreground">Monitor security events and system activity</p>
        </div>
        <Button onClick={refreshData} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium">Critical Events</p>
                <p className="text-2xl font-bold">{criticalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Warning Events</p>
                <p className="text-2xl font-bold">{warningEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium">Failed PIN Attempts</p>
                <p className="text-2xl font-bold">{failedPinAttempts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Active Sessions</p>
                <p className="text-2xl font-bold">{activeSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="pin-attempts">PIN Attempts</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>
                System security events and audit logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {securityEvents.map((event) => (
                  <div key={event.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                      <Badge variant="outline">{event.event_type}</Badge>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{event.event_description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.created_at)}
                      </p>
                      {event.ip_address && (
                        <p className="text-xs text-muted-foreground">
                          IP: {String(event.ip_address)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {securityEvents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No security events found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pin-attempts">
          <Card>
            <CardHeader>
              <CardTitle>PIN Login Attempts</CardTitle>
              <CardDescription>
                Recent PIN authentication attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {pinAttempts.map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {attempt.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        <Badge variant={attempt.success ? "default" : "destructive"}>
                          {attempt.success ? "Success" : "Failed"}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium">User ID: {attempt.user_id}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(attempt.attempted_at)}
                        </p>
                      </div>
                    </div>
                    {attempt.ip_address && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          IP: {String(attempt.ip_address)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                {pinAttempts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No PIN attempts found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Active User Sessions</CardTitle>
              <CardDescription>
                Currently active user sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">User ID: {session.user_id}</p>
                        <p className="text-sm text-muted-foreground">
                          Created: {formatDate(session.created_at)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Last Activity: {formatDate(session.last_activity)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="default">Active</Badge>
                      {session.ip_address && (
                        <p className="text-xs text-muted-foreground mt-1">
                          IP: {String(session.ip_address)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {activeSessions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No active sessions found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {failedPinAttempts > 10 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  High number of failed PIN attempts detected. Consider reviewing employee training or resetting PINs.
                </AlertDescription>
              </Alert>
            )}
            
            {criticalEvents > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Critical security events detected. Please review immediately.
                </AlertDescription>
              </Alert>
            )}

            {activeSessions.length > 20 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  High number of active sessions. Consider implementing session timeout policies.
                </AlertDescription>
              </Alert>
            )}

            {failedPinAttempts === 0 && criticalEvents === 0 && activeSessions.length < 20 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All security metrics look good. No immediate actions required.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};