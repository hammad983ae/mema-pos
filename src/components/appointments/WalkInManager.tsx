import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  UserPlus, 
  Clock, 
  Users, 
  CheckCircle,
  XCircle,
  Timer,
  AlertCircle
} from "lucide-react";
import { format, addMinutes, parseISO } from "date-fns";

interface WalkIn {
  id: string;
  customer_name: string;
  phone?: string;
  service_requested: string;
  arrived_at: string;
  estimated_wait: number;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Provider {
  id: string;
  full_name: string;
}

export const WalkInManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [walkIns, setWalkIns] = useState<WalkIn[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWalkIn, setNewWalkIn] = useState({
    customer_name: '',
    phone: '',
    service_id: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchData();
      // Refresh data every 30 seconds
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchWalkIns(),
        fetchServices(),
        fetchProviders()
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalkIns = async () => {
    if (!user) return;

    try {
      const { data: membership } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membership) return;

      // Get today's walk-ins
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          status,
          notes,
          created_at,
          customers(first_name, last_name, phone),
          services(name, duration)
        `)
        .eq('business_id', membership.business_id)
        .eq('appointment_date', today)
        .eq('appointment_type', 'walk_in')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match WalkIn interface
      const walkInData: WalkIn[] = (data || []).map(appointment => ({
        id: appointment.id,
        customer_name: appointment.customers 
          ? `${appointment.customers.first_name} ${appointment.customers.last_name}`
          : 'Walk-in Customer',
        phone: appointment.customers?.phone,
        service_requested: appointment.services?.name || 'Service',
        arrived_at: appointment.created_at,
        estimated_wait: appointment.services?.duration || 30,
        status: appointment.status as WalkIn['status'],
        notes: appointment.notes
      }));

      setWalkIns(walkInData);
    } catch (error: any) {
      console.error('Error fetching walk-ins:', error);
      toast({
        title: "Error",
        description: "Failed to load walk-ins",
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
        .select('id, name, duration, price')
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

  const addWalkIn = async () => {
    if (!user || !newWalkIn.customer_name || !newWalkIn.service_id) return;

    try {
      const { data: membership } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membership) throw new Error("No business membership found");

      // Create customer first
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert([{
          business_id: membership.business_id,
          first_name: newWalkIn.customer_name.split(' ')[0] || newWalkIn.customer_name,
          last_name: newWalkIn.customer_name.split(' ').slice(1).join(' ') || '',
          phone: newWalkIn.phone || null
        }])
        .select()
        .single();

      if (customerError) throw customerError;

      // Get service details
      const selectedService = services.find(s => s.id === newWalkIn.service_id);
      if (!selectedService) throw new Error("Service not found");

      // Create appointment
      const now = new Date();
      const endTime = addMinutes(now, selectedService.duration);

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert([{
          business_id: membership.business_id,
          customer_id: customer.id,
          service_id: newWalkIn.service_id,
          provider_id: providers[0]?.id || user.id, // Default to first provider or current user
          appointment_date: format(now, 'yyyy-MM-dd'),
          start_time: format(now, 'HH:mm:ss'),
          end_time: format(endTime, 'HH:mm:ss'),
          appointment_type: 'walk_in',
          status: 'waiting',
          total_price: selectedService.price,
          notes: newWalkIn.notes || null,
          created_by: user.id
        }]);

      if (appointmentError) throw appointmentError;

      toast({
        title: "Success",
        description: "Walk-in customer added to queue",
      });

      setNewWalkIn({
        customer_name: '',
        phone: '',
        service_id: '',
        notes: ''
      });
      setShowAddForm(false);
      await fetchWalkIns();
    } catch (error: any) {
      console.error('Error adding walk-in:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add walk-in",
        variant: "destructive",
      });
    }
  };

  const updateWalkInStatus = async (walkInId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', walkInId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Walk-in ${status}`,
      });

      await fetchWalkIns();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update walk-in",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      waiting: 'secondary',
      in_progress: 'default',
      completed: 'outline',
      cancelled: 'destructive'
    } as const;

    const colors = {
      waiting: 'text-yellow-600',
      in_progress: 'text-blue-600',
      completed: 'text-green-600',
      cancelled: 'text-red-600'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} 
             className={colors[status as keyof typeof colors]}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getWaitTime = (arrivedAt: string) => {
    const now = new Date();
    const arrived = new Date(arrivedAt);
    const waitMinutes = Math.floor((now.getTime() - arrived.getTime()) / (1000 * 60));
    return waitMinutes;
  };

  const formatTime = (timeString: string) => {
    return format(new Date(timeString), 'h:mm a');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">Loading walk-ins...</div>
      </div>
    );
  }

  const waitingCount = walkIns.filter(w => w.status === 'waiting').length;
  const inProgressCount = walkIns.filter(w => w.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Walk-In Manager</h2>
          <p className="text-muted-foreground">Manage walk-in customers and queue</p>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Walk-In
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Walk-In Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  value={newWalkIn.customer_name}
                  onChange={(e) => setNewWalkIn(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newWalkIn.phone}
                  onChange={(e) => setNewWalkIn(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="service_id">Service Requested</Label>
                <Select
                  value={newWalkIn.service_id}
                  onValueChange={(value) => setNewWalkIn(prev => ({ ...prev, service_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.duration}min - ${service.price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={newWalkIn.notes}
                  onChange={(e) => setNewWalkIn(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any special notes"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button onClick={addWalkIn} disabled={!newWalkIn.customer_name || !newWalkIn.service_id}>
                  Add to Queue
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Waiting</p>
                <p className="text-2xl font-bold">{waitingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Timer className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Today</p>
                <p className="text-2xl font-bold">{walkIns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Walk-In Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Walk-In Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {walkIns.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No walk-ins today</p>
              <Button 
                className="mt-4" 
                onClick={() => setShowAddForm(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add First Walk-In
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {walkIns.map((walkIn) => (
                <div 
                  key={walkIn.id} 
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{walkIn.customer_name}</h4>
                        {getStatusBadge(walkIn.status)}
                        {getWaitTime(walkIn.arrived_at) > 30 && walkIn.status === 'waiting' && (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Long Wait
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>Service: {walkIn.service_requested}</span>
                          <span>Arrived: {formatTime(walkIn.arrived_at)}</span>
                          <span>Wait Time: {getWaitTime(walkIn.arrived_at)}min</span>
                        </div>
                        
                        {walkIn.phone && (
                          <div>Phone: {walkIn.phone}</div>
                        )}
                        
                        {walkIn.notes && (
                          <div>Notes: {walkIn.notes}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {walkIn.status === 'waiting' && (
                        <Button
                          size="sm"
                          onClick={() => updateWalkInStatus(walkIn.id, 'in_progress')}
                        >
                          Start Service
                        </Button>
                      )}
                      
                      {walkIn.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => updateWalkInStatus(walkIn.id, 'completed')}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </Button>
                      )}
                      
                      {(walkIn.status === 'waiting' || walkIn.status === 'in_progress') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateWalkInStatus(walkIn.id, 'cancelled')}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};