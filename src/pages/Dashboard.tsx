import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "@/components/realtime/NotificationBell";
import { UserPresence } from "@/components/realtime/UserPresence";
import { useRealtimeContext } from "@/components/realtime/RealtimeProvider";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Building2,
  Clock,
  LogOut,
  Package,
  Plus,
  Settings,
  ShoppingCart,
  Store,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import {
  CREATE_STORE_SESSION,
  Mutation,
  MutationCreateStoreSessionArgs,
  UserRole,
  Query,
  QueryGetBusinessStatsArgs,
  GET_BUSINESS_STATS,
} from "@/graphql";
import { useMutation, useQuery } from "@apollo/client";

const Dashboard = () => {
  const { user, business, signOut } = useAuth();
  const { businessId, isConnected, connectionStatus } = useRealtimeContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [businessInfo, setBusinessInfo] = useState<any>(null);
  const { data: statsData, loading } = useQuery<
    Query,
    QueryGetBusinessStatsArgs
  >(GET_BUSINESS_STATS, {
    variables: { id: business?.id },
    skip: !business?.id,
    fetchPolicy: "network-only",
  });
  const [createStoreSession, { loading: creatingSession }] = useMutation<
    Mutation,
    MutationCreateStoreSessionArgs
  >(CREATE_STORE_SESSION);

  const handleSignOut = async () => {
    await signOut();
  };

  const handlePOSAccess = async () => {
    // Check if user is authorized for direct POS access
    const isAuthorized =
      user.role === UserRole.BusinessOwner ||
      user.role === UserRole.Manager ||
      user.role === UserRole.Office;

    if (!isAuthorized) {
      navigate("/pos/login");
      return;
    }

    try {
      // Find an active store
      // const activeStore = membership.businesses.stores.find(
      //   (store) => store.status === "active",
      // );
      // if (!activeStore) {
      //   toast({
      //     title: "No Active Store",
      //     description:
      //       "No active store found. Please contact your administrator.",
      //     variant: "destructive",
      //   });
      //   return;
      // }

      // Get or create store day session
      // const { data: daySessionData, error: sessionError } = await supabase.rpc(
      //   "get_or_create_store_day_session",
      //   {
      //     p_store_id: activeStore.id,
      //     p_opened_by: user!.id,
      //     p_opening_cash_amount: 0.0,
      //   },
      // );
      //
      // if (sessionError) {
      //   console.error("Day session error:", sessionError);
      //   toast({
      //     title: "Error",
      //     description: "Failed to access store session. Please try again.",
      //     variant: "destructive",
      //   });
      //   return;
      // }
      //
      // const daySession = daySessionData[0];
      //
      // // Get user profile
      // const { data: profile } = await supabase
      //   .from("profiles")
      //   .select("*")
      //   .eq("user_id", user!.id)
      //   .single();
      //
      // // Store POS session with day session info
      // localStorage.setItem(
      //   "pos_session",
      //   JSON.stringify({
      //     store: {
      //       id: activeStore.id,
      //       name: activeStore.name,
      //       business_id: membership.business_id,
      //     },
      //     daySession: {
      //       id: daySession.session_id,
      //       sessionDate: daySession.session_date,
      //       openedAt: daySession.opened_at,
      //       openedByName: daySession.opened_by_name,
      //       isNewSession: daySession.is_new_session,
      //     },
      //     user: {
      //       id: user!.id,
      //       name: profile?.full_name || profile?.username || user!.email,
      //       username: profile?.username || user!.email,
      //       role: membership.role,
      //     },
      //     loginAt: new Date().toISOString(),
      //   }),
      // );
      //
      // const welcomeMessage = daySession.is_new_session
      //   ? `Store opened for the day`
      //   : `Welcome back! Store opened earlier by ${daySession.opened_by_name}`;
      //
      // toast({
      //   title: welcomeMessage,
      //   description: `${activeStore.name} - ${daySession.session_date}`,
      // });

      navigate("/pos");
    } catch (error) {
      console.error("Error creating POS session:", error);
      toast({
        title: "Error",
        description: "Failed to access POS. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Define sections based on user role
  const isOwnerOrManager =
    user.role === UserRole.BusinessOwner || user.role === UserRole.Manager;

  if (!user || !statsData || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const setupActions = [
    {
      title: "Add Your First Product",
      description: "Start by adding products to your inventory",
      icon: Package,
      href: "/inventory",
      color: "text-green-600",
      bgColor: "bg-green-50",
      urgent: statsData.getBusinessStats.productsCount === 0,
      action: "Add Products",
    },
    {
      title: "Set Up Additional Stores",
      description: "Manage multiple locations for your business",
      icon: Store,
      href: "/store-management",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      urgent: statsData.getBusinessStats.storesCount <= 1,
      action: "Add Store",
    },
    {
      title: "Invite Team Members",
      description: "Add employees and assign roles",
      icon: UserPlus,
      href: "/team?action=add-member",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      urgent: statsData.getBusinessStats.membersCount <= 1,
      action: "Invite Team",
    },
  ];

  const quickActions = [
    {
      title: "Point of Sale",
      description: "Process sales and manage transactions",
      icon: ShoppingCart,
      href: "/pos",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "View Analytics",
      description: "Track sales, revenue, and performance",
      icon: BarChart3,
      href: "/analytics",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Manage Inventory",
      description: "Track stock levels and product catalog",
      icon: Package,
      href: "/inventory",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Team & Scheduling",
      description: "Manage staff schedules and communication",
      icon: Users,
      href: "/team",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
  ];

  const advancedFeatures = [
    {
      title: "AI & Automation",
      description: "Smart business insights and automated workflows",
      icon: Brain,
      href: "/ai-automation",
      color: "text-violet-600",
      bgColor: "bg-violet-50",
    },
    {
      title: "Customer Service",
      description: "Handle support tickets and customer inquiries",
      icon: Clock,
      href: "/customer-service",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      title: "Business Settings",
      description: "Configure stores, roles, and preferences",
      icon: Settings,
      href: "/settings",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-semibold">
                  {businessInfo?.name || "Your Business"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {user.role
                    .toLowerCase()
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                  Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>

              {/* User Presence & Notifications */}
              {businessId && <UserPresence businessId={businessId} />}
              <NotificationBell />

              <Badge variant="outline" className="capitalize">
                {user.role.toLowerCase().replace("_", " ")}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section with Quick Stats */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground mb-6">
            Here's what's happening with your business today.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card
              onClick={() => navigate("/inventory")}
              className={"cursor-pointer"}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsData.getBusinessStats.productsCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statsData.getBusinessStats.productsCount === 0
                    ? "Add your first product"
                    : "In your catalog"}
                </p>
              </CardContent>
            </Card>

            <Card
              onClick={() => navigate("/store-management")}
              className={"cursor-pointer"}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stores</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsData.getBusinessStats.storesCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  In {statsData.getBusinessStats.storeLocationsCount} active
                  locations
                </p>
              </CardContent>
            </Card>

            <Card
              onClick={() => navigate("/team")}
              className={"cursor-pointer"}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Team Members
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsData.getBusinessStats.membersCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active employees
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Active</div>
                <p className="text-xs text-muted-foreground">
                  System operational
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Setup Actions (only show if user is owner/manager and needs setup) */}
        {isOwnerOrManager && setupActions.some((action) => action.urgent) && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-amber-500" />
              <h3 className="text-xl font-semibold">Complete Your Setup</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Get your business up and running with these essential steps:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {setupActions
                .filter((action) => action.urgent)
                .map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link key={index} to={action.href}>
                      <Card className="hover:shadow-lg transition-all cursor-pointer border-amber-200 bg-amber-50/50">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`p-2 rounded-lg ${action.bgColor}`}
                              >
                                <Icon className={`h-5 w-5 ${action.color}`} />
                              </div>
                              <div>
                                <CardTitle className="text-lg">
                                  {action.title}
                                </CardTitle>
                                <Badge
                                  variant="outline"
                                  className="text-xs mt-1"
                                >
                                  Recommended
                                </Badge>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription>
                            {action.description}
                          </CardDescription>
                          <Button size="sm" className="mt-3 w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            {action.action}
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}

        {/* Main Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Daily Operations</h3>
          <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-emerald-900">
                    Ready to Start Selling?
                  </h4>
                  <p className="text-sm text-emerald-700">
                    Your POS system is loaded with{" "}
                    {statsData.getBusinessStats.productsCount} products across{" "}
                    {statsData.getBusinessStats.storesCount} stores with 10 test
                    employees
                  </p>
                </div>
              </div>
              <Button
                onClick={handlePOSAccess}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Open POS
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;

              // Handle POS action specially for authorized users
              if (action.title === "Point of Sale") {
                return (
                  <Card
                    key={index}
                    className="hover:shadow-lg transition-shadow cursor-pointer h-full group"
                    onClick={handlePOSAccess}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div
                          className={`p-3 rounded-lg ${action.bgColor} group-hover:scale-110 transition-transform`}
                        >
                          <Icon className={`h-6 w-6 ${action.color}`} />
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-lg mb-2">
                        {action.title}
                      </CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </CardContent>
                  </Card>
                );
              }

              // Regular link handling for other actions
              return (
                <Link key={index} to={action.href}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full group">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div
                          className={`p-3 rounded-lg ${action.bgColor} group-hover:scale-110 transition-transform`}
                        >
                          <Icon className={`h-6 w-6 ${action.color}`} />
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-lg mb-2">
                        {action.title}
                      </CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Advanced Features */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Advanced Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {advancedFeatures.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={index} to={action.href}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg ${action.bgColor} group-hover:scale-110 transition-transform`}
                        >
                          <Icon className={`h-5 w-5 ${action.color}`} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">
                            {action.title}
                          </CardTitle>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">
                        {action.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Business Info */}
        {businessInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">
                    Business Name
                  </p>
                  <p className="text-lg">{businessInfo.name}</p>
                </div>
                {businessInfo.address && (
                  <div>
                    <p className="font-medium text-muted-foreground">Address</p>
                    <p>{businessInfo.address}</p>
                  </div>
                )}
                {businessInfo.phone && (
                  <div>
                    <p className="font-medium text-muted-foreground">Phone</p>
                    <p>{businessInfo.phone}</p>
                  </div>
                )}
                {businessInfo.email && (
                  <div>
                    <p className="font-medium text-muted-foreground">Email</p>
                    <p>{businessInfo.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
