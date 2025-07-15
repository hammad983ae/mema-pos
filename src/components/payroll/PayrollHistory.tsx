import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  History,
  Download,
  Mail,
  Calendar,
  DollarSign,
  User,
  Search,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

interface PayrollHistoryProps {
  searchQuery: string;
  userRole: string;
}

interface PayrollPeriod {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  total_sales: number;
  total_commission: number;
  total_hours: number;
  base_pay: number;
  gross_pay: number;
  net_pay: number;
  status: string;
  created_at: string;
  sent_at?: string;
  profiles?: {
    full_name: string;
    payroll_email: string;
  };
}

export const PayrollHistory = ({ searchQuery, userRole }: PayrollHistoryProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payrolls, setPayrolls] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchPayrollHistory();
  }, []);

  const fetchPayrollHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      // Get payroll data first
      const { data: payrollData, error: payrollError } = await supabase
        .from("payroll_periods")
        .select("*")
        .eq("business_id", membershipData.business_id)
        .order("created_at", { ascending: false });

      if (payrollError) throw payrollError;

      // Get employee profile data separately
      const employeeIds = [...new Set(payrollData?.map(p => p.employee_id) || [])];
      
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, payroll_email")
        .in("user_id", employeeIds);

      // Combine data
      const enrichedPayrolls = payrollData?.map(payroll => ({
        ...payroll,
        profiles: profilesData?.find(p => p.user_id === payroll.employee_id)
      })) || [];

      setPayrolls(enrichedPayrolls);
    } catch (error) {
      console.error("Error fetching payroll history:", error);
      toast({
        title: "Error",
        description: "Failed to load payroll history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPayroll = async (payrollId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-payroll-pdf', {
        body: { payroll_id: payrollId }
      });

      if (error) throw error;

      // Download PDF
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-${payrollId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "PDF download initiated",
      });
    } catch (error) {
      console.error("Error downloading payroll:", error);
      toast({
        title: "Error",
        description: "Failed to download payroll",
        variant: "destructive",
      });
    }
  };

  const resendPayroll = async (payrollId: string, employeeId: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-payroll-email', {
        body: { payroll_id: payrollId, employee_id: employeeId }
      });

      if (error) throw error;

      // Update status to sent
      await supabase
        .from("payroll_periods")
        .update({ 
          status: "sent", 
          sent_at: new Date().toISOString() 
        })
        .eq("id", payrollId);

      toast({
        title: "Email Sent",
        description: "Payroll email sent successfully",
      });

      fetchPayrollHistory();
    } catch (error) {
      console.error("Error resending payroll:", error);
      toast({
        title: "Error",
        description: "Failed to send payroll email",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-warning/10 text-warning border-warning/20";
      case "sent":
        return "bg-success/10 text-success border-success/20";
      case "paid":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredPayrolls = payrolls.filter(payroll => {
    const matchesSearch = payroll.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || payroll.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Payroll History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "draft" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("draft")}
            >
              Draft
            </Button>
            <Button
              variant={filter === "sent" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("sent")}
            >
              Sent
            </Button>
            <Button
              variant={filter === "paid" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("paid")}
            >
              Paid
            </Button>
          </div>

          {/* Payroll List */}
          <div className="space-y-4">
            {filteredPayrolls.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Payroll Records</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "No payrolls match your search" : "No payroll records found"}
                </p>
              </div>
            ) : (
              filteredPayrolls.map((payroll) => (
                <Card key={payroll.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">
                            {payroll.profiles?.full_name || "Unknown Employee"}
                          </span>
                          <Badge className={getStatusColor(payroll.status)}>
                            {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(payroll.period_start), "MMM dd")} - {format(new Date(payroll.period_end), "MMM dd, yyyy")}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Net: ${payroll.net_pay.toLocaleString()}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Sales: </span>
                            <span className="font-medium">${payroll.total_sales.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Commission: </span>
                            <span className="font-medium">${payroll.total_commission.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Base Pay: </span>
                            <span className="font-medium">${payroll.base_pay.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Hours: </span>
                            <span className="font-medium">{payroll.total_hours.toFixed(1)}h</span>
                          </div>
                        </div>

                        {payroll.sent_at && (
                          <div className="text-xs text-muted-foreground">
                            Sent: {format(new Date(payroll.sent_at), "MMM dd, yyyy 'at' h:mm a")}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadPayroll(payroll.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        {payroll.profiles?.payroll_email && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resendPayroll(payroll.id, payroll.employee_id)}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            {payroll.status === "draft" ? "Send" : "Resend"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};