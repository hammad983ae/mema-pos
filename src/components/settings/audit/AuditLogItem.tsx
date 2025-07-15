import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info, Calendar, User, Activity } from "lucide-react";

interface AuditLog {
  id: string;
  event_type: string;
  event_category: string;
  severity: string;
  action_performed: string;
  outcome: string;
  created_at: string;
  user_id: string | null;
  ip_address: unknown;
  resource_accessed: string | null;
  metadata: any;
  pci_relevant: boolean;
  risk_score: number;
}

interface AuditLogItemProps {
  log: AuditLog;
}

export const AuditLogItem = ({ log }: AuditLogItemProps) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive' as const;
      case 'warning':
        return 'outline' as const;
      case 'info':
      default:
        return 'default' as const;
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {getSeverityIcon(log.severity)}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{log.action_performed}</span>
              <Badge variant={getSeverityVariant(log.severity)}>
                {log.severity}
              </Badge>
              {log.pci_relevant && (
                <Badge variant="outline">PCI</Badge>
              )}
              {log.risk_score > 0 && (
                <Badge variant="destructive">Risk: {log.risk_score}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Event: {log.event_type} | Category: {log.event_category}
            </p>
            {log.resource_accessed && (
              <p className="text-sm text-muted-foreground">
                Resource: {log.resource_accessed}
              </p>
            )}
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(log.created_at).toLocaleString()}
          </div>
          {log.ip_address && (
            <div>IP: {String(log.ip_address)}</div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {log.user_id ? `User: ${log.user_id.slice(0, 8)}...` : 'System'}
          </div>
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {log.outcome === 'success' ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <AlertTriangle className="h-3 w-3 text-red-500" />
            )}
            {log.outcome}
          </div>
        </div>
      </div>
    </div>
  );
};