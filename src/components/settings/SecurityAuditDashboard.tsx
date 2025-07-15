import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AuditFilters } from "./audit/AuditFilters";
import { AuditLogsList } from "./audit/AuditLogsList";

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

interface SecurityAuditDashboardProps {
  userRole: string;
}

const SecurityAuditDashboard = ({ userRole }: SecurityAuditDashboardProps) => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    severity: '',
    outcome: '',
    dateRange: '7',
    pciRelevant: '',
    searchTerm: ''
  });

  const isManager = userRole === "business_owner" || userRole === "manager";

  useEffect(() => {
    const loadAuditLogs = async () => {
      if (!user || !isManager) return;
      
      setLoading(true);
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
          
          // Calculate date range
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - parseInt(filters.dateRange));
          
          // Load audit logs
          const { data: logs, error } = await supabase
            .from('security_audit_logs')
            .select('*')
            .eq('business_id', membership.business_id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: false })
            .limit(100);

          if (error) {
            console.error('Error loading audit logs:', error);
          } else {
            setAuditLogs(logs || []);
          }
        }
      } catch (error) {
        console.error('Error loading audit logs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAuditLogs();
  }, [user, isManager, filters.dateRange]);

  // Apply filters
  useEffect(() => {
    let filtered = [...auditLogs];

    if (filters.category) {
      filtered = filtered.filter(log => log.event_category === filters.category);
    }
    if (filters.severity) {
      filtered = filtered.filter(log => log.severity === filters.severity);
    }
    if (filters.outcome) {
      filtered = filtered.filter(log => log.outcome === filters.outcome);
    }
    if (filters.pciRelevant) {
      filtered = filtered.filter(log => log.pci_relevant === (filters.pciRelevant === 'true'));
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.action_performed.toLowerCase().includes(term) ||
        log.event_type.toLowerCase().includes(term) ||
        (log.resource_accessed && log.resource_accessed.toLowerCase().includes(term))
      );
    }

    setFilteredLogs(filtered);
  }, [auditLogs, filters]);

  const exportAuditLogs = async () => {
    const csvContent = [
      ['Timestamp', 'Event Type', 'Category', 'Severity', 'Action', 'Outcome', 'User ID', 'IP Address', 'PCI Relevant', 'Risk Score'],
      ...filteredLogs.map(log => [
        new Date(log.created_at).toISOString(),
        log.event_type,
        log.event_category,
        log.severity,
        log.action_performed,
        log.outcome,
        log.user_id || 'System',
        String(log.ip_address) || 'N/A',
        log.pci_relevant ? 'Yes' : 'No',
        log.risk_score.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security_audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isManager) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            You don't have permission to view security audit logs.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Security Audit Trail</h3>
        <p className="text-sm text-muted-foreground">
          Monitor and analyze security events and user activities
        </p>
      </div>

      <AuditFilters
        filters={filters}
        onFiltersChange={setFilters}
        onExport={exportAuditLogs}
      />

      <AuditLogsList
        logs={filteredLogs}
        loading={loading}
      />
    </div>
  );
};

export default SecurityAuditDashboard;