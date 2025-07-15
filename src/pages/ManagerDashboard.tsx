import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ReceiptManagement } from "@/components/pos/ReceiptManagement";
import { RealtimeAnalyticsDashboard } from "@/components/analytics/RealtimeAnalyticsDashboard";
import { ManagerApprovalRequests } from "@/components/manager/ManagerApprovalRequests";
import { 
  Receipt, 
  BarChart3, 
  ShoppingCart, 
  Users,
  Package,
  Calendar,
  Settings,
  CreditCard,
  GraduationCap,
  CheckCircle
} from "lucide-react";
import { TrainingAnalytics } from "@/components/training/TrainingAnalytics";

const ManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("analytics");

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchUserRole();
  }, [user, navigate]);

  const fetchUserRole = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("user_business_memberships")
        .select("role, business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (data) {
        setUserRole(data.role);
        setBusinessId(data.business_id);
        
        // Redirect if not authorized for manager dashboard
        if (!['business_owner', 'manager', 'office'].includes(data.role)) {
          navigate('/employee');
        }
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      navigate('/auth');
    }
  };

  if (!userRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your business operations and monitor performance
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="approvals" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approvals
            </TabsTrigger>
            <TabsTrigger value="receipts" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Receipts
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Training
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <RealtimeAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="approvals">
            <ManagerApprovalRequests />
          </TabsContent>

          <TabsContent value="receipts">
            <ReceiptManagement userRole={userRole} />
          </TabsContent>

          <TabsContent value="training">
            {businessId && <TrainingAnalytics businessId={businessId} />}
          </TabsContent>


          <TabsContent value="inventory">
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Inventory Management</h3>
                <p className="text-muted-foreground">
                  Inventory management features are available in the dedicated inventory section.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Team Management</h3>
                <p className="text-muted-foreground">
                  Team management features are available in the dedicated team section.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardContent className="p-8 text-center">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Business Settings</h3>
                <p className="text-muted-foreground">
                  Business settings and configuration options coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ManagerDashboard;