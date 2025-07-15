import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditLogItem } from "./AuditLogItem";
import { FileSearch } from "lucide-react";

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

interface AuditLogsListProps {
  logs: AuditLog[];
  loading: boolean;
}

export const AuditLogsList = ({ logs, loading }: AuditLogsListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSearch className="h-5 w-5" />
          Security Events ({logs.length})
        </CardTitle>
        <CardDescription>
          Recent security events and user activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No audit logs found for the selected filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <AuditLogItem key={log.id} log={log} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};