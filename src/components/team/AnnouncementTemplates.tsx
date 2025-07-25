import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Sparkles, Trash2 } from "lucide-react";
import { UserRole } from "@/graphql";

interface AnnouncementTemplate {
  id: string;
  title: string;
  min_amount: number;
  max_amount: number | null;
  announcement_text: string;
  emoji: string;
  custom_message: string;
  supports_gif: boolean;
  gif_url: string | null;
  is_active: boolean;
}

interface AnnouncementTemplatesProps {}

export const AnnouncementTemplates = ({}: AnnouncementTemplatesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<AnnouncementTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] =
    useState<AnnouncementTemplate | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    min_amount: "",
    max_amount: "",
    announcement_text: "",
    emoji: "🎉",
    custom_message: "",
    supports_gif: false,
    gif_url: "",
  });

  useEffect(() => {
    if (
      user &&
      (user.role === UserRole.BusinessOwner || user.role === UserRole.Manager)
    ) {
      fetchTemplates();
    }
  }, [user]);

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
        .from("announcement_settings")
        .select("*")
        .eq("business_id", membershipData.business_id)
        .order("min_amount", { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to load announcement templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!user) return;

    try {
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData)
        throw new Error("User not associated with any business");

      const templateData = {
        business_id: membershipData.business_id,
        title: formData.title,
        min_amount: parseFloat(formData.min_amount),
        max_amount: formData.max_amount
          ? parseFloat(formData.max_amount)
          : null,
        announcement_text: formData.announcement_text,
        emoji: formData.emoji,
        custom_message: formData.custom_message,
        supports_gif: formData.supports_gif,
        gif_url: formData.supports_gif ? formData.gif_url : null,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from("announcement_settings")
          .update(templateData)
          .eq("id", editingTemplate.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("announcement_settings")
          .insert(templateData);

        if (error) throw error;
      }

      toast({
        title: editingTemplate ? "Template Updated" : "Template Created",
        description: "Announcement template saved successfully",
      });

      fetchTemplates();
      resetForm();
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
    try {
      const { error } = await supabase
        .from("announcement_settings")
        .delete()
        .eq("id", templateId);

      if (error) throw error;

      toast({
        title: "Template Deleted",
        description: "Announcement template deleted successfully",
      });

      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({
      title: "",
      min_amount: "",
      max_amount: "",
      announcement_text: "",
      emoji: "🎉",
      custom_message: "",
      supports_gif: false,
      gif_url: "",
    });
  };

  const editTemplate = (template: AnnouncementTemplate) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title || "",
      min_amount: template.min_amount.toString(),
      max_amount: template.max_amount?.toString() || "",
      announcement_text: template.announcement_text,
      emoji: template.emoji,
      custom_message: template.custom_message || "",
      supports_gif: template.supports_gif,
      gif_url: template.gif_url || "",
    });
  };

  if (user.role !== UserRole.BusinessOwner && user.role !== UserRole.Manager) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Announcement Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Announcement Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="templates" className="w-full">
            <TabsList>
              <TabsTrigger value="templates">Current Templates</TabsTrigger>
              <TabsTrigger value="create">Create/Edit Template</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-4">
              {templates.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No announcement templates found. Create your first template!
                </p>
              ) : (
                <div className="grid gap-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{template.emoji}</span>
                          <div>
                            <h3 className="font-semibold">{template.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              ${template.min_amount}
                              {template.max_amount
                                ? ` - $${template.max_amount}`
                                : "+"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="bg-muted/50 rounded p-3">
                          <p className="text-sm font-medium">
                            Announcement Text:
                          </p>
                          <p className="text-sm">
                            {template.announcement_text}
                          </p>
                        </div>

                        {template.custom_message && (
                          <div className="bg-muted/50 rounded p-3">
                            <p className="text-sm font-medium">
                              Custom Message:
                            </p>
                            <p className="text-sm">{template.custom_message}</p>
                          </div>
                        )}

                        {template.supports_gif && template.gif_url && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">GIF Enabled</Badge>
                            <span className="text-sm text-muted-foreground">
                              {template.gif_url}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Template Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., BOOM, Great Sale, Legendary"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emoji">Emoji</Label>
                  <Input
                    id="emoji"
                    placeholder="🎉"
                    value={formData.emoji}
                    onChange={(e) =>
                      setFormData({ ...formData, emoji: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_amount">Minimum Sale Amount ($)</Label>
                  <Input
                    id="min_amount"
                    type="number"
                    placeholder="1500"
                    value={formData.min_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, min_amount: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_amount">
                    Maximum Sale Amount ($) - Optional
                  </Label>
                  <Input
                    id="max_amount"
                    type="number"
                    placeholder="Leave empty for no limit"
                    value={formData.max_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, max_amount: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="announcement_text">Announcement Text</Label>
                <Textarea
                  id="announcement_text"
                  placeholder="Use {names} for employee names and {amount} for sale amount"
                  value={formData.announcement_text}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      announcement_text: e.target.value,
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Available placeholders: {"{names}"} (employee names),{" "}
                  {"{amount}"} (sale amount)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom_message">Custom Message</Label>
                <Textarea
                  id="custom_message"
                  placeholder="e.g., Great job guys keep going!"
                  value={formData.custom_message}
                  onChange={(e) =>
                    setFormData({ ...formData, custom_message: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="supports_gif"
                  checked={formData.supports_gif}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, supports_gif: checked })
                  }
                />
                <Label htmlFor="supports_gif">Enable GIF Support</Label>
              </div>

              {formData.supports_gif && (
                <div className="space-y-2">
                  <Label htmlFor="gif_url">GIF URL</Label>
                  <Input
                    id="gif_url"
                    placeholder="https://giphy.com/your-gif-url"
                    value={formData.gif_url}
                    onChange={(e) =>
                      setFormData({ ...formData, gif_url: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSaveTemplate}>
                  {editingTemplate ? "Update Template" : "Create Template"}
                </Button>
                {editingTemplate && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
