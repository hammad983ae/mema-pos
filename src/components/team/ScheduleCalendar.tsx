import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";

interface Shift {
  id: string;
  user_id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  break_duration: number;
  store_id: string;
  status: string;
  notes?: string;
  profiles?: {
    full_name: string;
  };
  stores?: {
    name: string;
  };
}

interface ScheduleCalendarProps {
  userRole: string;
}

export const ScheduleCalendar = ({ userRole }: ScheduleCalendarProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState<string>("");

  const canManageSchedules = userRole === 'business_owner' || userRole === 'manager';

  useEffect(() => {
    if (user) {
      fetchScheduleData();
    }
  }, [user, currentDate]);

  const fetchScheduleData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's business context
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      setBusinessId(membershipData.business_id);

      // Get week range
      const weekStart = startOfWeek(currentDate);
      const weekEnd = addDays(weekStart, 6);

      // Fetch shifts for the week
      const { data: shiftsData, error } = await supabase
        .from("employee_schedules")
        .select(`
          *,
          stores(name)
        `)
        .eq("business_id", membershipData.business_id)
        .gte("schedule_date", format(weekStart, 'yyyy-MM-dd'))
        .lte("schedule_date", format(weekEnd, 'yyyy-MM-dd'))
        .order("schedule_date")
        .order("start_time");

      if (error) throw error;

      // Get user profiles for the shifts
      const userIds = [...new Set(shiftsData?.map(shift => shift.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      // Transform shifts to include profile data
      const transformedShifts = shiftsData?.map(shift => ({
        ...shift,
        profiles: profilesData?.find(p => p.user_id === shift.user_id) || null
      })) || [];

      setShifts(transformedShifts as unknown as Shift[]);

      // Fetch employees and stores for form dropdowns
      if (canManageSchedules) {
        const [employeesRes, storesRes] = await Promise.all([
          supabase
            .from("user_business_memberships")
            .select("user_id")
            .eq("business_id", membershipData.business_id)
            .eq("is_active", true),
          supabase
            .from("stores")
            .select("id, name")
            .eq("business_id", membershipData.business_id)
        ]);

        // Get profiles for employees
        const employeeUserIds = employeesRes.data?.map(emp => emp.user_id) || [];
        const { data: employeeProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', employeeUserIds);

        // Transform employees to include profile data
        const transformedEmployees = employeesRes.data?.map(emp => ({
          ...emp,
          profiles: employeeProfiles?.find(p => p.user_id === emp.user_id) || null
        })) || [];

        setEmployees(transformedEmployees);
        setStores(storesRes.data || []);
      }

    } catch (error) {
      console.error("Error fetching schedule data:", error);
      toast({
        title: "Error",
        description: "Failed to load schedule data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveShift = async (shiftData: any) => {
    try {
      if (editingShift) {
        // Update existing shift
        const { error } = await supabase
          .from("employee_schedules")
          .update({
            user_id: shiftData.user_id,
            schedule_date: shiftData.schedule_date,
            start_time: shiftData.start_time,
            end_time: shiftData.end_time,
            break_duration: parseInt(shiftData.break_duration),
            store_id: shiftData.store_id,
            notes: shiftData.notes,
          })
          .eq("id", editingShift.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Shift updated successfully",
        });
      } else {
        // Create new shift
        const { error } = await supabase
          .from("employee_schedules")
          .insert({
            business_id: businessId,
            user_id: shiftData.user_id,
            schedule_date: shiftData.schedule_date,
            start_time: shiftData.start_time,
            end_time: shiftData.end_time,
            break_duration: parseInt(shiftData.break_duration),
            store_id: shiftData.store_id,
            notes: shiftData.notes,
            status: 'scheduled',
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Shift created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingShift(null);
      fetchScheduleData();

    } catch (error) {
      console.error("Error saving shift:", error);
      toast({
        title: "Error",
        description: "Failed to save shift",
        variant: "destructive",
      });
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      const { error } = await supabase
        .from("employee_schedules")
        .delete()
        .eq("id", shiftId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shift deleted successfully",
      });

      fetchScheduleData();

    } catch (error) {
      console.error("Error deleting shift:", error);
      toast({
        title: "Error",
        description: "Failed to delete shift",
        variant: "destructive",
      });
    }
  };

  const getShiftsForDay = (date: Date) => {
    return shifts.filter(shift => 
      isSameDay(parseISO(shift.schedule_date), date)
    );
  };

  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading schedule...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">
            Week of {format(weekStart, 'MMM d, yyyy')}
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {canManageSchedules && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingShift(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Shift
              </Button>
            </DialogTrigger>
            <ShiftDialog
              shift={editingShift}
              employees={employees}
              stores={stores}
              onSave={handleSaveShift}
              onClose={() => {
                setIsDialogOpen(false);
                setEditingShift(null);
              }}
            />
          </Dialog>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dayShifts = getShiftsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <Card key={index} className={`min-h-[300px] ${isToday ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-center">
                  <div className="text-sm font-medium text-muted-foreground">
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-lg font-bold ${isToday ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {dayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors relative group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {shift.profiles?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {canManageSchedules && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setEditingShift(shift);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => handleDeleteShift(shift.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="font-medium">
                        {shift.profiles?.full_name || 'Unknown'}
                      </div>
                      <div className="text-muted-foreground">
                        {shift.start_time} - {shift.end_time}
                      </div>
                      <div className="text-muted-foreground">
                        {shift.stores?.name || 'Unknown Store'}
                      </div>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(shift.status)}`}>
                        {shift.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

interface ShiftDialogProps {
  shift: Shift | null;
  employees: any[];
  stores: any[];
  onSave: (data: any) => void;
  onClose: () => void;
}

const ShiftDialog = ({ shift, employees, stores, onSave, onClose }: ShiftDialogProps) => {
  const [formData, setFormData] = useState({
    user_id: shift?.user_id || '',
    schedule_date: shift?.schedule_date || format(new Date(), 'yyyy-MM-dd'),
    start_time: shift?.start_time || '09:00',
    end_time: shift?.end_time || '17:00',
    break_duration: shift?.break_duration?.toString() || '30',
    store_id: shift?.store_id || '',
    notes: shift?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {shift ? 'Edit Shift' : 'Add New Shift'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="employee">Employee</Label>
          <Select
            value={formData.user_id}
            onValueChange={(value) => setFormData({ ...formData, user_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.user_id} value={emp.user_id}>
                  {emp.profiles?.full_name || 'Unknown'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            type="date"
            value={formData.schedule_date}
            onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_time">Start Time</Label>
            <Input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="end_time">End Time</Label>
            <Input
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="break_duration">Break Duration (minutes)</Label>
          <Input
            type="number"
            min="0"
            max="120"
            value={formData.break_duration}
            onChange={(e) => setFormData({ ...formData, break_duration: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="store">Store</Label>
          <Select
            value={formData.store_id}
            onValueChange={(value) => setFormData({ ...formData, store_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select store" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Input
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional notes..."
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {shift ? 'Update' : 'Create'} Shift
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};