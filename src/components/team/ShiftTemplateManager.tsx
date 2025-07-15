import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus,
  Edit,
  Trash2,
  Clock,
  Users,
  Copy,
  Layers
} from "lucide-react";

interface ShiftTemplate {
  id: string;
  template_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  required_openers: number;
  required_upsellers: number;
  break_duration: number;
  is_active: boolean;
  store_id?: string;
  stores?: {
    name: string;
  };
}

interface Store {
  id: string;
  name: string;
}

interface ShiftTemplateManagerProps {
  businessId: string;
  onTemplateCreated: () => void;
}

export const ShiftTemplateManager = ({ businessId, onTemplateCreated }: ShiftTemplateManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);

  const daysOfWeek = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' },
  ];

  useEffect(() => {
    if (businessId) {
      fetchTemplates();
      fetchStores();
    }
  }, [businessId]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("shift_templates")
        .select("*")
        .eq("business_id", businessId)
        .order("day_of_week")
        .order("start_time");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to load shift templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name")
        .eq("business_id", businessId);

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  };

  const handleSaveTemplate = async (templateData: any) => {
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from("shift_templates")
          .update(templateData)
          .eq("id", editingTemplate.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Template updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("shift_templates")
          .insert({
            ...templateData,
            business_id: businessId,
            created_by: user?.id,
          });

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Template created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
      onTemplateCreated();
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const { error } = await supabase
        .from("shift_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template deleted successfully",
      });

      fetchTemplates();
      onTemplateCreated();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateTemplate = async (template: ShiftTemplate) => {
    try {
      const { error } = await supabase
        .from("shift_templates")
        .insert({
          business_id: businessId,
          template_name: `${template.template_name} (Copy)`,
          day_of_week: template.day_of_week,
          start_time: template.start_time,
          end_time: template.end_time,
          required_openers: template.required_openers,
          required_upsellers: template.required_upsellers,
          break_duration: template.break_duration,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template duplicated successfully",
      });

      fetchTemplates();
      onTemplateCreated();
    } catch (error) {
      console.error("Error duplicating template:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate template",
        variant: "destructive",
      });
    }
  };

  const getDayName = (dayNumber: number) => {
    return daysOfWeek.find(d => d.value === dayNumber)?.label || 'Unknown';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Permanent Shift Templates</h3>
          <p className="text-sm text-muted-foreground">
            Create reusable shifts that are always available for scheduling
          </p>
        </div>

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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center space-x-2">
                  <Layers className="h-4 w-4" />
                  <span>{template.template_name}</span>
                </CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDuplicateTemplate(template)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditingTemplate(template);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">
                  {getDayName(template.day_of_week)}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{template.start_time} - {template.end_time}</span>
                <span className="text-muted-foreground">({template.break_duration}min break)</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {template.required_openers} Openers
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {template.required_upsellers} Upsellers
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No shift templates yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first shift template to start building schedules efficiently
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Template
          </Button>
        </div>
      )}
    </div>
  );
};

interface TemplateDialogProps {
  template: ShiftTemplate | null;
  stores: Store[];
  onSave: (data: any) => void;
  onClose: () => void;
}

const TemplateDialog = ({ template, stores, onSave, onClose }: TemplateDialogProps) => {
  const [formData, setFormData] = useState({
    template_name: template?.template_name || '',
    day_of_week: template?.day_of_week || 1,
    start_time: template?.start_time || '09:00',
    end_time: template?.end_time || '17:00',
    required_openers: template?.required_openers || 1,
    required_upsellers: template?.required_upsellers || 2,
    break_duration: template?.break_duration || 30,
    store_id: template?.store_id || '',
  });

  const daysOfWeek = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {template ? 'Edit Shift Template' : 'Create New Shift Template'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="template_name">Template Name</Label>
          <Input
            value={formData.template_name}
            onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
            placeholder="e.g., Morning Shift, Weekend Shift"
            required
          />
        </div>

        <div>
          <Label htmlFor="day_of_week">Day of Week</Label>
          <Select
            value={formData.day_of_week.toString()}
            onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {daysOfWeek.map((day) => (
                <SelectItem key={day.value} value={day.value.toString()}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="required_openers">Required Openers</Label>
            <Input
              type="number"
              min="0"
              max="10"
              value={formData.required_openers}
              onChange={(e) => setFormData({ ...formData, required_openers: parseInt(e.target.value) })}
              required
            />
          </div>
          <div>
            <Label htmlFor="required_upsellers">Required Upsellers</Label>
            <Input
              type="number"
              min="0"
              max="10"
              value={formData.required_upsellers}
              onChange={(e) => setFormData({ ...formData, required_upsellers: parseInt(e.target.value) })}
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
            onChange={(e) => setFormData({ ...formData, break_duration: parseInt(e.target.value) })}
            required
          />
        </div>

        {stores.length > 0 && (
          <div>
            <Label htmlFor="store">Store (Optional)</Label>
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
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};