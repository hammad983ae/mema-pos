import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Save, Trash2 } from "lucide-react";

interface TeamSettingsProps {
  userRole: string;
}

interface AnnouncementSetting {
  id: string;
  min_amount: number;
  max_amount: number | null;
  announcement_text: string;
  emoji: string;
  is_active: boolean;
}

export const TeamSettings = ({ userRole }: TeamSettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [announcementSettings, setAnnouncementSettings] = useState<AnnouncementSetting[]>([]);
  const [loading, setLoading] = useState(false);

  const canManageSettings = userRole === 'business_owner' || userRole === 'manager';

  useEffect(() => {
    if (open && canManageSettings) {
      fetchAnnouncementSettings();
    }
  }, [open, canManageSettings]);

  const fetchAnnouncementSettings = async () => {
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
      setAnnouncementSettings(data || []);
    } catch (error) {
      console.error("Error fetching announcement settings:", error);
      toast({
        title: "Error",
        description: "Failed to load announcement settings",
        variant: "destructive",
      });
    }
  };

  const updateAnnouncementSetting = async (setting: AnnouncementSetting) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("announcement_settings")
        .update({
          min_amount: setting.min_amount,
          max_amount: setting.max_amount,
          announcement_text: setting.announcement_text,
          emoji: setting.emoji,
          is_active: setting.is_active,
        })
        .eq("id", setting.id);

      if (error) throw error;

      toast({
        title: "Settings Updated",
        description: "Announcement settings have been updated successfully.",
      });

      fetchAnnouncementSettings();
    } catch (error) {
      console.error("Error updating announcement setting:", error);
      toast({
        title: "Error",
        description: "Failed to update announcement settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnouncementSetting = async (settingId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("announcement_settings")
        .delete()
        .eq("id", settingId);

      if (error) throw error;

      toast({
        title: "Setting Deleted",
        description: "Announcement setting has been deleted.",
      });

      fetchAnnouncementSettings();
    } catch (error) {
      console.error("Error deleting announcement setting:", error);
      toast({
        title: "Error",
        description: "Failed to delete announcement setting",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canManageSettings) {
    return (
      <Button variant="outline" size="sm" disabled className="flex-1 sm:flex-none">
        <Settings className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Settings</span>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
          <Settings className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Team Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="announcements" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="announcements">Sales Announcements</TabsTrigger>
            <TabsTrigger value="general">General Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="announcements" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Sales Announcement Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure automatic announcements for sales milestones. Use {"{names}"} for salesperson names and {"{amount}"} for sale amount.
              </p>

              {announcementSettings.map((setting, index) => (
                <Card key={setting.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Announcement Tier {index + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`min-${setting.id}`}>Minimum Amount ($)</Label>
                        <Input
                          id={`min-${setting.id}`}
                          type="number"
                          step="0.01"
                          value={setting.min_amount}
                          onChange={(e) => {
                            const updatedSettings = announcementSettings.map(s =>
                              s.id === setting.id ? { ...s, min_amount: parseFloat(e.target.value) || 0 } : s
                            );
                            setAnnouncementSettings(updatedSettings);
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`max-${setting.id}`}>Maximum Amount ($)</Label>
                        <Input
                          id={`max-${setting.id}`}
                          type="number"
                          step="0.01"
                          value={setting.max_amount || ""}
                          placeholder="No limit"
                          onChange={(e) => {
                            const updatedSettings = announcementSettings.map(s =>
                              s.id === setting.id ? { ...s, max_amount: e.target.value ? parseFloat(e.target.value) : null } : s
                            );
                            setAnnouncementSettings(updatedSettings);
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`emoji-${setting.id}`}>Emoji</Label>
                        <Input
                          id={`emoji-${setting.id}`}
                          value={setting.emoji}
                          placeholder="🎉"
                          onChange={(e) => {
                            const updatedSettings = announcementSettings.map(s =>
                              s.id === setting.id ? { ...s, emoji: e.target.value } : s
                            );
                            setAnnouncementSettings(updatedSettings);
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`text-${setting.id}`}>Announcement Text</Label>
                      <Input
                        id={`text-${setting.id}`}
                        value={setting.announcement_text}
                        placeholder="Great job {names}! Amazing sale of ${amount}!"
                        onChange={(e) => {
                          const updatedSettings = announcementSettings.map(s =>
                            s.id === setting.id ? { ...s, announcement_text: e.target.value } : s
                          );
                          setAnnouncementSettings(updatedSettings);
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`active-${setting.id}`}
                          checked={setting.is_active}
                          onChange={(e) => {
                            const updatedSettings = announcementSettings.map(s =>
                              s.id === setting.id ? { ...s, is_active: e.target.checked } : s
                            );
                            setAnnouncementSettings(updatedSettings);
                          }}
                        />
                        <Label htmlFor={`active-${setting.id}`}>Active</Label>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            console.log("Save announcement setting clicked", setting);
                            updateAnnouncementSetting(setting);
                          }}
                          disabled={loading}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteAnnouncementSetting(setting.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Team Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Additional team settings will be available here in future updates.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};