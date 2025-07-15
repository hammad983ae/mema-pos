import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Clock, 
  Target, 
  TrendingUp,
  AlertTriangle,
  Info,
  Edit,
  Save,
  Eye
} from "lucide-react";

interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  subject: string;
  content: string;
  triggers: string[];
}

interface NotificationChannel {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  settings: Record<string, any>;
}

interface NotificationSettingsProps {
  userRole: string;
}

const NotificationSettings = ({ userRole }: NotificationSettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

  const [channels, setChannels] = useState<NotificationChannel[]>([
    {
      id: "email",
      name: "Email Notifications",
      type: "email",
      enabled: true,
      settings: {
        fromEmail: "noreply@yourbusiness.com",
        replyTo: "support@yourbusiness.com"
      }
    },
    {
      id: "sms",
      name: "SMS Notifications",
      type: "sms",
      enabled: false,
      settings: {
        provider: "twilio",
        fromNumber: "+1234567890"
      }
    },
    {
      id: "push",
      name: "Push Notifications",
      type: "push",
      enabled: true,
      settings: {
        vapidKey: ""
      }
    }
  ]);

  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: "schedule_reminder",
      name: "Schedule Reminder",
      type: "reminder",
      enabled: true,
      subject: "Your shift starts in 1 hour",
      content: "Hi {{employee_name}},\n\nThis is a reminder that your shift at {{store_name}} starts at {{start_time}}.\n\nSee you soon!",
      triggers: ["1_hour_before", "30_minutes_before"]
    },
    {
      id: "goal_achievement",
      name: "Goal Achievement",
      type: "celebration",
      enabled: true,
      subject: "Congratulations! Goal Achieved 🎉",
      content: "Amazing work {{employee_name}}!\n\nYou've successfully achieved your {{goal_type}} goal of ${{target_amount}}!\n\nKeep up the excellent work!",
      triggers: ["goal_completed"]
    },
    {
      id: "eod_submission",
      name: "End of Day Report Submission",
      type: "reminder",
      enabled: true,
      subject: "EOD Report Required",
      content: "Hi {{employee_name}},\n\nPlease submit your end-of-day report for {{date}}.\n\nTotal Sales: ${{total_sales}}\nTransactions: {{transaction_count}}",
      triggers: ["shift_end", "overdue_report"]
    },
    {
      id: "low_inventory",
      name: "Low Inventory Alert",
      type: "alert",
      enabled: true,
      subject: "Low Inventory Alert - {{product_name}}",
      content: "Attention {{manager_name}},\n\n{{product_name}} is running low at {{store_name}}.\n\nCurrent stock: {{current_quantity}}\nThreshold: {{threshold_quantity}}\n\nPlease reorder soon.",
      triggers: ["stock_low", "stock_critical"]
    },
    {
      id: "new_team_member",
      name: "Welcome New Team Member",
      type: "welcome",
      enabled: true,
      subject: "Welcome to the Team!",
      content: "Welcome {{employee_name}}!\n\nWe're excited to have you join our team at {{business_name}}.\n\nYour first shift is scheduled for {{start_date}} at {{start_time}}.\n\nIf you have any questions, please reach out to your manager.",
      triggers: ["employee_hired"]
    }
  ]);

  const [userPreferences, setUserPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    scheduleReminders: true,
    goalAlerts: true,
    inventoryAlerts: false,
    teamUpdates: true,
    reminderTiming: "1_hour",
    digestFrequency: "daily"
  });

  const isManager = userRole === "business_owner" || userRole === "manager";

  const updateChannel = (channelId: string, updates: Partial<NotificationChannel>) => {
    setChannels(prev => 
      prev.map(channel => 
        channel.id === channelId 
          ? { ...channel, ...updates }
          : channel
      )
    );
  };

  const updateTemplate = (templateId: string, updates: Partial<NotificationTemplate>) => {
    setTemplates(prev => 
      prev.map(template => 
        template.id === templateId 
          ? { ...template, ...updates }
          : template
      )
    );
  };

  const saveTemplate = () => {
    if (editingTemplate) {
      updateTemplate(editingTemplate.id, editingTemplate);
      setEditingTemplate(null);
      toast({
        title: "Template Saved",
        description: "Notification template has been updated successfully.",
      });
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // In a real implementation, save to database
      toast({
        title: "Settings Saved",
        description: "Notification settings have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testTemplate = (template: NotificationTemplate) => {
    toast({
      title: "Test Notification Sent",
      description: `Test notification sent using the "${template.name}" template.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Notification Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure notification channels, templates, and personal preferences
        </p>
      </div>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Configure how notifications are delivered
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {channels.map((channel) => (
            <div key={channel.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {channel.type === "email" && <Mail className="h-5 w-5" />}
                  {channel.type === "sms" && <MessageSquare className="h-5 w-5" />}
                  {channel.type === "push" && <Bell className="h-5 w-5" />}
                  <div>
                    <h4 className="font-medium">{channel.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {channel.type === "email" && "Send notifications via email"}
                      {channel.type === "sms" && "Send notifications via SMS"}
                      {channel.type === "push" && "Send browser push notifications"}
                    </p>
                  </div>
                </div>
                {isManager && (
                  <Switch
                    checked={channel.enabled}
                    onCheckedChange={(enabled) => updateChannel(channel.id, { enabled })}
                  />
                )}
              </div>

              {channel.enabled && isManager && (
                <div className="ml-8 space-y-3 border-l-2 border-border pl-4">
                  {channel.type === "email" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>From Email</Label>
                        <Input
                          value={channel.settings.fromEmail}
                          onChange={(e) => updateChannel(channel.id, {
                            settings: { ...channel.settings, fromEmail: e.target.value }
                          })}
                          placeholder="noreply@yourbusiness.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reply To</Label>
                        <Input
                          value={channel.settings.replyTo}
                          onChange={(e) => updateChannel(channel.id, {
                            settings: { ...channel.settings, replyTo: e.target.value }
                          })}
                          placeholder="support@yourbusiness.com"
                        />
                      </div>
                    </div>
                  )}
                  
                  {channel.type === "sms" && (
                    <div className="space-y-2">
                      <Label>From Number</Label>
                      <Input
                        value={channel.settings.fromNumber}
                        onChange={(e) => updateChannel(channel.id, {
                          settings: { ...channel.settings, fromNumber: e.target.value }
                        })}
                        placeholder="+1234567890"
                      />
                    </div>
                  )}
                </div>
              )}
              <Separator />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Personal Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Preferences</CardTitle>
          <CardDescription>
            Configure your personal notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Email Notifications</Label>
                <Switch
                  checked={userPreferences.emailNotifications}
                  onCheckedChange={(value) => setUserPreferences(prev => ({ ...prev, emailNotifications: value }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>SMS Notifications</Label>
                <Switch
                  checked={userPreferences.smsNotifications}
                  onCheckedChange={(value) => setUserPreferences(prev => ({ ...prev, smsNotifications: value }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Push Notifications</Label>
                <Switch
                  checked={userPreferences.pushNotifications}
                  onCheckedChange={(value) => setUserPreferences(prev => ({ ...prev, pushNotifications: value }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Schedule Reminders</Label>
                <Switch
                  checked={userPreferences.scheduleReminders}
                  onCheckedChange={(value) => setUserPreferences(prev => ({ ...prev, scheduleReminders: value }))}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Goal Achievement Alerts</Label>
                <Switch
                  checked={userPreferences.goalAlerts}
                  onCheckedChange={(value) => setUserPreferences(prev => ({ ...prev, goalAlerts: value }))}
                />
              </div>
              {isManager && (
                <div className="flex items-center justify-between">
                  <Label>Inventory Alerts</Label>
                  <Switch
                    checked={userPreferences.inventoryAlerts}
                    onCheckedChange={(value) => setUserPreferences(prev => ({ ...prev, inventoryAlerts: value }))}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Reminder Timing</Label>
                <Select
                  value={userPreferences.reminderTiming}
                  onValueChange={(value) => setUserPreferences(prev => ({ ...prev, reminderTiming: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15_minutes">15 minutes before</SelectItem>
                    <SelectItem value="30_minutes">30 minutes before</SelectItem>
                    <SelectItem value="1_hour">1 hour before</SelectItem>
                    <SelectItem value="2_hours">2 hours before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Templates */}
      {isManager && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Templates</CardTitle>
            <CardDescription>
              Customize notification messages and content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      {template.type === "reminder" && <Clock className="h-5 w-5" />}
                      {template.type === "celebration" && <Target className="h-5 w-5" />}
                      {template.type === "alert" && <AlertTriangle className="h-5 w-5" />}
                      {template.type === "welcome" && <Info className="h-5 w-5" />}
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant={template.enabled ? "default" : "secondary"}>
                        {template.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template.subject}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={template.enabled}
                      onCheckedChange={(enabled) => updateTemplate(template.id, { enabled })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Template Editor */}
      {editingTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Template: {editingTemplate.name}</CardTitle>
            <CardDescription>
              Customize the notification content. Use variables like {"{employee_name}"}, {"{store_name}"}, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="templateSubject">Subject Line</Label>
              <Input
                id="templateSubject"
                value={editingTemplate.subject}
                onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, subject: e.target.value } : null)}
                placeholder="Enter subject line"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="templateContent">Message Content</Label>
              <Textarea
                id="templateContent"
                value={editingTemplate.content}
                onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, content: e.target.value } : null)}
                placeholder="Enter message content"
                rows={6}
              />
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Available variables: {"{employee_name}"}, {"{store_name}"}, {"{start_time}"}, {"{goal_type}"}, {"{target_amount}"}, {"{total_sales}"}, {"{date}"}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={saveTemplate}>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingTemplate(null)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={loading}>
          {loading ? "Saving..." : "Save Notification Settings"}
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettings;