import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TaskAssignmentFormProps {
  onSuccess: () => void;
}

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  task_type: string;
  estimated_duration: number;
}

interface TeamMember {
  user_id: string;
  profiles: {
    full_name: string;
  } | null;
}

export const TaskAssignmentForm = ({ onSuccess }: TaskAssignmentFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  const [formData, setFormData] = useState({
    template_id: "",
    assigned_to: "",
    due_date: "",
    due_time: "",
    priority: "medium",
    notes: "",
    recurring_type: "none"
  });

  useEffect(() => {
    fetchTemplates();
    fetchTeamMembers();
  }, []);

  const fetchTemplates = async () => {
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
        .from("task_templates")
        .select("*")
        .eq("business_id", membershipData.business_id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

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
        .from("task_assignments")
        .insert({
          business_id: membershipData.business_id,
          template_id: formData.template_id,
          assigned_to: formData.assigned_to,
          assigned_by: user.id,
          due_date: formData.due_date || null,
          due_time: formData.due_time || null,
          priority: formData.priority,
          notes: formData.notes || null,
          recurring_type: formData.recurring_type
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task assigned successfully",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error assigning task:", error);
      toast({
        title: "Error",
        description: "Failed to assign task",
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
          <Label htmlFor="template_id">Task Template</Label>
          <Select value={formData.template_id} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, template_id: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select task template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name} ({template.task_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assigned_to">Assign To</Label>
          <Select value={formData.assigned_to} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, assigned_to: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map((member) => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  {member.profiles?.full_name || 'Unknown User'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date">Due Date</Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_time">Due Time</Label>
          <Input
            id="due_time"
            type="time"
            value={formData.due_time}
            onChange={(e) => setFormData(prev => ({ ...prev, due_time: e.target.value }))}
          />
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
          <Label htmlFor="recurring_type">Recurring</Label>
          <Select value={formData.recurring_type} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, recurring_type: value }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Additional notes or instructions..."
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading || !formData.template_id || !formData.assigned_to}>
          {loading ? "Assigning..." : "Assign Task"}
        </Button>
      </div>
    </form>
  );
};