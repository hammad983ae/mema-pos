import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Lock, AlertTriangle } from "lucide-react";

interface EmployeePinAuthProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (employee: any) => void;
  businessId: string;
}

export const EmployeePinAuth = ({ isOpen, onClose, onSuccess, businessId }: EmployeePinAuthProps) => {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // First, find the user by username and business membership
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_business_memberships!inner (
            business_id,
            role,
            is_active
          )
        `)
        .eq('username', username.toLowerCase())
        .eq('user_business_memberships.business_id', businessId)
        .eq('user_business_memberships.is_active', true)
        .single();

      if (profileError || !profileData) {
        setError("Employee not found or not authorized for this business");
        return;
      }

      // Check if user has a PIN set up
      if (!profileData.pos_pin) {
        setError("No PIN set up for this employee. Please contact your manager.");
        return;
      }

      // Check rate limiting
      const { data: rateLimitCheck, error: rateLimitError } = await supabase
        .rpc('check_pin_rate_limit', { p_user_id: profileData.user_id });

      if (rateLimitError || !rateLimitCheck) {
        setError("Account temporarily locked due to too many failed attempts. Try again later.");
        return;
      }

      // Verify PIN
      const pinMatches = profileData.pos_pin === pin;

      // Log the attempt
      await supabase.rpc('log_pin_attempt', {
        p_user_id: profileData.user_id,
        p_success: pinMatches,
        p_ip_address: null,
        p_user_agent: navigator.userAgent
      });

      if (!pinMatches) {
        setError("Invalid PIN. Please try again.");
        return;
      }

      // Success - return employee data
      const membershipData = profileData.user_business_memberships?.[0] as any;
      onSuccess({
        id: profileData.user_id,
        username: profileData.username,
        full_name: profileData.full_name,
        position_type: profileData.position_type,
        role: membershipData?.role || 'employee',
        profile: profileData
      });

      toast({
        title: "Access Granted",
        description: `Welcome, ${profileData.full_name || profileData.username}!`,
      });

      // Reset form
      setUsername("");
      setPin("");
      onClose();

    } catch (error: any) {
      console.error("PIN authentication error:", error);
      setError("Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUsername("");
    setPin("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Employee Dashboard Access
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter your 4-digit PIN"
              required
              maxLength={4}
              pattern="[0-9]{4}"
              autoComplete="current-password"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading || !username || !pin}
              className="flex-1"
            >
              <Lock className="h-4 w-4 mr-2" />
              {isLoading ? "Verifying..." : "Access Dashboard"}
            </Button>
            <Button 
              type="button"
              variant="outline" 
              onClick={handleClose}
            >
              Cancel
            </Button>
          </div>
        </form>

        <div className="text-xs text-muted-foreground text-center">
          <p>Enter your username and 4-digit PIN to access your personal dashboard.</p>
          <p className="mt-1">Contact your manager if you need help setting up your PIN.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};