import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, User, DollarSign } from "lucide-react";
import { format, addMinutes, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}

interface AppointmentFormProps {
  appointment?: any;
  selectedDate: Date;
  services: Service[];
  providers: Provider[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const AppointmentForm = ({
  appointment,
  selectedDate,
  services,
  providers,
  onSuccess,
  onCancel
}: AppointmentFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    customer_id: appointment?.customer_id || '',
    service_id: appointment?.service_id || '',
    provider_id: appointment?.provider_id || '',
    appointment_date: appointment?.appointment_date || format(selectedDate, 'yyyy-MM-dd'),
    start_time: appointment?.start_time || '',
    appointment_type: appointment?.appointment_type || 'scheduled',
    notes: appointment?.notes || '',
    // New customer fields
    first_name: '',
    last_name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
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
        .from('customers')
        .select('id, first_name, last_name, phone, email')
        .eq('business_id', membership.business_id)
        .order('first_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Get business context
      const { data: membership } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membership) throw new Error("No business membership found");

      let customerId = formData.customer_id;

      // Create new customer if needed
      if (isNewCustomer || !customerId) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert([{
            business_id: membership.business_id,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            email: formData.email
          }])
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      // Get service details for pricing and duration
      const selectedService = services.find(s => s.id === formData.service_id);
      if (!selectedService) throw new Error("Service not found");

      // Calculate end time
      const startDateTime = parseISO(`${formData.appointment_date}T${formData.start_time}`);
      const endDateTime = addMinutes(startDateTime, selectedService.duration);
      const endTime = format(endDateTime, 'HH:mm:ss');

      const appointmentData = {
        business_id: membership.business_id,
        customer_id: customerId,
        service_id: formData.service_id,
        provider_id: formData.provider_id,
        appointment_date: formData.appointment_date,
        start_time: formData.start_time,
        end_time: endTime,
        appointment_type: formData.appointment_type,
        total_price: selectedService.price,
        status: 'scheduled',
        notes: formData.notes || null,
        created_by: user.id
      };

      if (appointment) {
        // Update existing appointment
        const { error } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', appointment.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Appointment updated successfully",
        });
      } else {
        // Create new appointment
        const { error } = await supabase
          .from('appointments')
          .insert([appointmentData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Appointment booked successfully",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving appointment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save appointment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const selectedService = services.find(s => s.id === formData.service_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Selection */}
      <div className="space-y-4">
        <Label>Customer</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={!isNewCustomer ? "default" : "outline"}
            onClick={() => setIsNewCustomer(false)}
            className="flex-1"
          >
            <User className="h-4 w-4 mr-2" />
            Existing Customer
          </Button>
          <Button
            type="button"
            variant={isNewCustomer ? "default" : "outline"}
            onClick={() => setIsNewCustomer(true)}
            className="flex-1"
          >
            New Customer
          </Button>
        </div>

        {isNewCustomer ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>
        ) : (
          <Select
            value={formData.customer_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.first_name} {customer.last_name} - {customer.phone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Service Selection */}
      <div>
        <Label htmlFor="service_id">Service</Label>
        <Select
          value={formData.service_id}
          onValueChange={(value) => setFormData(prev => ({ ...prev, service_id: value }))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a service" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: service.color }}
                  />
                  <span>{service.name}</span>
                  <span className="text-muted-foreground">
                    ({service.duration}min - ${service.price})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedService && (
          <div className="mt-2 p-3 bg-muted rounded-md">
            <div className="flex items-center justify-between text-sm">
              <span>Duration: {selectedService.duration} minutes</span>
              <span className="font-medium text-green-600">
                ${selectedService.price}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Provider Selection */}
      <div>
        <Label htmlFor="provider_id">Provider</Label>
        <Select
          value={formData.provider_id}
          onValueChange={(value) => setFormData(prev => ({ ...prev, provider_id: value }))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.appointment_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.appointment_date ? 
                  format(parseISO(formData.appointment_date), "PPP") : 
                  <span>Pick a date</span>
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.appointment_date ? parseISO(formData.appointment_date) : undefined}
                onSelect={(date) => date && setFormData(prev => ({ 
                  ...prev, 
                  appointment_date: format(date, 'yyyy-MM-dd') 
                }))}
                disabled={(date) => date < new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="start_time">Start Time</Label>
          <Select
            value={formData.start_time}
            onValueChange={(value) => setFormData(prev => ({ ...prev, start_time: value }))}
            required
          >
            <SelectTrigger>
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {generateTimeSlots().map((time) => (
                <SelectItem key={time} value={time}>
                  {format(parseISO(`2000-01-01T${time}`), 'h:mm a')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Appointment Type */}
      <div>
        <Label htmlFor="appointment_type">Appointment Type</Label>
        <Select
          value={formData.appointment_type}
          onValueChange={(value) => setFormData(prev => ({ ...prev, appointment_type: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="walk_in">Walk-in</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Any special notes or requirements..."
          rows={3}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : appointment ? "Update Appointment" : "Book Appointment"}
        </Button>
      </div>
    </form>
  );
};