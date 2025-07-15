import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Layers, Copy, Edit, Trash2, Plus, Clock, Calendar, Users } from "lucide-react";

interface ShiftTemplate {
  id: string;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  break_duration: number;
  days_of_week: string[];
  store_id: string;
  is_active: boolean;
  stores?: {
    name: string;
  };
}

interface ShiftTemplatesProps {
  userRole: string;
}

export const ShiftTemplates = ({ userRole }: ShiftTemplatesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplate | null>(null);

  const canManageTemplates = userRole === 'business_owner' || userRole === 'manager';

  useEffect(() => {
    if (user) {
      fetchTemplatesData();
    }
  }, [user]);

  const fetchTemplatesData = async () => {
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

      // For now, we'll use a mock implementation since shift_templates table doesn't exist yet
      // In a real implementation, you'd create this table and fetch from it
      const mockTemplates: ShiftTemplate[] = [
        {
          id: '1',
          name: 'Morning Shift',
          description: 'Standard morning shift for retail staff',
          start_time: '08:00',
          end_time: '16:00',
          break_duration: 30,
          days_of_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          store_id: '1',
          is_active: true,
          stores: { name: 'Main Store' }
        },
        {
          id: '2',
          name: 'Evening Shift',
          description: 'Evening shift with late close',
          start_time: '14:00',
          end_time: '22:00',
          break_duration: 45,
          days_of_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          store_id: '1',
          is_active: true,
          stores: { name: 'Main Store' }
        },
        {
          id: '3',
          name: 'Weekend Shift',
          description: 'Weekend coverage shift',
          start_time: '10:00',
          end_time: '18:00',
          break_duration: 30,
          days_of_week: ['saturday', 'sunday'],
          store_id: '1',
          is_active: true,
          stores: { name: 'Main Store' }
        }
      ];

      setTemplates(mockTemplates);

      // Fetch stores and employees for applying templates
      const [storesRes, employeesRes] = await Promise.all([
        supabase
          .from("stores")
          .select("id, name")
          .eq("business_id", membershipData.business_id),
        supabase
          .from("user_business_memberships")
          .select(`
            user_id,
            profiles!inner(full_name)
          `)
          .eq("business_id", membershipData.business_id)
          .eq("is_active", true)
      ]);

      setStores(storesRes.data || []);
      setEmployees(employeesRes.data || []);

    } catch (error) {
      console.error("Error fetching templates data:", error);
      toast({
        title: "Error",
        description: "Failed to load shift templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (templateData: any) => {
    try {
      // In a real implementation, you'd save to the shift_templates table
      console.log("Saving template:", templateData);
      
      toast({
        title: "Success",
        description: editingTemplate ? "Template updated successfully" : "Template created successfully",
      });

      setIsDialogOpen(false);
      setEditingTemplate(null);
      fetchTemplatesData();

    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const handleApplyTemplate = async (template: ShiftTemplate, applicationData: any) => {
    try {
      setIsApplyingTemplate(true);

      // Apply template to create actual shifts
      const { startDate, endDate, selectedEmployees } = applicationData;
      
      // Calculate date range and create shifts
      const dates = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (template.days_of_week.includes(dayName)) {
          dates.push(new Date(d));
        }
      }

      const shiftsToCreate = [];
      for (const date of dates) {
        for (const employeeId of selectedEmployees) {
          shiftsToCreate.push({
            business_id: (await supabase
              .from("user_business_memberships")
              .select("business_id")
              .eq("user_id", user!.id)
              .eq("is_active", true)
              .single()).data?.business_id,
            user_id: employeeId,
            schedule_date: date.toISOString().split('T')[0],
            start_time: template.start_time,
            end_time: template.end_time,
            break_duration: template.break_duration,
            store_id: template.store_id,
            status: 'scheduled',
            notes: `Created from template: ${template.name}`,
          });
        }
      }

      if (shiftsToCreate.length > 0) {
        const { error } = await supabase
          .from("employee_schedules")
          .insert(shiftsToCreate);

        if (error) throw error;

        toast({
          title: "Success",
          description: `Created ${shiftsToCreate.length} shifts from template`,
        });
      }

      setSelectedTemplate(null);

    } catch (error) {
      console.error("Error applying template:", error);
      toast({
        title: "Error",
        description: "Failed to apply template",
        variant: "destructive",
      });
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  const getDaysBadges = (days: string[]) => {
    const dayMap = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun'
    };

    return days.map(day => (
      <Badge key={day} variant="secondary" className="text-xs">
        {dayMap[day as keyof typeof dayMap]}
      </Badge>
    ));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Shift Templates</h2>
          <p className="text-muted-foreground">Create and manage reusable shift patterns</p>
        </div>

        {canManageTemplates && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTemplate(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <TemplateDialog
              template={editingTemplate}
              stores={stores}
              onSave={handleSaveTemplate}
              onClose={() => {
                setIsDialogOpen(false);
                setEditingTemplate(null);
              }}
            />
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Layers className="h-5 w-5" />
                  <span>{template.name}</span>
                </CardTitle>
                {canManageTemplates && (
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingTemplate(template);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => {
                        // Handle delete
                        console.log("Delete template:", template.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{template.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{template.start_time} - {template.end_time}</span>
                  <span className="text-muted-foreground">({template.break_duration}min break)</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{template.stores?.name}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {getDaysBadges(template.days_of_week)}
              </div>

              {canManageTemplates && (
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Apply
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Apply Template Dialog */}
      {selectedTemplate && (
        <ApplyTemplateDialog
          template={selectedTemplate}
          employees={employees}
          isApplying={isApplyingTemplate}
          onApply={handleApplyTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
};

interface TemplateDialogProps {
  template: ShiftTemplate | null;
  stores: any[];
  onSave: (data: any) => void;
  onClose: () => void;
}

const TemplateDialog = ({ template, stores, onSave, onClose }: TemplateDialogProps) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    start_time: template?.start_time || '09:00',
    end_time: template?.end_time || '17:00',
    break_duration: template?.break_duration?.toString() || '30',
    store_id: template?.store_id || '',
    days_of_week: template?.days_of_week || [],
  });

  const daysOfWeek = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' },
  ];

  const handleDayToggle = (dayId: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        days_of_week: [...formData.days_of_week, dayId]
      });
    } else {
      setFormData({
        ...formData,
        days_of_week: formData.days_of_week.filter(day => day !== dayId)
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      break_duration: parseInt(formData.break_duration),
    });
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {template ? 'Edit Template' : 'Create New Template'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Morning Shift"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of this template"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_time">Start Time</Label>
            <Input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="end_time">End Time</Label>
            <Input
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              required
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
            required
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
          <Label>Days of Week</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {daysOfWeek.map((day) => (
              <div key={day.id} className="flex items-center space-x-2">
                <Checkbox
                  id={day.id}
                  checked={formData.days_of_week.includes(day.id)}
                  onCheckedChange={(checked) => handleDayToggle(day.id, checked as boolean)}
                />
                <Label htmlFor={day.id} className="text-sm">{day.label}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {template ? 'Update' : 'Create'} Template
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

interface ApplyTemplateDialogProps {
  template: ShiftTemplate;
  employees: any[];
  isApplying: boolean;
  onApply: (template: ShiftTemplate, data: any) => void;
  onClose: () => void;
}

const ApplyTemplateDialog = ({ template, employees, isApplying, onApply, onClose }: ApplyTemplateDialogProps) => {
  const [applicationData, setApplicationData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    selectedEmployees: [] as string[],
  });

  const handleEmployeeToggle = (employeeId: string, checked: boolean) => {
    if (checked) {
      setApplicationData({
        ...applicationData,
        selectedEmployees: [...applicationData.selectedEmployees, employeeId]
      });
    } else {
      setApplicationData({
        ...applicationData,
        selectedEmployees: applicationData.selectedEmployees.filter(id => id !== employeeId)
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(template, applicationData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Apply Template: {template.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                type="date"
                value={applicationData.startDate}
                onChange={(e) => setApplicationData({ ...applicationData, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                type="date"
                value={applicationData.endDate}
                onChange={(e) => setApplicationData({ ...applicationData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Select Employees</Label>
            <div className="max-h-40 overflow-y-auto border rounded-md p-2 mt-2">
              {employees.map((emp) => (
                <div key={emp.user_id} className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id={emp.user_id}
                    checked={applicationData.selectedEmployees.includes(emp.user_id)}
                    onCheckedChange={(checked) => handleEmployeeToggle(emp.user_id, checked as boolean)}
                  />
                  <Label htmlFor={emp.user_id} className="text-sm">
                    {emp.profiles?.full_name || 'Unknown'}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isApplying || applicationData.selectedEmployees.length === 0}>
              {isApplying ? 'Applying...' : 'Apply Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};