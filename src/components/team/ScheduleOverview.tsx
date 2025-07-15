import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, Users, Plus, Filter, Download, TrendingUp, AlertTriangle } from "lucide-react";

interface ScheduleOverviewProps {
  userRole: string;
}

export const ScheduleOverview = ({ userRole }: ScheduleOverviewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedWeek, setSelectedWeek] = useState("current");
  const [selectedStore, setSelectedStore] = useState("all");
  const [loading, setLoading] = useState(true);
  const [weekSummary, setWeekSummary] = useState({
    totalShifts: 0,
    totalHours: 0,
    avgHoursPerEmployee: 0,
    pendingRequests: 0,
    coverageGaps: 0,
    overtimeHours: 0,
  });

  // Mock data for demonstration
  const shifts = [
    {
      id: 1,
      employee: "Sarah Chen",
      initials: "SC",
      role: "Store Manager",
      store: "Downtown Store",
      date: "Mon, Jan 22",
      startTime: "9:00 AM",
      endTime: "6:00 PM",
      hours: 8,
      status: "confirmed",
      break: "12:00-1:00 PM"
    },
    {
      id: 2,
      employee: "Mike Torres",
      initials: "MT",
      role: "Sales Associate",
      store: "Mall Location",
      date: "Mon, Jan 22",
      startTime: "10:00 AM",
      endTime: "7:00 PM",
      hours: 8,
      status: "confirmed",
      break: "2:00-3:00 PM"
    },
    {
      id: 3,
      employee: "Emma Johnson",
      initials: "EJ",
      role: "Esthetician",
      store: "Westside Spa",
      date: "Mon, Jan 22",
      startTime: "11:00 AM",
      endTime: "8:00 PM",
      hours: 8,
      status: "pending",
      break: "3:00-4:00 PM"
    },
    {
      id: 4,
      employee: "David Kim",
      initials: "DK",
      role: "Assistant Manager",
      store: "Downtown Store",
      date: "Tue, Jan 23",
      startTime: "8:00 AM",
      endTime: "5:00 PM",
      hours: 8,
      status: "confirmed",
      break: "12:30-1:30 PM"
    },
    {
      id: 5,
      employee: "Lisa Park",
      initials: "LP",
      role: "Inventory Lead",
      store: "All Stores",
      date: "Tue, Jan 23",
      startTime: "7:00 AM",
      endTime: "4:00 PM",
      hours: 8,
      status: "confirmed",
      break: "11:00-12:00 PM"
    }
  ];

  const upcomingRequests = [
    {
      id: 1,
      employee: "Mike Torres",
      initials: "MT",
      type: "Time Off",
      dates: "Jan 25-26",
      reason: "Personal",
      status: "pending",
      submitted: "2 days ago"
    },
    {
      id: 2,
      employee: "Emma Johnson",
      initials: "EJ",
      type: "Shift Swap",
      dates: "Jan 24",
      reason: "Doctor appointment",
      status: "approved",
      submitted: "1 day ago"
    },
    {
      id: 3,
      employee: "Sarah Chen",
      initials: "SC",
      type: "Schedule Change",
      dates: "Jan 27",
      reason: "Training session",
      status: "pending",
      submitted: "3 hours ago"
    }
  ];

  useEffect(() => {
    if (user) {
      fetchScheduleOverview();
    }
  }, [user, selectedWeek]);

  const fetchScheduleOverview = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Calculate mock statistics
      setWeekSummary({
        totalShifts: 45,
        totalHours: 368,
        avgHoursPerEmployee: 24.5,
        pendingRequests: 8,
        coverageGaps: 2,
        overtimeHours: 12,
      });

    } catch (error) {
      console.error("Error fetching schedule overview:", error);
      toast({
        title: "Error",
        description: "Failed to load schedule overview",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Confirmed</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Approved</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRequestTypeBadge = (type: string) => {
    switch (type) {
      case "Time Off":
        return <Badge variant="outline">Time Off</Badge>;
      case "Shift Swap":
        return <Badge variant="secondary">Shift Swap</Badge>;
      case "Schedule Change":
        return <Badge variant="outline">Schedule Change</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading schedule overview...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Week Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Shifts</p>
                <p className="text-2xl font-bold text-foreground">{weekSummary.totalShifts}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold text-foreground">{weekSummary.totalHours}</p>
              </div>
              <Clock className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Hours/Employee</p>
                <p className="text-2xl font-bold text-foreground">{weekSummary.avgHoursPerEmployee}</p>
              </div>
              <Users className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold text-foreground">{weekSummary.pendingRequests}</p>
              </div>
              <Clock className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Coverage Gaps</p>
                <p className="text-2xl font-bold text-foreground">{weekSummary.coverageGaps}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overtime Hours</p>
                <p className="text-2xl font-bold text-foreground">{weekSummary.overtimeHours}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Weekly Schedule</span>
              </CardTitle>
              <div className="flex items-center space-x-3">
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Week</SelectItem>
                    <SelectItem value="next">Next Week</SelectItem>
                    <SelectItem value="previous">Previous Week</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Stores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stores</SelectItem>
                    <SelectItem value="downtown">Downtown Store</SelectItem>
                    <SelectItem value="mall">Mall Location</SelectItem>
                    <SelectItem value="westside">Westside Spa</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shifts.map((shift) => (
                <div key={shift.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {shift.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{shift.employee}</p>
                        <p className="text-sm text-muted-foreground">{shift.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(shift.status)}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{shift.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{shift.startTime} - {shift.endTime}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{shift.store}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{shift.hours}h</span>
                      <p className="text-xs text-muted-foreground">Break: {shift.break}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {shifts.length} shifts for current week
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Schedule
                </Button>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Shift
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Pending Requests</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {request.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{request.employee}</p>
                        <p className="text-xs text-muted-foreground">{request.submitted}</p>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      {getRequestTypeBadge(request.type)}
                      <span className="text-sm font-medium">{request.dates}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                    
                    {request.status === "pending" && (
                      <div className="flex items-center space-x-2 pt-2">
                        <Button size="sm" className="h-7 text-xs">
                          Approve
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" size="sm">
                View All Requests
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};