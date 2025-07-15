import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  Coffee,
  Calendar
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { TimesheetApproval } from "./TimesheetApproval";

interface Employee {
  id: string;
  profiles: {
    full_name: string;
  };
  role: string;
}

interface TimePunch {
  id: string;
  user_id: string;
  punch_type: string;
  punch_time: string;
  notes?: string;
  is_manual: boolean;
  profiles?: {
    full_name: string;
  };
}

interface Timesheet {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  status: string;
  profiles?: {
    full_name: string;
  };
}

export const ManagerTimeClockDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timePunches, setTimePunches] = useState<TimePunch[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("current_week");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedPeriod]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEmployees(),
        fetchTimePunches(),
        fetchTimesheets()
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

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

      const { data, error } = await supabase
        .from("user_business_memberships")
        .select(`
          user_id,
          role
        `)
        .eq("business_id", membershipData.business_id)
        .eq("is_active", true);

      if (error) throw error;
      
      // Get profiles separately to avoid relation issues
      const userIds = data?.map(m => m.user_id) || [];
      
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      // Combine the data
      const employeesWithProfiles = data?.map(membership => ({
        id: membership.user_id,
        role: membership.role,
        profiles: {
          full_name: profilesData?.find(p => p.user_id === membership.user_id)?.full_name || 'Unknown'
        }
      })) || [];

      setEmployees(employeesWithProfiles);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchTimePunches = async () => {
    if (!user) return;

    try {
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      // Get date range based on selected period
      const { startDate, endDate } = getDateRange();

      const { data, error } = await supabase
        .from("time_punches")
        .select("*")
        .eq("business_id", membershipData.business_id)
        .gte("punch_time", startDate.toISOString())
        .lte("punch_time", endDate.toISOString())
        .order("punch_time", { ascending: false });

      if (error) throw error;

      // Get profiles for the users
      const userIds = [...new Set(data?.map(p => p.user_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      // Combine the data
      const punchesWithProfiles = data?.map(punch => ({
        ...punch,
        profiles: {
          full_name: profilesData?.find(p => p.user_id === punch.user_id)?.full_name || 'Unknown'
        }
      })) || [];

      setTimePunches(punchesWithProfiles);
    } catch (error: any) {
      console.error("Error fetching time punches:", error);
    }
  };

  const fetchTimesheets = async () => {
    if (!user) return;

    try {
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      const { data, error } = await supabase
        .from("timesheets")
        .select("*")
        .eq("business_id", membershipData.business_id)
        .order("period_start", { ascending: false });

      if (error) throw error;

      // Get profiles for the users
      const userIds = [...new Set(data?.map(t => t.user_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      // Combine the data
      const timesheetsWithProfiles = data?.map(timesheet => ({
        ...timesheet,
        profiles: {
          full_name: profilesData?.find(p => p.user_id === timesheet.user_id)?.full_name || 'Unknown'
        }
      })) || [];

      setTimesheets(timesheetsWithProfiles);
    } catch (error: any) {
      console.error("Error fetching timesheets:", error);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (selectedPeriod) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case "yesterday":
        startDate = subDays(now, 1);
        endDate = now;
        break;
      case "current_week":
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case "last_week":
        const lastWeekStart = startOfWeek(subDays(now, 7));
        startDate = lastWeekStart;
        endDate = endOfWeek(lastWeekStart);
        break;
      default:
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
    }

    return { startDate, endDate };
  };

  const approveTimesheet = async (timesheetId: string) => {
    try {
      const { error } = await supabase
        .from("timesheets")
        .update({
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq("id", timesheetId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Timesheet approved successfully",
      });

      fetchTimesheets();
    } catch (error: any) {
      console.error("Error approving timesheet:", error);
      toast({
        title: "Error",
        description: "Failed to approve timesheet",
        variant: "destructive",
      });
    }
  };

  const rejectTimesheet = async (timesheetId: string) => {
    try {
      const { error } = await supabase
        .from("timesheets")
        .update({
          status: "rejected",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: "Requires review" // In real app, would have a form for this
        })
        .eq("id", timesheetId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Timesheet rejected",
      });

      fetchTimesheets();
    } catch (error: any) {
      console.error("Error rejecting timesheet:", error);
      toast({
        title: "Error",
        description: "Failed to reject timesheet",
        variant: "destructive",
      });
    }
  };

  const getCurrentlyWorking = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayPunches = timePunches.filter(punch => 
      punch.punch_time.startsWith(today)
    );

    const working = new Map();
    
    todayPunches.forEach(punch => {
      const userId = punch.user_id;
      if (!working.has(userId)) {
        working.set(userId, { 
          name: punch.profiles?.full_name || 'Unknown',
          status: 'out',
          lastPunch: punch.punch_time
        });
      }

      const current = working.get(userId);
      if (new Date(punch.punch_time) > new Date(current.lastPunch)) {
        working.set(userId, {
          ...current,
          status: punch.punch_type === 'clock_in' || punch.punch_type === 'break_end' ? 'in' : 
                  punch.punch_type === 'break_start' ? 'break' : 'out',
          lastPunch: punch.punch_time
        });
      }
    });

    return Array.from(working.values());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'submitted':
        return <Badge variant="default">Submitted</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPunchTypeIcon = (type: string) => {
    switch (type) {
      case 'clock_in':
        return <Clock className="h-4 w-4 text-green-500" />;
      case 'clock_out':
        return <Clock className="h-4 w-4 text-red-500" />;
      case 'break_start':
      case 'break_end':
        return <Coffee className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredTimesheets = timesheets.filter(timesheet => {
    const matchesSearch = timesheet.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || timesheet.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading time clock data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Time Clock Management</h2>
          <p className="text-muted-foreground">Monitor employee hours and approve timesheets</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="current_week">Current Week</SelectItem>
              <SelectItem value="last_week">Last Week</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="punches">Time Punches</TabsTrigger>
          <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
          <TabsTrigger value="approval">Timesheet Approval</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Currently Working */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Currently Working
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getCurrentlyWorking().map((employee, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{employee.name}</span>
                    </div>
                    <Badge 
                      variant={employee.status === 'in' ? 'default' : 
                              employee.status === 'break' ? 'secondary' : 'outline'}
                    >
                      {employee.status === 'in' ? 'Working' : 
                       employee.status === 'break' ? 'On Break' : 'Clocked Out'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Hours Today</p>
                    <p className="text-2xl font-bold">24.5</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Employees Working</p>
                    <p className="text-2xl font-bold">{getCurrentlyWorking().filter(e => e.status === 'in').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Approved Timesheets</p>
                    <p className="text-2xl font-bold">{timesheets.filter(t => t.status === 'approved').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                    <p className="text-2xl font-bold">{timesheets.filter(t => t.status === 'submitted').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="punches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Time Punches</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Manual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timePunches.slice(0, 20).map((punch) => (
                    <TableRow key={punch.id}>
                      <TableCell>{punch.profiles?.full_name || 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getPunchTypeIcon(punch.punch_type)}
                          <span className="capitalize">{punch.punch_type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(punch.punch_time), 'MMM dd, h:mm a')}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{punch.notes || '-'}</span>
                      </TableCell>
                      <TableCell>
                        {punch.is_manual && (
                          <Badge variant="outline" className="text-orange-600">Manual</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timesheets" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTimesheets.map((timesheet) => (
                  <TableRow key={timesheet.id}>
                    <TableCell>{timesheet.profiles?.full_name || 'Unknown'}</TableCell>
                    <TableCell>
                      {format(new Date(timesheet.period_start), 'MMM dd')} - {format(new Date(timesheet.period_end), 'MMM dd')}
                    </TableCell>
                    <TableCell>{timesheet.total_hours}h</TableCell>
                    <TableCell>
                      {timesheet.overtime_hours > 0 ? (
                        <span className="text-orange-600 font-medium">{timesheet.overtime_hours}h</span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(timesheet.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {timesheet.status === 'submitted' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => approveTimesheet(timesheet.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => rejectTimesheet(timesheet.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="approval">
          <TimesheetApproval />
        </TabsContent>
      </Tabs>
    </div>
  );
};