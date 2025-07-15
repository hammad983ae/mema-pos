import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  DollarSign,
  Send
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";

interface Timesheet {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  regular_hours: number;
  overtime_hours: number;
  total_hours: number;
  break_hours: number;
  pay_rate: number;
  total_pay: number;
  status: string;
  submitted_at: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

interface WeeklySummary {
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  breakHours: number;
  estimatedPay: number;
}

export const TimesheetApproval = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTimesheets();
      fetchWeeklySummary();
      fetchHourlyRate();
    }
  }, [user, currentWeek]);

  const fetchHourlyRate = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from("user_business_memberships")
        .select("hourly_rate")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();
      
      if (data?.hourly_rate) {
        setHourlyRate(data.hourly_rate);
      }
    } catch (error) {
      console.error("Error fetching hourly rate:", error);
    }
  };

  const fetchTimesheets = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
      
      const { data, error } = await supabase
        .from('timesheets')
        .select(`
          *,
          profiles(full_name, email)
        `)
        .gte('period_start', format(weekStart, 'yyyy-MM-dd'))
        .lte('period_end', format(weekEnd, 'yyyy-MM-dd'))
        .order('period_start', { ascending: false });

      if (error) throw error;
      setTimesheets((data || []) as unknown as Timesheet[]);
    } catch (error: any) {
      console.error('Error fetching timesheets:', error);
      toast({
        title: "Error",
        description: "Failed to load timesheets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklySummary = async () => {
    if (!user) return;
    
    try {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
      
      const { data, error } = await supabase
        .from('time_punches')
        .select('*')
        .eq('user_id', user.id)
        .gte('punch_time', weekStart.toISOString())
        .lte('punch_time', weekEnd.toISOString())
        .order('punch_time', { ascending: true });

      if (error) throw error;

      const punches = data || [];
      const summary = calculateWeeklySummary(punches);
      setWeeklySummary(summary);
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
    }
  };

  const calculateWeeklySummary = (punches: any[]) => {
    let totalWorkedMinutes = 0;
    let totalBreakMinutes = 0;
    
    // Group punches by day
    const dailyPunches = punches.reduce((acc, punch) => {
      const date = format(new Date(punch.punch_time), 'yyyy-MM-dd');
      if (!acc[date]) acc[date] = [];
      acc[date].push(punch);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate daily hours
    Object.values(dailyPunches).forEach((dayPunches: any[]) => {
      const clockIn = dayPunches.find(p => p.punch_type === 'clock_in');
      const clockOut = dayPunches.find(p => p.punch_type === 'clock_out');
      
      if (clockIn && clockOut) {
        const shiftMinutes = Math.floor(
          (new Date(clockOut.punch_time).getTime() - new Date(clockIn.punch_time).getTime()) / (1000 * 60)
        );
        
        // Calculate break time for this day
        let dayBreakMinutes = 0;
        for (let i = 0; i < dayPunches.length - 1; i++) {
          if (dayPunches[i].punch_type === 'break_start' && dayPunches[i + 1]?.punch_type === 'break_end') {
            dayBreakMinutes += Math.floor(
              (new Date(dayPunches[i + 1].punch_time).getTime() - new Date(dayPunches[i].punch_time).getTime()) / (1000 * 60)
            );
          }
        }
        
        totalWorkedMinutes += Math.max(0, shiftMinutes - dayBreakMinutes);
        totalBreakMinutes += dayBreakMinutes;
      }
    });

    const totalHours = totalWorkedMinutes / 60;
    const regularHours = Math.min(totalHours, 40);
    const overtimeHours = Math.max(0, totalHours - 40);
    const breakHours = totalBreakMinutes / 60;
    const estimatedPay = (regularHours * hourlyRate) + (overtimeHours * hourlyRate * 1.5);

    return {
      regularHours,
      overtimeHours,
      totalHours,
      breakHours,
      estimatedPay
    };
  };

  const submitTimesheet = async () => {
    if (!user || !weeklySummary) return;
    
    setSubmitting(true);
    try {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
      
      // Get business context
      const { data: membership } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membership) throw new Error("No business membership found");

      const timesheetData = {
        user_id: user.id,
        business_id: membership.business_id,
        period_start: format(weekStart, 'yyyy-MM-dd'),
        period_end: format(weekEnd, 'yyyy-MM-dd'),
        regular_hours: weeklySummary.regularHours,
        overtime_hours: weeklySummary.overtimeHours,
        total_hours: weeklySummary.totalHours,
        break_hours: weeklySummary.breakHours,
        pay_rate: hourlyRate,
        total_pay: weeklySummary.estimatedPay,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('timesheets')
        .insert([timesheetData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Timesheet submitted for approval",
      });

      await fetchTimesheets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit timesheet",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const approveTimesheet = async (timesheetId: string) => {
    try {
      const { error } = await supabase
        .from('timesheets')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id
        })
        .eq('id', timesheetId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Timesheet approved",
      });

      await fetchTimesheets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve timesheet",
        variant: "destructive",
      });
    }
  };

  const rejectTimesheet = async (timesheetId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('timesheets')
        .update({
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', timesheetId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Timesheet rejected",
      });

      await fetchTimesheets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject timesheet",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(2)} hrs`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'secondary',
      'submitted': 'default', 
      'approved': 'default',
      'rejected': 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Week of {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d, yyyy')}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              >
                Next
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Weekly Summary */}
      {weeklySummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Weekly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{formatHours(weeklySummary.regularHours)}</div>
                <div className="text-sm text-muted-foreground">Regular Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{formatHours(weeklySummary.overtimeHours)}</div>
                <div className="text-sm text-muted-foreground">Overtime Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatHours(weeklySummary.breakHours)}</div>
                <div className="text-sm text-muted-foreground">Break Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(weeklySummary.estimatedPay)}</div>
                <div className="text-sm text-muted-foreground">Estimated Pay</div>
              </div>
            </div>
            
            {weeklySummary.totalHours > 0 && (
              <div className="mt-4 flex justify-center">
                <Button 
                  onClick={submitTimesheet}
                  disabled={submitting || timesheets.some(t => t.user_id === user?.id)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Submitting..." : "Submit Timesheet"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timesheets */}
      <Card>
        <CardHeader>
          <CardTitle>Timesheets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading timesheets...</div>
          ) : timesheets.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No timesheets for this week</p>
            </div>
          ) : (
            <div className="space-y-4">
              {timesheets.map((timesheet) => (
                <div key={timesheet.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">
                        {timesheet.profiles?.full_name || "Unknown Employee"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(timesheet.period_start), 'MMM d')} - {format(new Date(timesheet.period_end), 'MMM d, yyyy')}
                      </p>
                    </div>
                    {getStatusBadge(timesheet.status)}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Regular: </span>
                      <span className="font-medium">{formatHours(timesheet.regular_hours)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Overtime: </span>
                      <span className="font-medium text-orange-600">{formatHours(timesheet.overtime_hours)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Pay: </span>
                      <span className="font-medium text-green-600">{formatCurrency(timesheet.total_pay)}</span>
                    </div>
                  </div>

                  {timesheet.status === 'submitted' && timesheet.user_id !== user?.id && (
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm"
                        onClick={() => approveTimesheet(timesheet.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const reason = prompt("Rejection reason:");
                          if (reason) rejectTimesheet(timesheet.id, reason);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {timesheet.rejection_reason && (
                    <div className="mt-3 p-3 bg-destructive/10 rounded-md">
                      <p className="text-sm text-destructive">
                        <strong>Rejection reason:</strong> {timesheet.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};