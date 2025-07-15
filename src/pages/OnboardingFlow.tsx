import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  UserPlus, 
  Mail, 
  Key,
  CheckCircle,
  ArrowRight,
  Users,
  LogOut
} from "lucide-react";

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, hasBusinessAssociation, signOut, refreshBusinessAssociation } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"choice" | "create" | "join">("choice");
  
  // Check if user came from invitation (they should go to join flow)
  const fromInvitation = searchParams.get("from") === "invitation";
  
  // Business creation form
  const [businessData, setBusinessData] = useState({
    name: "",
    address: "",
    phone: "",
    email: ""
  });

  // Join business form
  const [joinData, setJoinData] = useState({
    invitationCode: ""
  });

  useEffect(() => {
    // If user already has business association, redirect to main app
    if (user && hasBusinessAssociation) {
      navigate("/");
      return;
    }

    // Check for invitation token in URL
    const token = searchParams.get("invite");
    if (token) {
      setJoinData({ invitationCode: token });
      setStep("join");
    }
  }, [user, hasBusinessAssociation, navigate, searchParams]);

  const handleCreateBusiness = async () => {
    if (!user || !businessData.name.trim()) return;

    setLoading(true);
    try {
      // Create business
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .insert({
          name: businessData.name.trim(),
          address: businessData.address.trim() || null,
          phone: businessData.phone.trim() || null,
          email: businessData.email.trim() || null,
          owner_user_id: user.id,
          invitation_code: crypto.randomUUID().substring(0, 8).toUpperCase()
        })
        .select()
        .single();

      if (businessError) throw businessError;

      // Business membership is automatically created by database trigger

      // Create default store
      const { error: storeError } = await supabase
        .from("stores")
        .insert({
          business_id: business.id,
          name: `${business.name} - Main Store`,
          address: businessData.address.trim() || null,
          phone: businessData.phone.trim() || null,
          is_active: true
        });

      if (storeError) throw storeError;

      toast({
        title: "Business Created Successfully!",
        description: "Welcome to your new business dashboard.",
      });

      // Refresh business association status
      await refreshBusinessAssociation();
      
      // Force navigation to main app
      navigate("/", { replace: true });
    } catch (error: any) {
      toast({
        title: "Error Creating Business",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinBusiness = async () => {
    if (!user || !joinData.invitationCode.trim()) return;

    setLoading(true);
    try {
      // Find invitation
      const { data: invitation, error: inviteError } = await supabase
        .from("business_invitations")
        .select("*, businesses(name)")
        .eq("invitation_token", joinData.invitationCode.trim())
        .eq("email", user.email)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (inviteError || !invitation) {
        throw new Error("Invalid or expired invitation code");
      }

      // Create business membership
      const { error: membershipError } = await supabase
        .from("user_business_memberships")
        .insert({
          user_id: user.id,
          business_id: invitation.business_id,
          role: invitation.role,
          is_active: true
        });

      if (membershipError) throw membershipError;

      // Update user profile with position type if specified for employees
      if (invitation.role === 'employee' && invitation.position_type) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ position_type: invitation.position_type })
          .eq("user_id", user.id);
        
        if (profileError) {
          console.warn("Could not update position type:", profileError);
        }
      }

      // Mark invitation as used
      const { error: updateError } = await supabase
        .from("business_invitations")
        .update({ used_at: new Date().toISOString() })
        .eq("id", invitation.id);

      if (updateError) throw updateError;

      toast({
        title: "Successfully Joined Business!",
        description: `Welcome to ${invitation.businesses?.name}`,
      });

      // Refresh business association status
      await refreshBusinessAssociation();

      // Force navigation to main app
      navigate("/", { replace: true });
    } catch (error: any) {
      toast({
        title: "Error Joining Business",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold mb-2">Welcome to Mema!</h1>
              <p className="text-muted-foreground">
                Let's get your business set up and ready to go.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => signOut().then(() => navigate("/auth"))}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>

          {step === "choice" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {!fromInvitation && (
                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStep("create")}>
                  <CardHeader className="text-center">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <CardTitle>Create New Business</CardTitle>
                    <CardDescription>
                      Start fresh with a new business profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Badge variant="outline">Business Owner</Badge>
                  </CardContent>
                </Card>
              )}

              <Card className={`cursor-pointer hover:shadow-lg transition-shadow ${fromInvitation ? 'md:col-span-2' : ''}`} onClick={() => setStep("join")}>
                <CardHeader className="text-center">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <CardTitle>Join Existing Business</CardTitle>
                  <CardDescription>
                    Join a business using an invitation code
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Badge variant="outline">Team Member</Badge>
                </CardContent>
              </Card>
            </div>
          )}

          {step === "create" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Create Your Business
                </CardTitle>
                <CardDescription>
                  Enter your business information to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={businessData.name}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your business name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Input
                    id="businessAddress"
                    value={businessData.address}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter your business address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessPhone">Phone Number</Label>
                    <Input
                      id="businessPhone"
                      value={businessData.phone}
                      onChange={(e) => setBusinessData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Business Email</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      value={businessData.email}
                      onChange={(e) => setBusinessData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="business@example.com"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("choice")}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleCreateBusiness} 
                    disabled={loading || !businessData.name.trim()}
                    className="flex-1"
                  >
                    {loading ? "Creating..." : "Create Business"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "join" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Join Existing Business
                </CardTitle>
                <CardDescription>
                  Enter the invitation code provided by your business owner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invitationCode">Invitation Code *</Label>
                  <Input
                    id="invitationCode"
                    value={joinData.invitationCode}
                    onChange={(e) => setJoinData(prev => ({ ...prev, invitationCode: e.target.value.toUpperCase() }))}
                    placeholder="Enter invitation code"
                    className="text-center text-lg tracking-widest"
                    required
                  />
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Don't have an invitation code?</p>
                      <p className="text-muted-foreground">
                        Ask your business owner or manager to send you an invitation to your email address.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("choice")}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleJoinBusiness} 
                    disabled={loading || !joinData.invitationCode.trim()}
                    className="flex-1"
                  >
                    {loading ? "Joining..." : "Join Business"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;