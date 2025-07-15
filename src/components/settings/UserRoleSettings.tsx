import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  UserPlus, 
  Mail, 
  Users, 
  Shield, 
  Edit, 
  Trash2,
  Send,
  Copy,
  Loader2,
  CheckCircle,
  Clock,
  Info
} from "lucide-react";
import CreateEmployeeDialog from "@/components/team/CreateEmployeeDialog";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  hired_date: string;
  hourly_rate: number | null;
  commission_type: string;
  base_commission_rate: number | null;
  profiles?: {
    full_name: string;
    email: string;
    phone: string;
    position: string;
  };
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
}

interface UserRoleSettingsProps {
  userRole: string;
}

const UserRoleSettings = ({ userRole }: UserRoleSettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [businessId, setBusinessId] = useState<string>("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: "",
    role: "employee",
    hourlyRate: "",
    message: ""
  });

  const roles = [
    { value: "business_owner", label: "Business Owner", description: "Full access to all features" },
    { value: "manager", label: "Manager", description: "Manage team, schedules, and reports" },
    { value: "employee", label: "Employee", description: "Basic access to POS and personal data" }
  ];

  const isBusinessOwner = userRole === "business_owner";
  const isManager = userRole === "manager" || isBusinessOwner;

  useEffect(() => {
    if (user) {
      fetchTeamData();
    }
  }, [user]);

  const fetchTeamData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get user's business
      const { data: membership } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membership) return;
      
      setBusinessId(membership.business_id);

      // Fetch team members
      const { data: membersData, error: membersError } = await supabase
        .from("user_business_memberships")
        .select(`
          *,
          profiles(full_name, email, phone, position)
        `)
        .eq("business_id", membership.business_id)
        .eq("is_active", true);

      if (membersError) throw membersError;
      setTeamMembers((membersData || []) as any);

      // Fetch pending invitations (mock data for now)
      // In a real app, you'd have a separate invitations table
      setPendingInvitations([]);
      
    } catch (error: any) {
      console.error("Error fetching team data:", error);
      toast({
        title: "Error",
        description: "Failed to load team information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async () => {
    if (!inviteData.email || !businessId) return;

    setSaving(true);
    try {
      // In a real implementation, you would:
      // 1. Create an invitation record in your database
      // 2. Send an email invitation using an edge function
      // 3. Handle the invitation acceptance flow

      // For now, we'll simulate the invitation process
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteData.email}`,
      });

      setInviteData({
        email: "",
        role: "employee",
        hourlyRate: "",
        message: ""
      });
      setShowInviteForm(false);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: "business_owner" | "manager" | "employee") => {
    try {
      const { error } = await supabase
        .from("user_business_memberships")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: "Team member role has been updated successfully.",
      });

      await fetchTeamData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updatePaymentType = async (memberId: string, paymentType: "hourly" | "commission" | "both") => {
    try {
      const { error } = await supabase
        .from("user_business_memberships")
        .update({ commission_type: paymentType })
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Payment Type Updated",
        description: "Team member payment type has been updated successfully.",
      });

      await fetchTeamData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateHourlyRate = async (memberId: string, hourlyRate: number) => {
    try {
      const { error } = await supabase
        .from("user_business_memberships")
        .update({ hourly_rate: hourlyRate })
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Hourly Rate Updated",
        description: "Team member hourly rate has been updated successfully.",
      });

      await fetchTeamData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateCommissionRate = async (memberId: string, commissionRate: number) => {
    try {
      const { error } = await supabase
        .from("user_business_memberships")
        .update({ base_commission_rate: commissionRate })
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Commission Rate Updated",
        description: "Team member commission rate has been updated successfully.",
      });

      await fetchTeamData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deactivateMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to deactivate this team member?")) return;

    try {
      const { error } = await supabase
        .from("user_business_memberships")
        .update({ is_active: false })
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Member Deactivated",
        description: "Team member has been deactivated successfully.",
      });

      await fetchTeamData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Team & Roles</h3>
          <p className="text-sm text-muted-foreground">
            Manage team members and their access levels
          </p>
        </div>
        {isManager && (
          <CreateEmployeeDialog 
            businessId={businessId}
            onEmployeeCreated={fetchTeamData}
            trigger={
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Employee
              </Button>
            }
          />
        )}
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({teamMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">
                    {member.profiles?.full_name || "Unknown User"}
                  </h4>
                  <Badge variant="outline" className="capitalize">
                    {member.role.replace("_", " ")}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">
                    {member.commission_type === "both" ? "Hourly + Commission" : member.commission_type}
                  </Badge>
                  {member.user_id === user?.id && (
                    <Badge variant="default">You</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{member.profiles?.email}</span>
                  {member.profiles?.position && (
                    <span>• {member.profiles.position}</span>
                  )}
                  {member.hourly_rate && (
                    <span>• ${member.hourly_rate}/hr</span>
                  )}
                  {member.base_commission_rate && member.base_commission_rate > 0 && (
                    <span>• {member.base_commission_rate}% commission</span>
                  )}
                </div>
                
                {isManager && member.user_id !== user?.id && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Payment Type</Label>
                      <Select
                        value={member.commission_type || "hourly"}
                        onValueChange={(value) => updatePaymentType(member.id, value as any)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly Only</SelectItem>
                          <SelectItem value="commission">Commission Only</SelectItem>
                          <SelectItem value="both">Hourly + Commission</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {(member.commission_type === "hourly" || member.commission_type === "both") && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Hourly Rate</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="25.00"
                          defaultValue={member.hourly_rate || ""}
                          className="h-8"
                          onBlur={(e) => {
                            const rate = parseFloat(e.target.value);
                            if (rate && rate !== member.hourly_rate) {
                              updateHourlyRate(member.id, rate);
                            }
                          }}
                        />
                      </div>
                    )}
                    
                    {(member.commission_type === "commission" || member.commission_type === "both") && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Base Commission %</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="5.00"
                          defaultValue={member.base_commission_rate || ""}
                          className="h-8"
                          onBlur={(e) => {
                            const rate = parseFloat(e.target.value);
                            if (rate && rate !== member.base_commission_rate) {
                              updateCommissionRate(member.id, rate);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isManager && member.user_id !== user?.id && (
                <div className="flex items-center gap-2">
                  <Select
                    value={member.role}
                    onValueChange={(newRole) => updateMemberRole(member.id, newRole as any)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem 
                          key={role.value} 
                          value={role.value}
                          disabled={role.value === "business_owner" && !isBusinessOwner}
                        >
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deactivateMember(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {teamMembers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h4 className="font-semibold mb-2">No Team Members</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Invite your first team member to get started
              </p>
              {isManager && (
                <CreateEmployeeDialog 
                  businessId={businessId}
                  onEmployeeCreated={fetchTeamData}
                  trigger={
                    <Button className="animate-fade-in">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite First Team Member
                    </Button>
                  }
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{invitation.email}</span>
                    <Badge variant="outline" className="capitalize">
                      {invitation.role.replace("_", " ")}
                    </Badge>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Invited {new Date(invitation.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Invite Form */}
      {showInviteForm && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Team Member</CardTitle>
            <CardDescription>
              Send an invitation to join your team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="colleague@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteRole">Role</Label>
                <Select
                  value={inviteData.role}
                  onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem 
                        key={role.value} 
                        value={role.value}
                        disabled={role.value === "business_owner" && !isBusinessOwner}
                      >
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-xs text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate (Optional)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={inviteData.hourlyRate}
                  onChange={(e) => setInviteData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                  placeholder="25.00"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inviteMessage">Custom Message (Optional)</Label>
              <Textarea
                id="inviteMessage"
                value={inviteData.message}
                onChange={(e) => setInviteData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Welcome to our team! We're excited to have you join us."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={sendInvitation} disabled={saving || !inviteData.email}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowInviteForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role.value} className="flex items-start gap-3 p-3 border rounded-lg">
                <Badge variant="outline" className="mt-0.5 capitalize">
                  {role.label}
                </Badge>
                <div>
                  <p className="text-sm">{role.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRoleSettings;