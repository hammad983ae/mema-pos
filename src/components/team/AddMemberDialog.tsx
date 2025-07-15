import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Mail, Copy, Check } from "lucide-react";

interface AddMemberDialogProps {
  userRole: string;
  onMemberAdded?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AddMemberDialog = ({ userRole, onMemberAdded, open: externalOpen, onOpenChange: externalOnOpenChange }: AddMemberDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use external open state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [newMemberData, setNewMemberData] = useState({
    email: "",
    fullName: "",
    role: "employee" as "employee" | "manager" | "business_owner" | "office",
    position: "",
    positionType: "" as "opener" | "upseller" | "",
  });
  const [loading, setLoading] = useState(false);
  const [invitationCode, setInvitationCode] = useState("");
  const [copied, setCopied] = useState(false);

  const canAddMembers = userRole === 'business_owner' || userRole === 'manager' || userRole === 'office';

  const fetchInvitationCode = async () => {
    if (!user) return;

    try {
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      const { data: businessData } = await supabase
        .from("businesses")
        .select("invitation_code")
        .eq("id", membershipData.business_id)
        .single();

      if (businessData) {
        setInvitationCode(businessData.invitation_code);
      }
    } catch (error) {
      console.error("Error fetching invitation code:", error);
    }
  };

  const handleAddMember = async () => {
    if (!user || !newMemberData.email || !newMemberData.fullName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate position type for employees
    if (newMemberData.role === "employee" && !newMemberData.positionType) {
      toast({
        title: "Missing Employee Type",
        description: "Please select the employee type (Opener or Upseller)",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Get user's business context
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) {
        throw new Error("User not associated with any business");
      }

      // Call the edge function to create the invitation
      const { data, error } = await supabase.functions.invoke('create-employee-invitation', {
        body: {
          businessId: membershipData.business_id,
          email: newMemberData.email,
          fullName: newMemberData.fullName,
          role: newMemberData.role,
          positionType: newMemberData.role === "employee" ? newMemberData.positionType : null
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${newMemberData.email}. They will receive an email with instructions to join your team.`,
      });

      // Clear form
      setNewMemberData({
        email: "",
        fullName: "",
        role: "employee",
        position: "",
        positionType: "",
      });

      if (onMemberAdded) {
        onMemberAdded();
      }

      setOpen(false);
    } catch (error) {
      console.error("Error adding member:", error);
      toast({
        title: "Error",
        description: "Failed to prepare member invitation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInvitationCode = async () => {
    try {
      await navigator.clipboard.writeText(invitationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Invitation code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy invitation code",
        variant: "destructive",
      });
    }
  };

  if (!canAddMembers) {
    return (
      <Button size="sm" disabled className="flex-1 sm:flex-none">
        <Plus className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Add Member</span>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex-1 sm:flex-none" onClick={fetchInvitationCode}>
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Add Member</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Team Member
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {invitationCode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Business Invitation Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Input value={invitationCode} readOnly className="font-mono" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyInvitationCode}
                    className="flex items-center gap-2"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this code with new team members. They can use it during signup to join your business.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="member@example.com"
                value={newMemberData.email}
                onChange={(e) => setNewMemberData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={newMemberData.fullName}
                onChange={(e) => setNewMemberData(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                placeholder="Sales Associate"
                value={newMemberData.position}
                onChange={(e) => setNewMemberData(prev => ({ ...prev, position: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select 
                value={newMemberData.role} 
                onValueChange={(value: "employee" | "manager" | "business_owner" | "office") => 
                  setNewMemberData(prev => ({ ...prev, role: value, positionType: value === "employee" ? prev.positionType : "" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  {userRole === 'business_owner' && (
                    <SelectItem value="business_owner">Business Owner</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Position Type Selection - Only show for employees */}
            {newMemberData.role === "employee" && (
              <div>
                <Label htmlFor="positionType">Employee Type</Label>
                <Select 
                  value={newMemberData.positionType} 
                  onValueChange={(value: "opener" | "upseller") => 
                    setNewMemberData(prev => ({ ...prev, positionType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opener">Opener</SelectItem>
                    <SelectItem value="upseller">Upseller</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose the employee's specialization for sales tracking and commission calculation
                </p>
              </div>
            )}

            <Button 
              onClick={handleAddMember} 
              disabled={loading || !newMemberData.email || !newMemberData.fullName}
              className="w-full"
            >
              <Mail className="h-4 w-4 mr-2" />
              {loading ? "Processing..." : "Prepare Invitation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};