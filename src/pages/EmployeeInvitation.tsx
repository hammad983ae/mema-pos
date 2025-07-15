import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus, Mail, Lock, User } from "lucide-react";

const EmployeeInvitation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const inviteToken = searchParams.get("invite");

  useEffect(() => {
    // If user is already authenticated, process invitation
    if (user && invitationData) {
      processInvitation();
      return;
    }

    // Validate invitation token
    if (!inviteToken) {
      toast({
        title: "Invalid Invitation",
        description: "No invitation code provided. Please check your invitation link.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    // Load invitation details
    loadInvitationData();
  }, [user, inviteToken, navigate, invitationData]);

  const processInvitation = async () => {
    if (!user || !invitationData || !inviteToken) return;

    setLoading(true);
    try {
      // Create business membership
      const { error: membershipError } = await supabase
        .from("user_business_memberships")
        .insert({
          user_id: user.id,
          business_id: invitationData.business_id,
          role: invitationData.role,
          is_active: true
        });

      if (membershipError) throw membershipError;

      // Update user profile with position type if specified for employees
      if (invitationData.role === 'employee' && invitationData.position_type) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ position_type: invitationData.position_type })
          .eq("user_id", user.id);
        
        if (profileError) {
          console.warn("Could not update position type:", profileError);
        }
      }

      // Mark invitation as used
      const { error: updateError } = await supabase
        .from("business_invitations")
        .update({ used_at: new Date().toISOString() })
        .eq("id", invitationData.id);

      if (updateError) throw updateError;

      toast({
        title: "Successfully Joined Team!",
        description: `Welcome to ${invitationData.businesses?.name}`,
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error Joining Team",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInvitationData = async () => {
    if (!inviteToken) return;

    try {
      const { data: invitation, error } = await supabase
        .from("business_invitations")
        .select("*, businesses(name)")
        .eq("invitation_token", inviteToken)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error || !invitation) {
        toast({
          title: "Invalid Invitation",
          description: "This invitation link is invalid or has expired.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setInvitationData(invitation);
      setFormData(prev => ({ ...prev, email: invitation.email }));

      // Check if user already exists
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser.user && authUser.user.email === invitation.email) {
        setIsExistingUser(true);
      }
    } catch (error) {
      console.error("Error loading invitation:", error);
      toast({
        title: "Error",
        description: "Failed to load invitation details.",
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const handleSignUp = async () => {
    if (!invitationData || !formData.fullName.trim() || !formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(
        formData.email,
        formData.password,
        {
          full_name: formData.fullName
        },
        `${window.location.origin}/join?invite=${inviteToken}`
      );

      if (error) {
        toast({
          title: "Signup Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account, then you'll be automatically added to the team.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please enter your email and password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // User will be redirected automatically after successful sign in
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!invitationData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            
            <div className="flex items-center justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Join {invitationData.businesses?.name}</h1>
            <p className="text-muted-foreground">
              You've been invited to join the team. {isExistingUser ? "Sign in" : "Create your account"} to get started.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{isExistingUser ? "Welcome Back!" : "Create Your Account"}</CardTitle>
              <CardDescription>
                {isExistingUser 
                  ? "Sign in to join your new team"
                  : "Enter your details to create your account and join the team"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isExistingUser && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter your full name"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    className="pl-10"
                    disabled={!!invitationData?.email}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter your password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {!isExistingUser && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm your password"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <Button 
                onClick={isExistingUser ? handleSignIn : handleSignUp}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Processing..." : (isExistingUser ? "Sign In & Join Team" : "Create Account & Join Team")}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                {isExistingUser ? (
                  <p>
                    Don't have an account?{" "}
                    <button
                      onClick={() => setIsExistingUser(false)}
                      className="text-primary hover:underline"
                    >
                      Create one
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{" "}
                    <button
                      onClick={() => setIsExistingUser(true)}
                      className="text-primary hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeInvitation;