import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PayrollGenerator } from "@/components/payroll/PayrollGenerator";
import { PayrollSettings } from "@/components/payroll/PayrollSettings";
import { PayrollHistory } from "@/components/payroll/PayrollHistory";
import { BulkPayrollManager } from "@/components/payroll/BulkPayrollManager";
import { 
  FileText,
  Users,
  Settings,
  History,
  Download,
  Mail,
  Loader2,
  Search
} from "lucide-react";

const Payroll = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("generate");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<string>("");
  const [payrollStats, setPayrollStats] = useState({
    totalEmployees: 0,
    pendingPayrolls: 0,
    sentThisMonth: 0,
    totalPayrollValue: 0
  });

  useEffect(() => {
    if (user) {
      fetchPayrollData();
    }
  }, [user]);

  const fetchPayrollData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's business context and role
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id, role")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) {
        throw new Error("User not associated with any business");
      }

      setUserRole(membershipData.role);

      // Get team members count
      const { data: teamMembers } = await supabase
        .from("user_business_memberships")
        .select("user_id")
        .eq("business_id", membershipData.business_id)
        .eq("is_active", true);

      // Get payroll statistics
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: payrollData } = await supabase
        .from("payroll_periods")
        .select("status, gross_pay, created_at")
        .eq("business_id", membershipData.business_id)
        .gte("created_at", `${currentMonth}-01`);

      const totalEmployees = teamMembers?.length || 0;
      const pendingPayrolls = payrollData?.filter(p => p.status === 'draft').length || 0;
      const sentThisMonth = payrollData?.filter(p => p.status === 'sent').length || 0;
      const totalPayrollValue = payrollData?.reduce((sum, p) => sum + (p.gross_pay || 0), 0) || 0;

      setPayrollStats({
        totalEmployees,
        pendingPayrolls,
        sentThisMonth,
        totalPayrollValue
      });

    } catch (error: any) {
      console.error("Error fetching payroll data:", error);
      toast({
        title: "Error",
        description: "Failed to load payroll data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if user has permission to access payroll
  if (!loading && !['business_owner', 'manager', 'office'].includes(userRole)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              You don't have permission to access the payroll system.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Employees",
      value: payrollStats.totalEmployees.toString(),
      change: "Active team members",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Pending Payrolls",
      value: payrollStats.pendingPayrolls.toString(),
      change: "Awaiting generation",
      icon: FileText,
      color: "text-warning"
    },
    {
      title: "Sent This Month",
      value: payrollStats.sentThisMonth.toString(),
      change: "Payrolls processed",
      icon: Mail,
      color: "text-success"
    },
    {
      title: "Total Value",
      value: `$${payrollStats.totalPayrollValue.toLocaleString()}`,
      change: "This month",
      icon: Download,
      color: "text-success"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading payroll system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex flex-col sm:flex-row h-auto sm:h-16 items-start sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Payroll Management</h1>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <FileText className="h-3 w-3 mr-1" />
              Automated
            </Badge>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      <p className={`text-sm ${stat.color} mt-1`}>
                        {stat.change}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg bg-pos-accent`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="generate" className="text-xs sm:text-sm">Generate</TabsTrigger>
            <TabsTrigger value="bulk" className="text-xs sm:text-sm">Bulk Process</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">History</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <PayrollGenerator 
              searchQuery={searchQuery} 
              userRole={userRole}
              onPayrollGenerated={fetchPayrollData}
            />
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <BulkPayrollManager 
              searchQuery={searchQuery} 
              userRole={userRole}
              onBulkProcessed={fetchPayrollData}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <PayrollHistory 
              searchQuery={searchQuery} 
              userRole={userRole}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <PayrollSettings userRole={userRole} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Payroll;