import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText,
  User,
  Calendar,
  DollarSign,
  Clock,
  Building2,
  Download,
  Mail,
  Loader2
} from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface PayrollGeneratorProps {
  searchQuery: string;
  userRole: string;
  onPayrollGenerated: () => void;
}

interface Employee {
  user_id: string;
  profiles?: {
    full_name?: string;
    payroll_email?: string;
    position?: string;
  } | null;
}

interface PayrollData {
  total_sales: number;
  total_commission: number;
  total_hours: number;
  daily_breakdown: any;
}

export const PayrollGenerator = ({ searchQuery, userRole, onPayrollGenerated }: PayrollGeneratorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [payrollData, setPayrollData] = useState<PayrollData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [basePay, setBasePay] = useState<string>("");
  const [deductions, setDeductions] = useState<Array<{name: string, amount: number}>>([]);
  const [additions, setAdditions] = useState<Array<{name: string, amount: number}>>([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    if (!user?.id) return;

    try {
      const { data: userContext } = await supabase.rpc('get_user_business_context', {
        user_uuid: user.id
      });

      if (!userContext || userContext.length === 0) return;

      const { data: memberships } = await supabase
        .from("user_business_memberships")
        .select("user_id")
        .eq("business_id", userContext[0].business_id)
        .eq("is_active", true);

      if (memberships) {
        const userIds = memberships.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, payroll_email, position_type")
          .in("user_id", userIds);

        const employeeData = memberships.map(m => ({
          user_id: m.user_id,
          profiles: profiles?.find(p => p.user_id === m.user_id) ? {
            full_name: profiles.find(p => p.user_id === m.user_id)?.full_name,
            payroll_email: profiles.find(p => p.user_id === m.user_id)?.payroll_email,
            position: profiles.find(p => p.user_id === m.user_id)?.position_type
          } : null
        }));

        setEmployees(employeeData);
      }
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

  const calculatePayrollData = async () => {
    if (!selectedEmployee || !startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please select an employee and date range",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: userContext } = await supabase.rpc('get_user_business_context', {
        user_uuid: user.id
      });

      if (!userContext || userContext.length === 0) return;

      const { data, error } = await supabase.rpc('calculate_payroll_data', {
        p_employee_id: selectedEmployee,
        p_business_id: userContext[0].business_id,
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setPayrollData(data[0]);
      }
    } catch (error) {
      console.error("Error calculating payroll:", error);
      toast({
        title: "Error",
        description: "Failed to calculate payroll data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePayroll = async (sendEmail: boolean = false) => {
    if (!payrollData || !selectedEmployee) return;

    setGenerating(true);
    try {
      const { data: userContext } = await supabase.rpc('get_user_business_context', {
        user_uuid: user.id
      });

      if (!userContext || userContext.length === 0) return;

      const basePayAmount = parseFloat(basePay) || 0;
      const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
      const totalAdditions = additions.reduce((sum, a) => sum + a.amount, 0);
      const grossPay = payrollData.total_commission + basePayAmount + totalAdditions;
      const netPay = grossPay - totalDeductions;

      const { data: payrollPeriod, error } = await supabase
        .from("payroll_periods")
        .insert({
          business_id: userContext[0].business_id,
          employee_id: selectedEmployee,
          period_start: startDate,
          period_end: endDate,
          total_sales: payrollData.total_sales,
          total_commission: payrollData.total_commission,
          total_hours: payrollData.total_hours,
          base_pay: basePayAmount,
          deductions: deductions,
          additions: additions,
          gross_pay: grossPay,
          net_pay: netPay,
          generated_by: user.id,
          status: sendEmail ? 'sent' : 'draft',
          sent_at: sendEmail ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (error) throw error;

      if (sendEmail) {
        // Call edge function to generate PDF and send email
        const { error: emailError } = await supabase.functions.invoke('send-payroll-email', {
          body: {
            payroll_id: payrollPeriod.id,
            employee_id: selectedEmployee,
            payroll_data: {
              ...payrollData,
              base_pay: basePayAmount,
              deductions,
              additions,
              gross_pay: grossPay,
              net_pay: netPay,
              period_start: startDate,
              period_end: endDate
            }
          }
        });

        if (emailError) {
          console.error("Email error:", emailError);
          toast({
            title: "Payroll Generated",
            description: "Payroll created but email failed to send",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Payroll Sent",
            description: "Payroll generated and emailed successfully",
          });
        }
      } else {
        // Generate PDF for download
        const { data: pdfData, error: pdfError } = await supabase.functions.invoke('generate-payroll-pdf', {
          body: {
            payroll_id: payrollPeriod.id,
            payroll_data: {
              ...payrollData,
              base_pay: basePayAmount,
              deductions,
              additions,
              gross_pay: grossPay,
              net_pay: netPay,
              period_start: startDate,
              period_end: endDate
            }
          }
        });

        if (pdfError) {
          console.error("PDF error:", pdfError);
          toast({
            title: "Error",
            description: "Failed to generate PDF",
            variant: "destructive",
          });
        } else {
          // Download PDF
          const blob = new Blob([pdfData], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `payroll-${selectedEmployee}-${startDate}-${endDate}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);

          toast({
            title: "Payroll Generated",
            description: "PDF downloaded successfully",
          });
        }
      }

      onPayrollGenerated();
      // Reset form
      setSelectedEmployee("");
      setStartDate("");
      setEndDate("");
      setPayrollData(null);
      setBasePay("");
      setDeductions([]);
      setAdditions([]);

    } catch (error) {
      console.error("Error generating payroll:", error);
      toast({
        title: "Error",
        description: "Failed to generate payroll",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const addDeduction = () => {
    setDeductions([...deductions, { name: "", amount: 0 }]);
  };

  const updateDeduction = (index: number, field: string, value: any) => {
    const updated = [...deductions];
    updated[index] = { ...updated[index], [field]: value };
    setDeductions(updated);
  };

  const removeDeduction = (index: number) => {
    setDeductions(deductions.filter((_, i) => i !== index));
  };

  const addAddition = () => {
    setAdditions([...additions, { name: "", amount: 0 }]);
  };

  const updateAddition = (index: number, field: string, value: any) => {
    const updated = [...additions];
    updated[index] = { ...updated[index], [field]: value };
    setAdditions(updated);
  };

  const removeAddition = (index: number) => {
    setAdditions(additions.filter((_, i) => i !== index));
  };

  const filteredEmployees = employees.filter(emp =>
    emp.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedEmployeeData = employees.find(emp => emp.user_id === selectedEmployee);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Individual Payroll
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Employee Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Select Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose employee..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredEmployees.map((employee) => (
                    <SelectItem key={employee.user_id} value={employee.user_id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {employee.profiles?.full_name}
                        {employee.profiles?.position && (
                          <Badge variant="outline" className="text-xs">
                            {employee.profiles.position}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEmployeeData?.profiles?.payroll_email && (
                <p className="text-sm text-muted-foreground">
                  Email: {selectedEmployeeData.profiles.payroll_email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Base Pay Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={basePay}
                onChange={(e) => setBasePay(e.target.value)}
              />
            </div>
          </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>

          <Button
            onClick={calculatePayrollData}
            disabled={!selectedEmployee || !startDate || !endDate || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" />
                Calculate Payroll Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Payroll Data Display */}
      {payrollData && (
        <Card>
          <CardHeader>
            <CardTitle>Payroll Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-success/10 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-success" />
                  <span className="font-medium">Total Sales</span>
                </div>
                <p className="text-2xl font-bold text-success">
                  ${payrollData.total_sales.toLocaleString()}
                </p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-medium">Commission Earned</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  ${payrollData.total_commission.toLocaleString()}
                </p>
              </div>
              <div className="bg-warning/10 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-warning" />
                  <span className="font-medium">Total Hours</span>
                </div>
                <p className="text-2xl font-bold text-warning">
                  {payrollData.total_hours.toFixed(1)}h
                </p>
              </div>
            </div>

            {/* Daily Breakdown */}
            {payrollData.daily_breakdown && payrollData.daily_breakdown.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium">Daily Breakdown</h3>
                <div className="space-y-2">
                  {payrollData.daily_breakdown.map((day: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">
                            {format(new Date(day.date), "MMM dd, yyyy")}
                          </span>
                          <Badge variant="outline">
                            <Building2 className="h-3 w-3 mr-1" />
                            {day.store}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {day.hours?.toFixed(1)}h worked
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Sales: </span>
                          <span className="font-medium">${day.sales?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Commission: </span>
                          <span className="font-medium">${day.commission?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deductions and Additions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Deductions</h3>
                  <Button variant="outline" size="sm" onClick={addDeduction}>
                    Add Deduction
                  </Button>
                </div>
                {deductions.map((deduction, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Description"
                      value={deduction.name}
                      onChange={(e) => updateDeduction(index, 'name', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={deduction.amount}
                      onChange={(e) => updateDeduction(index, 'amount', parseFloat(e.target.value) || 0)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeDeduction(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Additions</h3>
                  <Button variant="outline" size="sm" onClick={addAddition}>
                    Add Addition
                  </Button>
                </div>
                {additions.map((addition, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Description"
                      value={addition.name}
                      onChange={(e) => updateAddition(index, 'name', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={addition.amount}
                      onChange={(e) => updateAddition(index, 'amount', parseFloat(e.target.value) || 0)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeAddition(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Total Calculation */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Commission:</span>
                <span>${payrollData.total_commission.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Base Pay:</span>
                <span>${(parseFloat(basePay) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Additions:</span>
                <span>${additions.reduce((sum, a) => sum + a.amount, 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Deductions:</span>
                <span>-${deductions.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Net Pay:</span>
                <span>
                  ${(
                    payrollData.total_commission + 
                    (parseFloat(basePay) || 0) + 
                    additions.reduce((sum, a) => sum + a.amount, 0) - 
                    deductions.reduce((sum, d) => sum + d.amount, 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={() => generatePayroll(false)}
                disabled={generating}
                variant="outline"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download PDF
              </Button>
              <Button
                onClick={() => generatePayroll(true)}
                disabled={generating || !selectedEmployeeData?.profiles?.payroll_email}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Email Payroll
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};