import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MaintenanceScheduleFormProps {
  onSuccess: () => void;
}

interface TeamMember {
  user_id: string;
  profiles: {
    full_name: string;
  } | null;
}

export const MaintenanceScheduleForm = ({ onSuccess }: MaintenanceScheduleFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  const [formData, setFormData] = useState({
    equipment_name: "",
    maintenance_type: "preventive",
    description: "",
    frequency_type: "monthly",
    frequency_interval: 1,
    next_due_date: "",
    assigned_to: "",
    priority: "medium",
    estimated_duration: 60,
    instructions: ""
  });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
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
          profiles (
            full_name
          )
        `)
        .eq("business_id", membershipData.business_id)
        .eq("is_active", true);

      if (error) throw error;
      setTeamMembers((data as any) || []);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) throw new Error("Business context not found");

      const { error } = await supabase
        .from("maintenance_schedules")
        .insert({
          business_id: membershipData.business_id,
          equipment_name: formData.equipment_name,
          maintenance_type: formData.maintenance_type,
          description: formData.description,
          frequency_type: formData.frequency_type,
          frequency_interval: formData.frequency_interval,
          next_due_date: formData.next_due_date,
          assigned_to: formData.assigned_to || null,
          priority: formData.priority,
          estimated_duration: formData.estimated_duration,
          instructions: formData.instructions,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Maintenance schedule created successfully",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error creating maintenance schedule:", error);
      toast({
        title: "Error",
        description: "Failed to create maintenance schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="equipment_name">Equipment Name</Label>
          <Input
            id="equipment_name"
            placeholder="Enter equipment name"
            value={formData.equipment_name}
            onChange={(e) => setFormData(prev => ({ ...prev, equipment_name: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maintenance_type">Maintenance Type</Label>
          <Select value={formData.maintenance_type} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, maintenance_type: value }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preventive">Preventive</SelectItem>
              <SelectItem value="corrective">Corrective</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency_type">Frequency</Label>
          <Select value={formData.frequency_type} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, frequency_type: value }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency_interval">Every</Label>
          <Input
            id="frequency_interval"
            type="number"
            min="1"
            value={formData.frequency_interval}
            onChange={(e) => setFormData(prev => ({ ...prev, frequency_interval: parseInt(e.target.value) || 1 }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="next_due_date">Next Due Date</Label>
          <Input
            id="next_due_date"
            type="date"
            value={formData.next_due_date}
            onChange={(e) => setFormData(prev => ({ ...prev, next_due_date: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assigned_to">Assign To</Label>
          <Select value={formData.assigned_to} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, assigned_to: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select team member (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  {member.profiles?.full_name || 'Unknown User'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, priority: value }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_duration">Estimated Duration (minutes)</Label>
          <Input
            id="estimated_duration"
            type="number"
            min="1"
            value={formData.estimated_duration}
            onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 60 }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter maintenance description..."
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          placeholder="Enter detailed maintenance instructions..."
          value={formData.instructions}
          onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading || !formData.equipment_name || !formData.next_due_date}>
          {loading ? "Creating..." : "Create Schedule"}
        </Button>
      </div>
    </form>
  );
};