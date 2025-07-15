import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Users,
  Calendar,
  Mail,
  Download,
  Loader2,
  User,
  DollarSign
} from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface BulkPayrollManagerProps {
  searchQuery: string;
  userRole: string;
  onBulkProcessed: () => void;
}

interface Employee {
  user_id: string;
  full_name?: string;
  payroll_email?: string;
  position_type?: string;
}

export const BulkPayrollManager = ({ searchQuery, userRole, onBulkProcessed }: BulkPayrollManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [basePay, setBasePay] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    if (!user) return;

    try {
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      const { data: employeeData } = await supabase
        .from("profiles")
        .select(`
          user_id,
          full_name,
          payroll_email,
          position_type
        `)
        .in("user_id", await supabase
          .from("user_business_memberships")
          .select("user_id")
          .eq("business_id", membershipData.business_id)
          .eq("is_active", true)
          .then(({ data }) => data?.map(m => m.user_id) || [])
        );

      setEmployees(employeeData || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const setQuickDateRange = (range: string) => {
    const now = new Date();
    let start: Date, end: Date;

    switch (range) {
      case "this_week":
        start = startOfWeek(now);
        end = endOfWeek(now);
        break;
      case "last_week":
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        start = startOfWeek(lastWeek);
        end = endOfWeek(lastWeek);
        break;
      case "this_month":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "last_month":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      default:
        return;
    }

    setStartDate(format(start, "yyyy-MM-dd"));
    setEndDate(format(end, "yyyy-MM-dd"));
  };

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAll = () => {
    const allEmployeeIds = filteredEmployees.map(emp => emp.user_id);
    setSelectedEmployees(allEmployeeIds);
  };

  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  const processBulkPayroll = async (sendEmails: boolean = false) => {
    if (selectedEmployees.length === 0 || !startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please select employees and date range",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      let successCount = 0;
      let errorCount = 0;

      for (const employeeId of selectedEmployees) {
        try {
          // Calculate payroll data for each employee
          const { data: payrollData } = await supabase.rpc('calculate_payroll_data', {
            p_employee_id: employeeId,
            p_business_id: membershipData.business_id,
            p_start_date: startDate,
            p_end_date: endDate
          });

          if (payrollData && payrollData.length > 0) {
            const data = payrollData[0];
            const basePayAmount = parseFloat(basePay) || 0;
            const grossPay = data.total_commission + basePayAmount;
            const netPay = grossPay; // No deductions in bulk for simplicity

            // Create payroll record
            const { data: payrollPeriod, error } = await supabase
              .from("payroll_periods")
              .insert({
                business_id: membershipData.business_id,
                employee_id: employeeId,
                period_start: startDate,
                period_end: endDate,
                total_sales: data.total_sales,
                total_commission: data.total_commission,
                total_hours: data.total_hours,
                base_pay: basePayAmount,
                deductions: [],
                additions: [],
                gross_pay: grossPay,
                net_pay: netPay,
                generated_by: user.id,
                status: sendEmails ? 'sent' : 'draft',
                sent_at: sendEmails ? new Date().toISOString() : null
              })
              .select()
              .single();

            if (error) throw error;

            if (sendEmails) {
              // Send email for each payroll
              const { error: emailError } = await supabase.functions.invoke('send-payroll-email', {
                body: {
                  payroll_id: payrollPeriod.id,
                  employee_id: employeeId,
                  payroll_data: {
                    ...data,
                    base_pay: basePayAmount,
                    deductions: [],
                    additions: [],
                    gross_pay: grossPay,
                    net_pay: netPay,
                    period_start: startDate,
                    period_end: endDate
                  }
                }
              });

              if (emailError) {
                console.error(`Email error for employee ${employeeId}:`, emailError);
                errorCount++;
              } else {
                successCount++;
              }
            } else {
              successCount++;
            }
          }
        } catch (error) {
          console.error(`Error processing payroll for employee ${employeeId}:`, error);
          errorCount++;
        }
      }

      const message = sendEmails 
        ? `${successCount} payrolls sent successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`
        : `${successCount} payrolls generated${errorCount > 0 ? `, ${errorCount} failed` : ''}`;

      toast({
        title: sendEmails ? "Bulk Email Complete" : "Bulk Generation Complete",
        description: message,
        variant: errorCount > 0 ? "destructive" : "default",
      });

      onBulkProcessed();
      // Reset form
      setSelectedEmployees([]);
      setStartDate("");
      setEndDate("");
      setBasePay("");

    } catch (error) {
      console.error("Error processing bulk payroll:", error);
      toast({
        title: "Error",
        description: "Failed to process bulk payroll",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Payroll Processing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4" />
              <Label>Pay Period</Label>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setQuickDateRange("this_week")}
              >
                This Week
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setQuickDateRange("last_week")}
              >
                Last Week
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setQuickDateRange("this_month")}
              >
                This Month
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setQuickDateRange("last_month")}
              >
                Last Month
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base-pay">Base Pay (All)</Label>
                <Input
                  id="base-pay"
                  type="number"
                  placeholder="0.00"
                  value={basePay}
                  onChange={(e) => setBasePay(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Employee Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Select Employees</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All ({filteredEmployees.length})
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear Selection
                </Button>
              </div>
            </div>

            {selectedEmployees.length > 0 && (
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium">
                  {selectedEmployees.length} employees selected for bulk processing
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee.user_id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedEmployees.includes(employee.user_id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => toggleEmployee(employee.user_id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedEmployees.includes(employee.user_id)}
                      onChange={() => toggleEmployee(employee.user_id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium truncate">
                          {employee.full_name || "Unknown"}
                        </span>
                      </div>
                      {employee.position_type && (
                        <Badge variant="outline" className="text-xs mb-2">
                          {employee.position_type}
                        </Badge>
                      )}
                      {employee.payroll_email ? (
                        <p className="text-xs text-success">✓ Email configured</p>
                      ) : (
                        <p className="text-xs text-warning">⚠ No email</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredEmployees.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Employees Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "No employees match your search" : "No active employees found"}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <Button
              onClick={() => processBulkPayroll(false)}
              disabled={selectedEmployees.length === 0 || !startDate || !endDate || processing}
              variant="outline"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Generate All PDFs
            </Button>
            <Button
              onClick={() => processBulkPayroll(true)}
              disabled={selectedEmployees.length === 0 || !startDate || !endDate || processing}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Email All Payrolls
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>💡 Tip: Employees without payroll emails will only have PDFs generated (no emails sent)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};