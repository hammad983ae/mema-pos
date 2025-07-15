import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FileText,
  Package,
  DollarSign,
  AlertTriangle,
  Users,
  BarChart3,
  Settings,
  Truck,
  CreditCard,
  Target,
  TrendingUp,
  Clock,
  Calendar
} from "lucide-react";

interface OfficeStats {
  totalDisputes: number;
  activeDisputes: number;
  pendingShipments: number;
  totalCommissions: number;
  teamMembers: number;
  monthlyRevenue: number;
}

const OfficeDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<OfficeStats>({
    totalDisputes: 0,
    activeDisputes: 0,
    pendingShipments: 0,
    totalCommissions: 0,
    teamMembers: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOfficeStats();
    }
  }, [user]);

  const fetchOfficeStats = async () => {
    try {
      // Get user's business context
      const { data: context } = await supabase.rpc('get_user_business_context_secure');
      if (!context || context.length === 0) return;

      const businessId = context[0].business_id;

      // Fetch disputes data
      const { data: disputes } = await supabase
        .from('chargeback_disputes')
        .select('*')
        .eq('business_id', businessId);

      // Fetch shipping data
      const { data: shipments } = await supabase
        .from('shipping_requests')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', 'pending');

      // Fetch commission data
      const { data: commissions } = await supabase
        .from('commission_payments')
        .select('commission_amount')
        .eq('business_id', businessId)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      // Fetch team members
      const { data: members } = await supabase
        .from('user_business_memberships')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true);

      // Fetch monthly revenue (from orders)
      const { data: orders } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .eq('status', 'completed');

      const totalCommissions = commissions?.reduce((sum, c) => sum + (c.commission_amount || 0), 0) || 0;
      const monthlyRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

      setStats({
        totalDisputes: disputes?.length || 0,
        activeDisputes: disputes?.filter(d => d.status === 'open').length || 0,
        pendingShipments: shipments?.length || 0,
        totalCommissions,
        teamMembers: members?.length || 0,
        monthlyRevenue
      });
    } catch (error) {
      console.error('Error fetching office stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Chargeback Disputes",
      icon: CreditCard,
      description: "Manage payment disputes and chargebacks",
      path: "/chargeback-disputes",
      color: "bg-red-500",
      count: stats.activeDisputes
    },
    {
      title: "Shipping Requests",
      icon: Truck,
      description: "Process and track shipments",
      path: "/shipping",
      color: "bg-blue-500",
      count: stats.pendingShipments
    },
    {
      title: "Commission Management",
      icon: DollarSign,
      description: "Review and process commissions",
      path: "/payroll",
      color: "bg-green-500"
    },
    {
      title: "Team Management",
      icon: Users,
      description: "Manage team members and roles",
      path: "/team",
      color: "bg-purple-500",
      count: stats.teamMembers
    },
    {
      title: "Analytics & Reports",
      icon: BarChart3,
      description: "View detailed business analytics",
      path: "/analytics",
      color: "bg-indigo-500"
    },
    {
      title: "Business Settings",
      icon: Settings,
      description: "Configure business preferences",
      path: "/settings",
      color: "bg-gray-500"
    }
  ];

  const statsCards = [
    {
      title: "Total Disputes",
      value: stats.totalDisputes,
      change: `${stats.activeDisputes} active`,
      icon: CreditCard,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Pending Shipments",
      value: stats.pendingShipments,
      change: "Awaiting processing",
      icon: Truck,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Monthly Commissions",
      value: `$${stats.totalCommissions.toFixed(2)}`,
      change: "This month",
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Monthly Revenue",
      value: `$${stats.monthlyRevenue.toFixed(2)}`,
      change: "Total sales",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Office Dashboard</h1>
            <p className="text-gray-600 mt-1">Complete business operations center</p>
          </div>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <Users className="h-4 w-4 mr-1" />
            Office Access
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                <CardContent className="p-6" onClick={() => navigate(action.path)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    {action.count !== undefined && (
                      <Badge variant="outline" className="bg-white">
                        {action.count}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Access
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                Priority Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.activeDisputes > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm font-medium">Active Disputes</span>
                    </div>
                    <Badge variant="destructive">{stats.activeDisputes}</Badge>
                  </div>
                )}
                {stats.pendingShipments > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm font-medium">Pending Shipments</span>
                    </div>
                    <Badge variant="outline">{stats.pendingShipments}</Badge>
                  </div>
                )}
                {stats.activeDisputes === 0 && stats.pendingShipments === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No urgent items requiring attention</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                Today's Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Review new disputes</span>
                  <Badge variant="outline">Office</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Process commission payments</span>
                  <Badge variant="outline">Office</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Update shipping status</span>
                  <Badge variant="outline">Office</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OfficeDashboard;