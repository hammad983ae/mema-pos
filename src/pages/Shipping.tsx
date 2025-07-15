import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, List, BarChart3 } from "lucide-react";
import ShippingRequestForm from "@/components/shipping/ShippingRequestForm";
import ShippingRequestsList from "@/components/shipping/ShippingRequestsList";

const Shipping = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string>("");
  const [activeTab, setActiveTab] = useState("requests");
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0
  });

  useEffect(() => {
    if (user) {
      getUserRole();
      fetchStats();
    }
  }, [user]);

  const getUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from("user_business_memberships")
        .select("role")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      setUserRole(data.role);
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from("shipping_requests")
        .select("status");

      if (error) throw error;

      const statusCounts = {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0
      };

      data?.forEach(request => {
        const status = request.status;
        if (status === "pending" || status === "approved") {
          statusCounts.pending++;
        } else if (status === "processing") {
          statusCounts.processing++;
        } else if (status === "shipped") {
          statusCounts.shipped++;
        } else if (status === "delivered") {
          statusCounts.delivered++;
        }
      });

      setStats(statusCounts);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const isOfficeStaff = userRole && ['business_owner', 'manager', 'office'].includes(userRole);

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Shipping Management</h1>
            <p className="text-muted-foreground">
              {isOfficeStaff 
                ? "Manage all shipping requests and fulfill orders" 
                : "Submit shipping requests and track your orders"
              }
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-warning" />
                <h3 className="font-semibold">Pending</h3>
              </div>
              <p className="text-2xl font-bold text-warning">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Awaiting processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Processing</h3>
              </div>
              <p className="text-2xl font-bold text-primary">{stats.processing}</p>
              <p className="text-sm text-muted-foreground">Being prepared</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-info" />
                <h3 className="font-semibold">Shipped</h3>
              </div>
              <p className="text-2xl font-bold text-info">{stats.shipped}</p>
              <p className="text-sm text-muted-foreground">In transit</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-success" />
                <h3 className="font-semibold">Delivered</h3>
              </div>
              <p className="text-2xl font-bold text-success">{stats.delivered}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              View Requests
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Request
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            <ShippingRequestsList 
              userRole={userRole} 
              onCreateRequest={() => setActiveTab("create")}
            />
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <ShippingRequestForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Shipping;