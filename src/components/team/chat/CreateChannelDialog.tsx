import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelCreated: () => void;
}

export const CreateChannelDialog = ({ open, onOpenChange, onChannelCreated }: CreateChannelDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "public",
    category: "general"
  });

  const channelCategories = [
    { value: "general", label: "General" },
    { value: "schedule", label: "Schedule" },
    { value: "alerts", label: "Alerts" },
    { value: "team", label: "Team" },
    { value: "announcements", label: "Announcements" },
    { value: "support", label: "Support" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Channel name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get user's business context
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) {
        throw new Error("User not associated with any business");
      }

      // Create the channel
      const { data: channel, error: channelError } = await supabase
        .from("channels")
        .insert([{
          name: formData.name.toLowerCase().replace(/\s+/g, '-'),
          description: formData.description,
          type: formData.type,
          category: formData.category,
          business_id: membershipData.business_id,
          created_by: user.id
        }])
        .select()
        .single();

      if (channelError) throw channelError;

      // Add creator as a member
      const { error: memberError } = await supabase
        .from("channel_members")
        .insert([{
          channel_id: channel.id,
          user_id: user.id,
          role: 'admin'
        }]);

      if (memberError) throw memberError;

      toast({
        title: "Success",
        description: `Channel #${formData.name} created successfully`,
      });

      // Reset form
      setFormData({
        name: "",
        description: "",
        type: "public",
        category: "general"
      });

      onChannelCreated();
      onOpenChange(false);

    } catch (error: any) {
      console.error("Error creating channel:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create channel",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Channel</DialogTitle>
          <DialogDescription>
            Create a new channel for team communication. Choose a descriptive name and select the appropriate category.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Channel Name *</Label>
            <Input
              id="name"
              placeholder="e.g., general, announcements, project-updates"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <p className="text-xs text-muted-foreground">
              Channel names will be lowercase with dashes instead of spaces
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What is this channel for?"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Channel Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {channelCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Channel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};