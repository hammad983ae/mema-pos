import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Activity, Eye, Clock, User, Plus, Edit, Trash2 } from "lucide-react";

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes_summary: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface ActivityLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId?: string;
  entityType?: string;
}

export const ActivityLogsModal = ({
  isOpen,
  onClose,
  entityId,
  entityType
}: ActivityLogsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchActivityLogs();
    }
  }, [isOpen, entityId, entityType]);

  const fetchActivityLogs = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from("activity_logs")
        .select(`
          id,
          action,
          entity_type,
          entity_id,
          changes_summary,
          created_at,
          user_id
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      // Filter by specific entity if provided
      if (entityId && entityType) {
        query = query.eq("entity_id", entityId).eq("entity_type", entityType);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Fetch user profiles separately
      const logs = data || [];
      const userIds = [...new Set(logs.map(log => log.user_id))];
      
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);
      
      // Map profiles to logs
      const logsWithProfiles = logs.map(log => ({
        ...log,
        profiles: profilesData?.find(p => p.user_id === log.user_id) || null
      }));
      
      setLogs(logsWithProfiles);

    } catch (error: any) {
      console.error("Error fetching activity logs:", error);
      toast({
        title: "Error",
        description: "Failed to load activity logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-success text-success-foreground';
      case 'update': return 'bg-warning text-warning-foreground';
      case 'delete': return 'bg-destructive text-destructive-foreground';
      case 'view': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <Plus className="h-3 w-3" />;
      case 'update': return <Edit className="h-3 w-3" />;
      case 'delete': return <Trash2 className="h-3 w-3" />;
      case 'view': return <Eye className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Logs
            {entityId && (
              <Badge variant="outline" className="ml-2">
                {entityType}: {entityId.slice(0, 8)}...
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Activity List */}
          <div className="space-y-2 max-h-96 overflow-auto">
            {loading ? (
              <div className="text-center py-8">Loading activity logs...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activity logs found
              </div>
            ) : (
              logs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-full ${getActionColor(log.action)}`}>
                          {getActionIcon(log.action)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {log.action.toUpperCase()}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {log.entity_type}
                            </Badge>
                          </div>
                          
                          <div className="text-sm font-medium mb-1">
                            {log.changes_summary}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.profiles?.full_name || 'Unknown User'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(log.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};