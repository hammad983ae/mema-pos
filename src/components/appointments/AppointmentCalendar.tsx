import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  User, 
  Edit,
  Trash2,
  Phone,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format, isSameDay, addMinutes, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { AppointmentForm } from "./AppointmentForm";

interface Appointment {
  id: string;
  customer_id: string;
  service_id: string;
  provider_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  appointment_type: string;
  total_price: number;
  notes?: string;
  customers?: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
  services?: {
    name: string;
    duration: number;
    price: number;
    color: string;
  };
  provider_profiles?: {
    full_name: string;
  } | null;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  color: string;
}

interface Provider {
  id: string;
  full_name: string;
}

export const AppointmentCalendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedDate, selectedProvider]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAppointments(),
        fetchServices(),
        fetchProviders()
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    if (!user) return;

    try {
      // Get business context
      const { data: membership } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membership) return;

      // Get appointments for selected date
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      let query = supabase
        .from('appointments')
        .select(`
          *,
          customers(first_name, last_name, phone, email),
          services(name, duration, price, color),
          provider_profiles:profiles!appointments_provider_id_fkey(full_name)
        `)
        .eq('business_id', membership.business_id)
        .eq('appointment_date', dateStr)
        .order('start_time', { ascending: true });

      if (selectedProvider !== "all") {
        query = query.eq('provider_id', selectedProvider);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments((data || []) as any);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    }
  };

  const fetchServices = async () => {
    if (!user) return;

    try {
      const { data: membership } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membership) return;

      const { data, error } = await supabase
        .from('services')
        .select('id, name, duration, price, color')
        .eq('business_id', membership.business_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchProviders = async () => {
    if (!user) return;

    try {
      const { data: membership } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membership) return;

      // Get team members who can provide services
      const { data: teamMembers } = await supabase
        .from("user_business_memberships")
        .select(`
          user_id,
          profiles(full_name)
        `)
        .eq("business_id", membership.business_id)
        .eq("is_active", true);

      const providersData = teamMembers?.map(member => ({
        id: member.user_id,
        full_name: (member.profiles as any)?.full_name || 'Unknown'
      })) || [];

      setProviders(providersData);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Appointment ${status}`,
      });

      await fetchAppointments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update appointment",
        variant: "destructive",
      });
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment deleted",
      });

      await fetchAppointments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete appointment",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      scheduled: 'secondary',
      confirmed: 'default',
      in_progress: 'default',
      completed: 'outline',
      cancelled: 'destructive',
      no_show: 'destructive',
      walk_in: 'default'
    } as const;

    const colors = {
      scheduled: 'text-yellow-600',
      confirmed: 'text-blue-600',
      in_progress: 'text-green-600',
      completed: 'text-green-600',
      cancelled: 'text-red-600',
      no_show: 'text-red-600',
      walk_in: 'text-purple-600'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} 
             className={colors[status as keyof typeof colors]}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">Loading appointments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Appointment Calendar</h2>
          <p className="text-muted-foreground">Manage appointments and schedule services</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-[200px]">
              <User className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showAppointmentForm} onOpenChange={setShowAppointmentForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Book New Appointment</DialogTitle>
              </DialogHeader>
              <AppointmentForm
                selectedDate={selectedDate}
                services={services}
                providers={providers}
                onSuccess={() => {
                  setShowAppointmentForm(false);
                  fetchAppointments();
                }}
                onCancel={() => setShowAppointmentForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className={cn("w-full pointer-events-auto")}
            />
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </div>
              <Badge variant="outline">
                {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No appointments scheduled for this day</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setShowAppointmentForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Book First Appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: appointment.services?.color || '#3B82F6' }}
                          />
                          <h4 className="font-medium">{appointment.services?.name}</h4>
                          {getStatusBadge(appointment.status)}
                          {appointment.appointment_type === 'walk_in' && (
                            <Badge variant="outline" className="text-purple-600">
                              Walk-in
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span>
                              <Clock className="h-3 w-3 inline mr-1" />
                              {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                            </span>
                            <span>
                              <User className="h-3 w-3 inline mr-1" />
                              {appointment.provider_profiles?.full_name}
                            </span>
                            <span className="font-medium text-green-600">
                              {formatPrice(appointment.total_price)}
                            </span>
                          </div>
                          
                          {appointment.customers && (
                            <div className="flex items-center gap-4">
                              <span>
                                {appointment.customers.first_name} {appointment.customers.last_name}
                              </span>
                              {appointment.customers.phone && (
                                <span>
                                  <Phone className="h-3 w-3 inline mr-1" />
                                  {appointment.customers.phone}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {appointment.notes && (
                            <p className="text-sm">{appointment.notes}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {appointment.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirm
                          </Button>
                        )}
                        
                        {appointment.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment.id, 'in_progress')}
                          >
                            Start
                          </Button>
                        )}
                        
                        {appointment.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedAppointment(appointment)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteAppointment(appointment.id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Appointment Dialog */}
      {selectedAppointment && (
        <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Appointment</DialogTitle>
            </DialogHeader>
            <AppointmentForm
              appointment={selectedAppointment}
              selectedDate={selectedDate}
              services={services}
              providers={providers}
              onSuccess={() => {
                setSelectedAppointment(null);
                fetchAppointments();
              }}
              onCancel={() => setSelectedAppointment(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};