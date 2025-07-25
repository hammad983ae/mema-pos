import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Building2,
  MapPin,
  Clock,
  Bell,
  CreditCard,
  Shield,
  Mail,
  Phone,
  Globe,
  Key,
  AlertCircle,
  CheckCircle,
  Settings as SettingsIcon,
  ArrowLeft,
  Copy,
  Percent,
  ShoppingCart,
  Settings as SettingsGear,
  BarChart3,
} from "lucide-react";
import StoreLocationSettings from "@/components/settings/StoreLocationSettings";
import UserRoleSettings from "@/components/settings/UserRoleSettings";
import PaymentSettings from "@/components/settings/PaymentSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { EmployeePasswordReset } from "@/components/admin/EmployeePasswordReset";
import { POSCredentials } from "@/components/pos/POSCredentials";
import { TaxSettings } from "@/components/settings/TaxSettings";
import { POSSettings } from "@/components/settings/POSSettings";

interface Profile {
  full_name: string;
  email: string;
  username?: string;
  phone: string;
  position: string;
  avatar_url: string;
  pos_pin?: string;
}

interface Business {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  subscription_plan: string;
  subscription_status: string;
}

interface UserBusinessMembership {
  role: string;
  business_id: string;
  is_active: boolean;
}

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [invitationCode, setInvitationCode] = useState<string>("");
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    email: "",
    phone: "",
    position: "",
    avatar_url: "",
  });
  const [business, setBusiness] = useState<Business | null>(null);
  const [membership, setMembership] = useState<UserBusinessMembership | null>(
    null,
  );
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    scheduleReminders: true,
    goalAlerts: true,
    eodReports: true,
  });

  const timezones = [
    { value: "America/New_York", label: "Eastern Time (EST/EDT)" },
    { value: "America/Chicago", label: "Central Time (CST/CDT)" },
    { value: "America/Denver", label: "Mountain Time (MST/MDT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PST/PDT)" },
    { value: "America/Anchorage", label: "Alaska Time (AKST/AKDT)" },
    { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
  ];

  const subscriptionPlans = [
    {
      value: "starter",
      label: "Starter - $29/month",
      description: "Basic features for small teams",
    },
    {
      value: "professional",
      label: "Professional - $79/month",
      description: "Advanced features for growing businesses",
    },
    {
      value: "enterprise",
      label: "Enterprise - $199/month",
      description: "Full feature set for large organizations",
    },
  ];

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || "",
          email: profileData.email || user.email || "",
          username: profileData.username || "",
          phone: profileData.phone || "",
          position: profileData.position || "",
          avatar_url: profileData.avatar_url || "",
          pos_pin: profileData.pos_pin ? "****" : "",
        });
      }

      // Fetch business membership and invitation code
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("*, businesses(*)")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (membershipData) {
        setMembership(membershipData);
        setBusiness(membershipData.businesses);
        // Set invitation code if user is business owner or manager
        if (
          membershipData.businesses?.invitation_code &&
          (membershipData.role === "business_owner" ||
            membershipData.role === "manager")
        ) {
          setInvitationCode(membershipData.businesses.invitation_code);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          position: profile.position,
          avatar_url: profile.avatar_url,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBusiness = async () => {
    if (!business || !membership || membership.role === "employee") return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          name: business.name,
          email: business.email,
          phone: business.phone,
          address: business.address,
        })
        .eq("id", business.id);

      if (error) throw error;

      toast({
        title: "Business Updated",
        description: "Business information has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionManagement = () => {
    // This would integrate with your payment provider (Stripe, etc.)
    toast({
      title: "Subscription Management",
      description: "Redirecting to subscription management portal...",
    });
  };
  // Role-based access control
  const isBusinessOwner = membership?.role === "business_owner";
  const isManager = membership?.role === "manager";
  const isOffice = membership?.role === "office";
  const hasBusinessAccess = isBusinessOwner || isManager || isOffice;
  const hasFullAccess = isBusinessOwner || isOffice;
  const isEmployee =
    membership?.role === "employee" || membership?.role === "salesperson";

  const copyInvitationCode = async () => {
    if (!invitationCode) return;

    try {
      await navigator.clipboard.writeText(invitationCode);
      toast({
        title: "Copied!",
        description: "Invitation code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please manually copy the code",
        variant: "destructive",
      });
    }
  };

  const goToDashboard = () => {
    // Route based on user role
    if (membership?.role === "business_owner") {
      navigate("/dashboard");
    } else if (membership?.role === "manager") {
      navigate("/manager");
    } else {
      navigate("/employee");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToDashboard}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>

            {/* Invitation Code for Managers */}
            {hasBusinessAccess && invitationCode && (
              <div className="flex items-center gap-2">
                <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Invitation Code:
                    </span>
                    <code className="font-mono text-sm font-medium">
                      {invitationCode}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyInvitationCode}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your account, business, and notification preferences
          </p>
        </div>

        <Tabs className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:w-64 space-y-2">
              <TabsList className="flex flex-col h-auto bg-transparent p-0 space-y-2">
                <div className="space-y-1 w-full">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Personal
                  </h3>
                  <TabsTrigger
                    value="profile"
                    className="w-full justify-start gap-2 h-10 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="w-full justify-start gap-2 h-10 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Shield className="h-4 w-4" />
                    Security
                  </TabsTrigger>
                  <TabsTrigger
                    value="pos"
                    className="w-full justify-start gap-2 h-10 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    POS Terminal
                  </TabsTrigger>
                  <TabsTrigger
                    value="notifications"
                    className="w-full justify-start gap-2 h-10 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Bell className="h-4 w-4" />
                    Notifications
                  </TabsTrigger>
                </div>

                {/* Business Section - Only for managers and above */}
                {hasBusinessAccess && (
                  <div className="space-y-1 w-full">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Business
                    </h3>
                    {business && hasFullAccess && (
                      <TabsTrigger
                        value="business"
                        className="w-full justify-start gap-2 h-10 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <Building2 className="h-4 w-4" />
                        Business Info
                      </TabsTrigger>
                    )}
                    <TabsTrigger
                      value="locations"
                      className="w-full justify-start gap-2 h-10 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <MapPin className="h-4 w-4" />
                      Locations
                    </TabsTrigger>
                    <TabsTrigger
                      value="team"
                      className="w-full justify-start gap-2 h-10 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <User className="h-4 w-4" />
                      Team & Roles
                    </TabsTrigger>
                    <Button
                      variant="ghost"
                      onClick={() => navigate("/store-management")}
                      className="w-full justify-start gap-2 h-10 px-3 text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Building2 className="h-4 w-4" />
                      Store Management
                    </Button>

                    {/* Payment and Subscription - Business Owner Only */}
                    {isBusinessOwner && (
                      <>
                        <TabsTrigger
                          value="payments"
                          className="w-full justify-start gap-2 h-10 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          <CreditCard className="h-4 w-4" />
                          Payments
                        </TabsTrigger>
                        <TabsTrigger
                          value="subscription"
                          className="w-full justify-start gap-2 h-10 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          <CreditCard className="h-4 w-4" />
                          Subscription
                        </TabsTrigger>
                      </>
                    )}
                  </div>
                )}

                {hasBusinessAccess && <Separator className="my-4" />}

                {/* System Section - Only for managers and above */}
                {hasBusinessAccess && (
                  <div className="space-y-1 w-full">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      System
                    </h3>
                    <TabsTrigger
                      value="system"
                      className="w-full justify-start gap-2 h-10 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <SettingsIcon className="h-4 w-4" />
                      System Settings
                    </TabsTrigger>

                    {/* POS Settings - Business owners and office access */}
                    {(isBusinessOwner || isOffice) && (
                      <TabsTrigger
                        value="pos-settings"
                        className="w-full justify-start gap-2 h-10 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <SettingsGear className="h-4 w-4" />
                        POS Configuration
                      </TabsTrigger>
                    )}

                    {/* Tax Settings - Office access only */}
                    {isOffice && (
                      <TabsTrigger
                        value="tax"
                        className="w-full justify-start gap-2 h-10 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <Percent className="h-4 w-4" />
                        Tax Settings
                      </TabsTrigger>
                    )}
                  </div>
                )}
              </TabsList>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {/* Profile Tab */}
              <TabsContent value="profile">
                <div className="space-y-6">
                  <ProfileEditor />
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <div className="space-y-6">
                  {/* Only show password management for business owners */}
                  {isBusinessOwner && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Password Management
                        </CardTitle>
                        <CardDescription>
                          Manage your account password for online access and
                          subscriptions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <Alert>
                          <Key className="h-4 w-4" />
                          <AlertDescription>
                            This password is used for online access to manage
                            subscriptions and support. Employees use PIN-based
                            authentication for POS access.
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword">
                              Current Password
                            </Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) =>
                                setPasswordData((prev) => ({
                                  ...prev,
                                  currentPassword: e.target.value,
                                }))
                              }
                              placeholder="Enter current password"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) =>
                                setPasswordData((prev) => ({
                                  ...prev,
                                  newPassword: e.target.value,
                                }))
                              }
                              placeholder="Enter new password"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                              Confirm New Password
                            </Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) =>
                                setPasswordData((prev) => ({
                                  ...prev,
                                  confirmPassword: e.target.value,
                                }))
                              }
                              placeholder="Confirm new password"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                          <Button
                            onClick={updatePassword}
                            disabled={loading}
                            variant="default"
                          >
                            {loading ? "Updating..." : "Update Password"}
                          </Button>
                          <Button onClick={() => signOut()} variant="outline">
                            Sign Out
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Employee Password Reset - Only for owners/managers */}
                  {hasBusinessAccess && <EmployeePasswordReset />}
                </div>
              </TabsContent>

              {/* POS Terminal Tab */}
              <TabsContent value="pos">
                <div className="space-y-6">
                  {isBusinessOwner || isManager || isOffice ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ShoppingCart className="h-5 w-5" />
                          POS Terminal Access
                        </CardTitle>
                        <CardDescription>
                          Access the Point of Sale system for processing
                          transactions and managing sales.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <Alert>
                          <ShoppingCart className="h-4 w-4" />
                          <AlertDescription>
                            As a manager or owner, you have direct access to the
                            POS terminal. Employee POS credentials can be
                            managed in Store Management.
                          </AlertDescription>
                        </Alert>

                        <div className="flex flex-col gap-4">
                          <Button
                            onClick={async () => {
                              try {
                                console.log(
                                  "Creating POS session for settings access...",
                                );

                                // Get user's business context
                                const { data: membership } = await supabase
                                  .from("user_business_memberships")
                                  .select(
                                    `
                                role,
                                business_id,
                                businesses!inner(
                                  id,
                                  name,
                                  stores!inner(
                                    id,
                                    name,
                                    status
                                  )
                                )
                              `,
                                  )
                                  .eq("user_id", user!.id)
                                  .eq("is_active", true)
                                  .single();

                                if (!membership) {
                                  console.log("No membership found");
                                  navigate("/pos/login");
                                  return;
                                }

                                console.log("Membership:", membership);

                                // Find an active store
                                const activeStore =
                                  membership.businesses.stores.find(
                                    (store) => store.status === "active",
                                  );
                                if (!activeStore) {
                                  console.log("No active store found");
                                  toast({
                                    title: "No Active Store",
                                    description:
                                      "No active store found. Please contact your administrator.",
                                    variant: "destructive",
                                  });
                                  return;
                                }

                                console.log("Active store:", activeStore);

                                // Get or create store day session
                                const {
                                  data: daySessionData,
                                  error: sessionError,
                                } = await supabase.rpc(
                                  "get_or_create_store_day_session",
                                  {
                                    p_store_id: activeStore.id,
                                    p_opened_by: user!.id,
                                    p_opening_cash_amount: 0.0,
                                  },
                                );

                                if (sessionError) {
                                  console.error(
                                    "Day session error:",
                                    sessionError,
                                  );
                                  toast({
                                    title: "Error",
                                    description:
                                      "Failed to access store session. Please try again.",
                                    variant: "destructive",
                                  });
                                  return;
                                }

                                const daySession = daySessionData[0];
                                console.log(
                                  "Day session created/found:",
                                  daySession,
                                );

                                // Store POS session with day session info
                                const sessionData = {
                                  store: {
                                    id: activeStore.id,
                                    name: activeStore.name,
                                    business_id: membership.business_id,
                                  },
                                  daySession: {
                                    id: daySession.session_id,
                                    sessionDate: daySession.session_date,
                                    openedAt: daySession.opened_at,
                                    openedByName: daySession.opened_by_name,
                                    isNewSession: daySession.is_new_session,
                                  },
                                  user: {
                                    id: user!.id,
                                    name:
                                      profile?.full_name ||
                                      profile?.username ||
                                      user!.email,
                                    username: profile?.username || user!.email,
                                    role: membership.role,
                                  },
                                  loginAt: new Date().toISOString(),
                                };

                                localStorage.setItem(
                                  "pos_session",
                                  JSON.stringify(sessionData),
                                );
                                console.log("Saved POS Session:", sessionData);

                                navigate("/pos");
                              } catch (error) {
                                console.error(
                                  "Error creating POS session:",
                                  error,
                                );
                                toast({
                                  title: "Error",
                                  description:
                                    "Failed to access POS. Please try again.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            size="lg"
                            className="w-full sm:w-auto"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Open POS Terminal
                          </Button>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              variant="outline"
                              onClick={() => navigate("/store-management")}
                              className="w-full sm:w-auto"
                            >
                              <SettingsGear className="h-4 w-4 mr-2" />
                              Manage Store Credentials
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => navigate("/pos/dashboard")}
                              className="w-full sm:w-auto"
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              POS Dashboard
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <POSCredentials />
                  )}
                </div>
              </TabsContent>

              {/* Business Tab */}
              {business && (
                <TabsContent value="business">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Business Information
                      </CardTitle>
                      <CardDescription>
                        {hasBusinessAccess
                          ? "Manage business details and settings"
                          : "View your business information"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="businessName">Business Name</Label>
                          <Input
                            id="businessName"
                            value={business.name}
                            onChange={(e) =>
                              setBusiness((prev) =>
                                prev ? { ...prev, name: e.target.value } : null,
                              )
                            }
                            disabled={!hasBusinessAccess}
                            placeholder="Business name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessEmail">Business Email</Label>
                          <Input
                            id="businessEmail"
                            type="email"
                            value={business.email || ""}
                            onChange={(e) =>
                              setBusiness((prev) =>
                                prev
                                  ? { ...prev, email: e.target.value }
                                  : null,
                              )
                            }
                            disabled={!hasBusinessAccess}
                            placeholder="business@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessPhone">Business Phone</Label>
                          <Input
                            id="businessPhone"
                            type="tel"
                            value={business.phone || ""}
                            onChange={(e) =>
                              setBusiness((prev) =>
                                prev
                                  ? { ...prev, phone: e.target.value }
                                  : null,
                              )
                            }
                            disabled={!hasBusinessAccess}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="timezone">Timezone</Label>
                          <Select disabled={!hasBusinessAccess}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                              {timezones.map((tz) => (
                                <SelectItem key={tz.value} value={tz.value}>
                                  {tz.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="businessAddress">
                          Business Address
                        </Label>
                        <Textarea
                          id="businessAddress"
                          value={business.address || ""}
                          onChange={(e) =>
                            setBusiness((prev) =>
                              prev
                                ? { ...prev, address: e.target.value }
                                : null,
                            )
                          }
                          disabled={!hasBusinessAccess}
                          placeholder="123 Main St, City, State 12345"
                          rows={3}
                        />
                      </div>

                      {hasBusinessAccess && (
                        <Button
                          onClick={() => {
                            console.log("Update Business button clicked");
                            updateBusiness();
                          }}
                          disabled={loading}
                        >
                          {loading ? "Updating..." : "Update Business"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* New Tabs */}
              <TabsContent value="locations">
                <StoreLocationSettings />
              </TabsContent>

              <TabsContent value="team">
                <UserRoleSettings />
              </TabsContent>

              <TabsContent value="payments">
                <PaymentSettings />
              </TabsContent>

              <TabsContent value="notifications">
                <NotificationSettings />
              </TabsContent>

              <TabsContent value="system">
                <SecuritySettings />
              </TabsContent>

              {/* POS Settings Tab - Business owners and office access */}
              {(isBusinessOwner || isOffice) && (
                <TabsContent value="pos-settings">
                  <POSSettings />
                </TabsContent>
              )}

              {/* Tax Settings Tab - Office access only */}
              {isOffice && (
                <TabsContent value="tax">
                  <TaxSettings />
                </TabsContent>
              )}

              {/* Subscription Tab */}
              {isBusinessOwner && (
                <TabsContent value="subscription">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Subscription Management
                      </CardTitle>
                      <CardDescription>
                        Manage your business subscription and billing
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {business && (
                        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                          <div>
                            <h3 className="font-semibold capitalize">
                              {business.subscription_plan} Plan
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Status:{" "}
                              <Badge
                                variant={
                                  business.subscription_status === "active"
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {business.subscription_status}
                              </Badge>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Next billing date
                            </p>
                            <p className="font-semibold">January 15, 2024</p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <h4 className="font-semibold">Available Plans</h4>
                        <div className="grid gap-4">
                          {subscriptionPlans.map((plan) => (
                            <div
                              key={plan.value}
                              className={`p-4 border rounded-lg ${
                                business?.subscription_plan === plan.value
                                  ? "border-primary bg-primary-light"
                                  : "border-border"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium">{plan.label}</h5>
                                  <p className="text-sm text-muted-foreground">
                                    {plan.description}
                                  </p>
                                </div>
                                {business?.subscription_plan === plan.value && (
                                  <Badge>Current Plan</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-4">
                        <Button
                          onClick={() => {
                            console.log("Manage Subscription button clicked");
                            handleSubscriptionManagement();
                          }}
                        >
                          Manage Subscription
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            console.log("Download Invoice button clicked");
                            toast({
                              title: "Feature Coming Soon",
                              description:
                                "Invoice download feature will be available soon.",
                            });
                          }}
                        >
                          Download Invoice
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            console.log("Billing History button clicked");
                            toast({
                              title: "Feature Coming Soon",
                              description:
                                "Billing history feature will be available soon.",
                            });
                          }}
                        >
                          Billing History
                        </Button>
                      </div>

                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Changes to your subscription will take effect at the
                          next billing cycle. Contact support for immediate
                          changes or cancellations.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
