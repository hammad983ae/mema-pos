import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  CheckCircle, 
  X, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  User,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';

interface ApprovalRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  sale_amount: number;
  minimum_amount: number;
  items_summary: any;
  status: string;
  created_at: string;
  approval_code?: string;
}

export const ManagerApprovalRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadApprovalRequests();
    setupRealtimeSubscription();
  }, [user]);

  const loadApprovalRequests = async () => {
    if (!user) return;

    try {
      const { data: userContext } = await supabase.rpc('get_user_business_context');
      if (!userContext?.[0]) return;

      const businessId = userContext[0].business_id;

      const { data: approvalRequests, error } = await supabase
        .from('manager_approval_requests')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(approvalRequests || []);
    } catch (error) {
      console.error('Error loading approval requests:', error);
      toast.error('Failed to load approval requests');
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('approval-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'manager_approval_requests'
        },
        () => {
          loadApprovalRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const handleApproval = async (requestId: string, approve: boolean) => {
    try {
      const updateData = approve 
        ? { 
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by: user?.id,
            approval_method: 'manager_dashboard'
          }
        : { 
            status: 'denied',
            denied_at: new Date().toISOString()
          };

      const { error } = await supabase
        .from('manager_approval_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      toast.success(`Request ${approve ? 'approved' : 'denied'} successfully`);
      loadApprovalRequests();

    } catch (error) {
      console.error('Error updating approval request:', error);
      toast.error('Failed to update approval request');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Denied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const recentRequests = requests.slice(0, 10);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests Today</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => 
                    new Date(r.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Request Amount</p>
                <p className="text-2xl font-bold">
                  ${requests.length > 0 
                    ? (requests.reduce((sum, r) => sum + r.sale_amount, 0) / requests.length).toFixed(2)
                    : '0.00'
                  }
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests Alert */}
      {pendingRequests.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {pendingRequests.length} pending approval request{pendingRequests.length > 1 ? 's' : ''} requiring immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Approval Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Manager Approval Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Approval Requests</h3>
              <p className="text-muted-foreground">All sales are meeting minimum requirements.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{request.employee_name}</span>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Sale Amount</p>
                          <p className="font-semibold text-destructive">${request.sale_amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Minimum Required</p>
                          <p className="font-semibold">${request.minimum_amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Difference</p>
                          <p className="font-semibold text-destructive">
                            -${(request.minimum_amount - request.sale_amount).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Requested</p>
                          <p className="text-sm">
                            {new Date(request.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {request.items_summary && (
                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground mb-1">Items:</p>
                          <div className="flex items-center gap-2 text-sm">
                            <ShoppingCart className="h-3 w-3" />
                            <span>
                              {typeof request.items_summary === 'string' 
                                ? JSON.parse(request.items_summary).length 
                                : Array.isArray(request.items_summary) 
                                  ? request.items_summary.length 
                                  : 0
                              } item(s)
                            </span>
                          </div>
                        </div>
                      )}

                      {request.approval_code && request.status === 'pending' && (
                        <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Approval Code:</p>
                          <p className="font-mono text-lg font-bold">{request.approval_code}</p>
                        </div>
                      )}
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproval(request.id, false)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Deny
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproval(request.id, true)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};