import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  User,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface ManagerApprovalProps {
  isOpen: boolean;
  onClose: () => void;
  saleAmount: number;
  minimumAmount: number;
  onApproved: (approvalMethod: 'code' | 'signin') => void;
  onDenied: () => void;
  employeeName: string;
  items: any[];
}

export const ManagerApprovalDialog = ({
  isOpen,
  onClose,
  saleAmount,
  minimumAmount,
  onApproved,
  onDenied,
  employeeName,
  items
}: ManagerApprovalProps) => {
  const { user } = useAuth();
  const [approvalCode, setApprovalCode] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [approvalMethod, setApprovalMethod] = useState<'code' | 'signin'>('code');
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [requestId, setRequestId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      createApprovalRequest();
    }
  }, [isOpen]);

  const createApprovalRequest = async () => {
    try {
      const { data: userContext } = await supabase.rpc('get_user_business_context');
      if (!userContext?.[0]) return;

      const businessId = userContext[0].business_id;

      // Create approval request
      const { data: request, error } = await supabase
        .from('manager_approval_requests')
        .insert({
          business_id: businessId,
          employee_id: user?.id,
          sale_amount: saleAmount,
          minimum_amount: minimumAmount,
          items_summary: JSON.stringify(items),
          status: 'pending',
          employee_name: employeeName
        })
        .select()
        .single();

      if (error) throw error;
      setRequestId(request.id);

      // Send notification to managers
      await sendManagerNotification(request.id, businessId);

    } catch (error) {
      console.error('Error creating approval request:', error);
      toast.error('Failed to create approval request');
    }
  };

  const sendManagerNotification = async (requestId: string, businessId: string) => {
    try {
      // Get all managers for this business
      const { data: managers } = await supabase
        .from('user_business_memberships')
        .select(`
          user_id,
          profiles!user_business_memberships_user_id_fkey(email, full_name)
        `)
        .eq('business_id', businessId)
        .in('role', ['business_owner', 'manager'])
        .eq('is_active', true);

      if (managers && managers.length > 0) {
        // Generate approval code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Store the code
        await supabase
          .from('manager_approval_requests')
          .update({ approval_code: code })
          .eq('id', requestId);

        // Send notification to first available manager
        const manager = managers[0];
        const profile = manager.profiles as any;
        
        await supabase.functions.invoke('send-manager-approval-notification', {
          body: {
            managerEmail: profile?.email,
            managerName: profile?.full_name,
            employeeName,
            saleAmount,
            minimumAmount,
            approvalCode: code,
            requestId
          }
        });

        setCodeSent(true);
        toast.success('Approval request sent to manager');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification to manager');
    }
  };

  const handleCodeApproval = async () => {
    if (!approvalCode.trim()) {
      toast.error('Please enter the approval code');
      return;
    }

    setIsLoading(true);
    try {
      const { data: request } = await supabase
        .from('manager_approval_requests')
        .select('approval_code, status')
        .eq('id', requestId)
        .single();

      if (request?.approval_code === approvalCode.toUpperCase()) {
        await supabase
          .from('manager_approval_requests')
          .update({ 
            status: 'approved',
            approved_at: new Date().toISOString(),
            approval_method: 'code'
          })
          .eq('id', requestId);

        toast.success('Sale approved successfully!');
        onApproved('code');
        onClose();
      } else {
        toast.error('Invalid approval code');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      toast.error('Failed to verify approval code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManagerSignIn = async () => {
    if (!managerEmail || !managerPassword) {
      toast.error('Please enter manager credentials');
      return;
    }

    setIsLoading(true);
    try {
      // Verify manager credentials
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: managerEmail,
        password: managerPassword
      });

      if (authError) throw authError;

      // Check if user has manager role
      const { data: userContext } = await supabase.rpc('get_user_business_context', {
        user_uuid: authData.user.id
      });

      const hasManagerRole = userContext?.some((ctx: any) => 
        ['business_owner', 'manager'].includes(ctx.user_role)
      );

      if (!hasManagerRole) {
        throw new Error('User does not have manager privileges');
      }

      // Approve the request
      await supabase
        .from('manager_approval_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: authData.user.id,
          approval_method: 'signin'
        })
        .eq('id', requestId);

      toast.success('Sale approved by manager signin!');
      onApproved('signin');
      onClose();

    } catch (error: any) {
      console.error('Error with manager signin:', error);
      toast.error('Manager authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeny = async () => {
    try {
      await supabase
        .from('manager_approval_requests')
        .update({ 
          status: 'denied',
          denied_at: new Date().toISOString()
        })
        .eq('id', requestId);

      toast.error('Sale denied');
      onDenied();
      onClose();
    } catch (error) {
      console.error('Error denying request:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Manager Approval Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sale Details */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>This sale is below the minimum threshold and requires manager approval.</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Sale Amount:</span>
                    <p className="text-lg font-bold text-destructive">${saleAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Minimum Required:</span>
                    <p className="text-lg font-bold">${minimumAmount.toFixed(2)}</p>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Employee:</span> {employeeName}
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Approval Method Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={approvalMethod === 'code' ? 'default' : 'outline'}
                onClick={() => setApprovalMethod('code')}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Approval Code
              </Button>
              <Button
                variant={approvalMethod === 'signin' ? 'default' : 'outline'}
                onClick={() => setApprovalMethod('signin')}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Manager Sign In
              </Button>
            </div>

            {approvalMethod === 'code' && (
              <div className="space-y-3">
                {!codeSent ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Sending approval request to manager...
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-sm text-success">
                      <CheckCircle className="h-4 w-4" />
                      Approval code sent to manager
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="approval-code">Enter Approval Code</Label>
                      <Input
                        id="approval-code"
                        value={approvalCode}
                        onChange={(e) => setApprovalCode(e.target.value.toUpperCase())}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        className="text-center text-lg font-mono"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {approvalMethod === 'signin' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="manager-email">Manager Email</Label>
                  <Input
                    id="manager-email"
                    type="email"
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    placeholder="manager@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager-password">Manager Password</Label>
                  <Input
                    id="manager-password"
                    type="password"
                    value={managerPassword}
                    onChange={(e) => setManagerPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDeny}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Deny Sale
            </Button>
            
            {approvalMethod === 'code' ? (
              <Button
                onClick={handleCodeApproval}
                disabled={isLoading || !codeSent || !approvalCode}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isLoading ? 'Verifying...' : 'Approve with Code'}
              </Button>
            ) : (
              <Button
                onClick={handleManagerSignIn}
                disabled={isLoading || !managerEmail || !managerPassword}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isLoading ? 'Signing In...' : 'Approve with Sign In'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};