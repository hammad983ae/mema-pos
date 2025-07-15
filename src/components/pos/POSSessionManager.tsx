import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Monitor, 
  User, 
  Clock, 
  Activity, 
  RefreshCw, 
  LogOut,
  Search,
  Calendar,
  Filter,
  Download,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface POSSession {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  login_time: string;
  logout_time: string | null;
  status: 'active' | 'ended';
  terminal_id: string;
  store_id: string;
  store_name: string;
  session_duration: number | null;
  transactions_count: number;
  total_sales: number;
}

export const POSSessionManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [activeSessions, setActiveSessions] = useState<POSSession[]>([]);
  const [recentSessions, setRecentSessions] = useState<POSSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sessionLogs, setSessionLogs] = useState<any[]>([]);

  useEffect(() => {
    loadPOSSessions();
    loadSessionLogs();
    
    // Set up real-time updates for active sessions
    const interval = setInterval(() => {
      loadPOSSessions();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadPOSSessions = async () => {
    try {
      setLoading(true);
      
      // Since we don't have a dedicated POS sessions table, we'll simulate this data
      // In a real implementation, you'd have a pos_sessions table to track this
      
      // Mock active sessions data
      const mockActiveSessions: POSSession[] = [
        {
          id: "session-1",
          user_id: "user-1",
          username: "jdoe",
          full_name: "John Doe",
          login_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          logout_time: null,
          status: 'active',
          terminal_id: "POS-001",
          store_id: "store-1",
          store_name: "Main Store",
          session_duration: null,
          transactions_count: 12,
          total_sales: 450.50
        },
        {
          id: "session-2",
          user_id: "user-2", 
          username: "msmith",
          full_name: "Mary Smith",
          login_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          logout_time: null,
          status: 'active',
          terminal_id: "POS-002",
          store_id: "store-1",
          store_name: "Main Store",
          session_duration: null,
          transactions_count: 8,
          total_sales: 290.75
        }
      ];

      // Mock recent sessions
      const mockRecentSessions: POSSession[] = [
        {
          id: "session-3",
          user_id: "user-3",
          username: "bwilson",
          full_name: "Bob Wilson",
          login_time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          logout_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          status: 'ended',
          terminal_id: "POS-001",
          store_id: "store-1",
          store_name: "Main Store",
          session_duration: 7 * 60 * 60, // 7 hours
          transactions_count: 25,
          total_sales: 890.25
        }
      ];

      setActiveSessions(mockActiveSessions);
      setRecentSessions(mockRecentSessions);

    } catch (error) {
      console.error('Error loading POS sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load POS sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSessionLogs = async () => {
    try {
      // Mock session activity logs
      const mockLogs = [
        {
          id: "log-1",
          session_id: "session-1",
          username: "jdoe",
          action: "login",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          details: "Logged in from POS-001",
          ip_address: "192.168.1.100"
        },
        {
          id: "log-2", 
          session_id: "session-1",
          username: "jdoe",
          action: "transaction",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          details: "Processed sale: $45.50",
          ip_address: "192.168.1.100"
        },
        {
          id: "log-3",
          session_id: "session-3",
          username: "bwilson", 
          action: "logout",
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          details: "Logged out from POS-001",
          ip_address: "192.168.1.100"
        }
      ];

      setSessionLogs(mockLogs);
    } catch (error) {
      console.error('Error loading session logs:', error);
    }
  };

  const handleForceLogout = async (sessionId: string) => {
    try {
      // In a real implementation, you'd update the session status
      toast({
        title: "Session Ended",
        description: "User has been logged out from POS terminal",
      });
      
      loadPOSSessions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end session",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "Active";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const filteredSessions = [...activeSessions, ...recentSessions].filter(session =>
    session.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.terminal_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Monitor className="h-5 w-5" />
          <span>POS Session Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active Sessions</TabsTrigger>
            <TabsTrigger value="recent">Recent Sessions</TabsTrigger>
            <TabsTrigger value="logs">Session Logs</TabsTrigger>
          </TabsList>

          {/* Active Sessions */}
          <TabsContent value="active" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Currently Active POS Sessions</h3>
              <div className="flex items-center space-x-2">
                <Badge variant="default">{activeSessions.length} Active</Badge>
                <Button variant="outline" size="sm" onClick={loadPOSSessions}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {activeSessions.map((session) => (
                <div key={session.id} className="p-4 border rounded-lg bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <User className="h-8 w-8 text-primary" />
                      <div>
                        <h4 className="font-medium">{session.full_name}</h4>
                        <p className="text-sm text-muted-foreground">@{session.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="mb-2">Active</Badge>
                      <p className="text-sm text-muted-foreground">Terminal: {session.terminal_id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Login Time</p>
                      <p className="font-medium">{formatTime(session.login_time)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">
                        {Math.floor((Date.now() - new Date(session.login_time).getTime()) / (1000 * 60))} min
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="font-medium">{session.transactions_count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sales</p>
                      <p className="font-medium">${session.total_sales.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleForceLogout(session.id)}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Force Logout
                    </Button>
                  </div>
                </div>
              ))}

              {activeSessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active POS sessions</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Recent Sessions */}
          <TabsContent value="recent" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Recent POS Sessions</h3>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sessions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {recentSessions.map((session) => (
                <div key={session.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <User className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{session.full_name}</h4>
                        <p className="text-sm text-muted-foreground">@{session.username}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Ended</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Login</p>
                      <p className="font-medium">{formatTime(session.login_time)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Logout</p>
                      <p className="font-medium">{session.logout_time ? formatTime(session.logout_time) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{formatDuration(session.session_duration)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="font-medium">{session.transactions_count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sales</p>
                      <p className="font-medium">${session.total_sales.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Session Logs */}
          <TabsContent value="logs" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">POS Session Activity Logs</h3>
              <Button variant="outline" size="sm" onClick={loadSessionLogs}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Logs
              </Button>
            </div>

            <div className="space-y-2">
              {sessionLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{log.username} - {log.action}</p>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatTime(log.timestamp)}</p>
                    <p className="text-xs text-muted-foreground">{log.ip_address}</p>
                  </div>
                </div>
              ))}

              {sessionLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No session logs available</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};