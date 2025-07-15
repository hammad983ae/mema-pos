import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface ChecklistFormProps {
  onSuccess: () => void;
}

interface ChecklistItem {
  item_text: string;
  description: string;
  is_required: boolean;
  requires_photo: boolean;
  requires_note: boolean;
}

export const ChecklistForm = ({ onSuccess }: ChecklistFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    checklist_type: "custom"
  });

  const [items, setItems] = useState<ChecklistItem[]>([
    {
      item_text: "",
      description: "",
      is_required: true,
      requires_photo: false,
      requires_note: false
    }
  ]);

  const addItem = () => {
    setItems([...items, {
      item_text: "",
      description: "",
      is_required: true,
      requires_photo: false,
      requires_note: false
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ChecklistItem, value: any) => {
    setItems(items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
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

      // Create checklist
      const { data: checklistData, error: checklistError } = await supabase
        .from("checklists")
        .insert({
          business_id: membershipData.business_id,
          name: formData.name,
          checklist_type: formData.checklist_type,
          created_by: user.id
        })
        .select()
        .single();

      if (checklistError) throw checklistError;

      // Create checklist items
      const itemsToInsert = items
        .filter(item => item.item_text.trim())
        .map((item, index) => ({
          checklist_id: checklistData.id,
          item_text: item.item_text,
          description: item.description,
          is_required: item.is_required,
          requires_photo: item.requires_photo,
          requires_note: item.requires_note,
          display_order: index + 1
        }));

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from("checklist_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Success",
        description: "Checklist created successfully",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error creating checklist:", error);
      toast({
        title: "Error",
        description: "Failed to create checklist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Checklist Name</Label>
          <Input
            id="name"
            placeholder="Enter checklist name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="checklist_type">Type</Label>
          <Select value={formData.checklist_type} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, checklist_type: value }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opening">Store Opening</SelectItem>
              <SelectItem value="closing">Store Closing</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Checklist Items</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Item {index + 1}</h4>
              {items.length > 1 && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Item Text</Label>
                <Input
                  placeholder="Enter checklist item"
                  value={item.item_text}
                  onChange={(e) => updateItem(index, 'item_text', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Optional description"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={item.is_required}
                  onCheckedChange={(checked) => updateItem(index, 'is_required', checked)}
                />
                <Label>Required</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={item.requires_photo}
                  onCheckedChange={(checked) => updateItem(index, 'requires_photo', checked)}
                />
                <Label>Requires Photo</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={item.requires_note}
                  onCheckedChange={(checked) => updateItem(index, 'requires_note', checked)}
                />
                <Label>Requires Note</Label>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading || !formData.name}>
          {loading ? "Creating..." : "Create Checklist"}
        </Button>
      </div>
    </form>
  );
};