import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, Clock, MapPin, Calendar, Settings } from "lucide-react";
import { pushNotificationService } from "@/services/pushNotificationService";

interface UpcomingSchedule {
  id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  store_name: string;
  store_address: string;
  notes: string;
  status: string;
}

const ScheduleNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [upcomingSchedules, setUpcomingSchedules] = useState<UpcomingSchedule[]>([]);
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    reminderTime: '18:00', // 6 PM the day before
    pushEnabled: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUpcomingSchedules();
      loadNotificationSettings();
      initializePushNotifications();
    }
  }, [user]);

  const fetchUpcomingSchedules = async () => {
    if (!user) return;
    
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const { data, error } = await supabase
        .from("employee_schedules")
        .select(`
          id,
          schedule_date,
          start_time,
          end_time,
          notes,
          status,
          stores!inner(name, address)
        `)
        .eq("user_id", user.id)
        .gte("schedule_date", tomorrow.toISOString().split('T')[0])
        .lte("schedule_date", nextWeek.toISOString().split('T')[0])
        .eq("status", "scheduled")
        .order("schedule_date", { ascending: true });

      if (error) throw error;

      const formattedSchedules = data?.map(schedule => ({
        id: schedule.id,
        schedule_date: schedule.schedule_date,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        notes: schedule.notes || '',
        status: schedule.status,
        store_name: schedule.stores?.name || 'Unknown Store',
        store_address: schedule.stores?.address || 'No address provided'
      })) || [];

      setUpcomingSchedules(formattedSchedules);
    } catch (error) {
      console.error("Error fetching upcoming schedules:", error);
      toast({
        title: "Error",
        description: "Failed to load upcoming schedules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationSettings = () => {
    const saved = localStorage.getItem('scheduleNotificationSettings');
    if (saved) {
      setNotificationSettings(JSON.parse(saved));
    }
  };

  const saveNotificationSettings = (settings: typeof notificationSettings) => {
    localStorage.setItem('scheduleNotificationSettings', JSON.stringify(settings));
    setNotificationSettings(settings);
  };

  const initializePushNotifications = async () => {
    try {
      await pushNotificationService.initialize();
      if (pushNotificationService.hasPermission()) {
        setNotificationSettings(prev => ({ ...prev, pushEnabled: true }));
      }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  };

  const scheduleNotificationReminders = async () => {
    if (!notificationSettings.enabled || upcomingSchedules.length === 0) return;

    for (const schedule of upcomingSchedules) {
      const scheduleDate = new Date(schedule.schedule_date);
      const reminderDate = new Date(scheduleDate);
      reminderDate.setDate(reminderDate.getDate() - 1);
      
      const [hours, minutes] = notificationSettings.reminderTime.split(':');
      reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      if (reminderDate > new Date()) {
        const title = "📅 Work Schedule Reminder";
        const body = `Tomorrow: ${schedule.start_time} - ${schedule.end_time} at ${schedule.store_name}`;
        
        if (notificationSettings.pushEnabled) {
          await pushNotificationService.showLocalNotification({
            title,
            body,
            data: {
              type: 'schedule',
              scheduleId: schedule.id
            }
          });
        }

        // Show browser notification as fallback
        if ('Notification' in window && Notification.permission === 'granted') {
          setTimeout(() => {
            new Notification(title, {
              body,
              icon: '/favicon.ico'
            });
          }, reminderDate.getTime() - Date.now());
        }
      }
    }

    toast({
      title: "Notifications Scheduled",
      description: `Reminders set for ${upcomingSchedules.length} upcoming shifts`,
    });
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive schedule reminders",
        });
        return true;
      }
    }
    return false;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading schedules...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Schedule Reminders</p>
              <p className="text-sm text-muted-foreground">
                Get notified about tomorrow's work schedule
              </p>
            </div>
            <Switch
              checked={notificationSettings.enabled}
              onCheckedChange={(enabled) => 
                saveNotificationSettings({ ...notificationSettings, enabled })
              }
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Reminder Time</label>
            <input
              type="time"
              value={notificationSettings.reminderTime}
              onChange={(e) => 
                saveNotificationSettings({ 
                  ...notificationSettings, 
                  reminderTime: e.target.value 
                })
              }
              className="w-full px-3 py-2 border rounded-md bg-background"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={requestNotificationPermission}
              variant="outline"
              size="sm"
            >
              <Bell className="h-4 w-4 mr-2" />
              Enable Browser Notifications
            </Button>
            <Button
              onClick={scheduleNotificationReminders}
              size="sm"
              disabled={!notificationSettings.enabled || upcomingSchedules.length === 0}
            >
              Schedule Reminders
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Schedules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Shifts ({upcomingSchedules.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingSchedules.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No upcoming shifts scheduled</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-start justify-between p-4 bg-gradient-card rounded-lg border"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {formatDate(schedule.schedule_date)}
                      </Badge>
                      <Badge variant="default">
                        {schedule.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {schedule.start_time} - {schedule.end_time}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{schedule.store_name}</p>
                        <p className="text-xs">{schedule.store_address}</p>
                      </div>
                    </div>
                    
                    {schedule.notes && (
                      <p className="text-sm text-muted-foreground">
                        📝 {schedule.notes}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const title = "📅 Schedule Reminder";
                      const body = `${formatDate(schedule.schedule_date)}: ${schedule.start_time} - ${schedule.end_time} at ${schedule.store_name}`;
                      
                      if (notificationSettings.pushEnabled) {
                        pushNotificationService.showLocalNotification({
                          title,
                          body,
                          data: { type: 'schedule', scheduleId: schedule.id }
                        });
                      } else if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification(title, { body, icon: '/favicon.ico' });
                      } else {
                        toast({
                          title: "Schedule Reminder",
                          description: body,
                        });
                      }
                    }}
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleNotifications;