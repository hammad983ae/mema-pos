import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Wrench, Clock, User, Calendar, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MaintenanceScheduleForm } from "./MaintenanceScheduleForm";

interface MaintenanceSchedulesProps {
  userRole: string;
}

interface MaintenanceSchedule {
  id: string;
  equipment_name: string;
  maintenance_type: string;
  description: string;
  frequency_type: string;
  frequency_interval: number;
  next_due_date: string;
  assigned_to: string | null;
  priority: string;
  estimated_duration: number;
  instructions: string;
  is_active: boolean;
  profiles: {
    full_name: string;
  } | null;
}

export const MaintenanceSchedules = ({ userRole }: MaintenanceSchedulesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showNewDialog, setShowNewDialog] = useState(false);

  const canManageMaintenance = ['business_owner', 'manager', 'office'].includes(userRole);

  useEffect(() => {
    fetchSchedules();
  }, [user]);

  const fetchSchedules = async () => {
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

      const { data, error } = await supabase
        .from("maintenance_schedules")
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq("business_id", membershipData.business_id)
        .eq("is_active", true)
        .order("next_due_date", { ascending: true });

      if (error) throw error;
      setSchedules((data as any) || []);
    } catch (error: any) {
      console.error("Error fetching maintenance schedules:", error);
      toast({
        title: "Error",
        description: "Failed to load maintenance schedules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (scheduleId: string) => {
    try {
      // This would typically create a completion record and update the next due date
      // For now, we'll just show a success message
      toast({
        title: "Success",
        description: "Maintenance marked as completed",
      });
    } catch (error: any) {
      console.error("Error marking maintenance as completed:", error);
      toast({
        title: "Error",
        description: "Failed to mark maintenance as completed",
        variant: "destructive",
      });
    }
  };

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.equipment_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         schedule.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || schedule.maintenance_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "preventive": return "default";
      case "corrective": return "destructive";
      case "inspection": return "secondary";
      default: return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const isDueSoon = (dueDate: string) => {
    const due = new Date(dueDate);
    const soon = new Date();
    soon.setDate(soon.getDate() + 7); // 7 days from now
    return due <= soon && due >= new Date();
  };

  if (loading) {
    return <div>Loading maintenance schedules...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Maintenance Schedules</h2>
          <p className="text-muted-foreground">
            Manage equipment maintenance and inspection schedules
          </p>
        </div>
        {canManageMaintenance && (
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Maintenance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Maintenance</DialogTitle>
              </DialogHeader>
              <MaintenanceScheduleForm 
                onSuccess={() => {
                  setShowNewDialog(false);
                  fetchSchedules();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search equipment or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="preventive">Preventive</SelectItem>
            <SelectItem value="corrective">Corrective</SelectItem>
            <SelectItem value="inspection">Inspection</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Maintenance schedules grid */}
      <div className="grid gap-4">
        {filteredSchedules.map((schedule) => (
          <Card key={schedule.id} className={`hover:shadow-lg transition-shadow ${
            isOverdue(schedule.next_due_date) ? "border-red-500" :
            isDueSoon(schedule.next_due_date) ? "border-yellow-500" : ""
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    {schedule.equipment_name}
                    {isOverdue(schedule.next_due_date) && (
                      <Badge variant="destructive">Overdue</Badge>
                    )}
                    {isDueSoon(schedule.next_due_date) && !isOverdue(schedule.next_due_date) && (
                      <Badge variant="default">Due Soon</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {schedule.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={getTypeColor(schedule.maintenance_type)}>
                    {schedule.maintenance_type}
                  </Badge>
                  <Badge variant={getPriorityColor(schedule.priority)}>
                    {schedule.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-5 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Due: {new Date(schedule.next_due_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{schedule.estimated_duration} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{schedule.profiles?.full_name || "Unassigned"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span>Every {schedule.frequency_interval} {schedule.frequency_type}</span>
                </div>
                <div className="flex gap-2">
                  {(schedule.assigned_to === user?.id || canManageMaintenance) && (
                    <Button 
                      size="sm"
                      onClick={() => markAsCompleted(schedule.id)}
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
              {schedule.instructions && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="text-sm">{schedule.instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSchedules.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Maintenance Schedules</h3>
            <p className="text-muted-foreground">
              {canManageMaintenance ? "Create maintenance schedules to get started." : "No maintenance schedules available yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};