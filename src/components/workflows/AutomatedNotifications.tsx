import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Mail,
  MessageSquare,
  Smartphone,
  Settings,
  Zap,
  Target,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface NotificationRule {
  id: string;
  name: string;
  trigger_type: string;
  trigger_conditions: any;
  notification_channels: string[];
  message_template: string;
  is_active: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipients: string[];
  created_at: string;
  last_triggered?: string;
  trigger_count: number;
}

interface NotificationLog {
  id: string;
  rule_id: string;
  rule_name: string;
  trigger_data: any;
  message_sent: string;
  channels_used: string[];
  status: 'sent' | 'failed' | 'pending';
  recipients: string[];
  created_at: string;
}

export const AutomatedNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [newRule, setNewRule] = useState({
    name: '',
    trigger_type: 'low_stock',
    trigger_conditions: {},
    notification_channels: ['in_app'],
    message_template: '',
    priority: 'medium' as const,
    recipients: ['managers']
  });

  useEffect(() => {
    loadNotificationData();
    setupRealtimeListeners();
  }, []);

  const loadNotificationData = async () => {
    try {
      setLoading(true);
      
      // Load mock notification rules (in real app, these would be from database)
      const mockRules: NotificationRule[] = [
        {
          id: '1',
          name: 'Low Stock Alert',
          trigger_type: 'low_stock',
          trigger_conditions: { threshold: 10, product_categories: ['all'] },
          notification_channels: ['in_app', 'email'],
          message_template: 'Product {product_name} is running low in {store_name}. Current stock: {current_stock}',
          is_active: true,
          priority: 'high',
          recipients: ['managers', 'inventory_team'],
          created_at: new Date().toISOString(),
          trigger_count: 15
        },
        {
          id: '2',
          name: 'High Sales Achievement',
          trigger_type: 'sales_goal_achieved',
          trigger_conditions: { amount: 1000, period: 'daily' },
          notification_channels: ['in_app', 'slack'],
          message_template: '🎉 {employee_name} achieved ${amount} in sales today!',
          is_active: true,
          priority: 'medium',
          recipients: ['all_team'],
          created_at: new Date().toISOString(),
          trigger_count: 8
        },
        {
          id: '3',
          name: 'End of Day Reminder',
          trigger_type: 'schedule',
          trigger_conditions: { time: '21:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
          notification_channels: ['in_app'],
          message_template: 'Reminder: Complete your end-of-day procedures and cash reconciliation',
          is_active: true,
          priority: 'low',
          recipients: ['openers', 'managers'],
          created_at: new Date().toISOString(),
          trigger_count: 42
        },
        {
          id: '4',
          name: 'Commission Payment Ready',
          trigger_type: 'commission_calculated',
          trigger_conditions: { minimum_amount: 50 },
          notification_channels: ['email', 'in_app'],
          message_template: 'Your commission of ${amount} has been calculated and is ready for payment',
          is_active: true,
          priority: 'medium',
          recipients: ['individual'],
          created_at: new Date().toISOString(),
          trigger_count: 23
        }
      ];

      setRules(mockRules);

      // Generate mock notification logs
      const mockLogs: NotificationLog[] = [
        {
          id: '1',
          rule_id: '1',
          rule_name: 'Low Stock Alert',
          trigger_data: { product_name: 'Widget A', store_name: 'Main Store', current_stock: 5 },
          message_sent: 'Product Widget A is running low in Main Store. Current stock: 5',
          channels_used: ['in_app', 'email'],
          status: 'sent',
          recipients: ['manager@example.com'],
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          rule_id: '2',
          rule_name: 'High Sales Achievement',
          trigger_data: { employee_name: 'John Doe', amount: 1250 },
          message_sent: '🎉 John Doe achieved $1250 in sales today!',
          channels_used: ['in_app'],
          status: 'sent',
          recipients: ['team'],
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          rule_id: '3',
          rule_name: 'End of Day Reminder',
          trigger_data: { time: '21:00' },
          message_sent: 'Reminder: Complete your end-of-day procedures and cash reconciliation',
          channels_used: ['in_app'],
          status: 'sent',
          recipients: ['store_staff'],
          created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
        }
      ];

      setLogs(mockLogs);

    } catch (error) {
      console.error('Error loading notification data:', error);
      toast({
        title: "Error",
        description: "Failed to load notification data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListeners = () => {
    // Listen for inventory changes
    const inventoryChannel = supabase
      .channel('notification-triggers-inventory')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'inventory' },
        (payload) => {
          handleInventoryTrigger(payload.new);
        }
      )
      .subscribe();

    // Listen for new orders (sales achievements)
    const ordersChannel = supabase
      .channel('notification-triggers-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          handleSalesTrigger(payload.new);
        }
      )
      .subscribe();

    // Listen for commission calculations
    const commissionsChannel = supabase
      .channel('notification-triggers-commissions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'commission_payments' },
        (payload) => {
          handleCommissionTrigger(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inventoryChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(commissionsChannel);
    };
  };

  const handleInventoryTrigger = async (inventoryData: any) => {
    const lowStockRules = rules.filter(r => 
      r.trigger_type === 'low_stock' && 
      r.is_active &&
      inventoryData.quantity_on_hand <= (r.trigger_conditions.threshold || 10)
    );

    for (const rule of lowStockRules) {
      await executeNotificationRule(rule, {
        product_id: inventoryData.product_id,
        store_id: inventoryData.store_id,
        current_stock: inventoryData.quantity_on_hand,
        threshold: inventoryData.low_stock_threshold
      });
    }
  };

  const handleSalesTrigger = async (orderData: any) => {
    if (orderData.status !== 'completed') return;

    const salesRules = rules.filter(r => 
      r.trigger_type === 'sales_goal_achieved' && 
      r.is_active &&
      orderData.total >= (r.trigger_conditions.amount || 1000)
    );

    for (const rule of salesRules) {
      await executeNotificationRule(rule, {
        order_id: orderData.id,
        employee_id: orderData.user_id,
        amount: orderData.total,
        store_id: orderData.store_id
      });
    }
  };

  const handleCommissionTrigger = async (commissionData: any) => {
    const commissionRules = rules.filter(r => 
      r.trigger_type === 'commission_calculated' && 
      r.is_active &&
      commissionData.commission_amount >= (r.trigger_conditions.minimum_amount || 50)
    );

    for (const rule of commissionRules) {
      await executeNotificationRule(rule, {
        user_id: commissionData.user_id,
        amount: commissionData.commission_amount,
        sale_amount: commissionData.sale_amount,
        period: commissionData.payment_period
      });
    }
  };

  const executeNotificationRule = async (rule: NotificationRule, triggerData: any) => {
    try {
      // Get user context for business notifications
      const { data: userContext } = await supabase.rpc('get_user_business_context');
      if (!userContext || userContext.length === 0) return;

      // Process message template
      let message = rule.message_template;
      Object.keys(triggerData).forEach(key => {
        message = message.replace(`{${key}}`, triggerData[key]?.toString() || '');
      });

      // Determine recipients
      const recipients = await resolveRecipients(rule.recipients, triggerData);

      // Send notifications through specified channels
      for (const channel of rule.notification_channels) {
        await sendNotification(channel, message, recipients, rule.priority);
      }

      // Create notification in database for in-app notifications
      if (rule.notification_channels.includes('in_app')) {
        await supabase
          .from('notifications')
          .insert({
            business_id: userContext[0].business_id,
            type: rule.trigger_type,
            title: rule.name,
            message: message,
            data: triggerData,
            user_id: triggerData.user_id || null
          });
      }

      // Update rule trigger count
      setRules(prev => 
        prev.map(r => 
          r.id === rule.id 
            ? { ...r, trigger_count: r.trigger_count + 1, last_triggered: new Date().toISOString() }
            : r
        )
      );

      // Log the notification
      const newLog: NotificationLog = {
        id: Date.now().toString(),
        rule_id: rule.id,
        rule_name: rule.name,
        trigger_data: triggerData,
        message_sent: message,
        channels_used: rule.notification_channels,
        status: 'sent',
        recipients: recipients,
        created_at: new Date().toISOString()
      };

      setLogs(prev => [newLog, ...prev.slice(0, 49)]);

    } catch (error) {
      console.error('Error executing notification rule:', error);
    }
  };

  const resolveRecipients = async (recipientTypes: string[], triggerData: any): Promise<string[]> => {
    // This would resolve recipient types to actual email addresses/user IDs
    // For demo purposes, returning mock data
    return ['manager@example.com', 'team@example.com'];
  };

  const sendNotification = async (channel: string, message: string, recipients: string[], priority: string) => {
    console.log(`Sending ${channel} notification:`, { message, recipients, priority });
    
    // Here you would integrate with actual notification services:
    // - Email: Resend, SendGrid, etc.
    // - SMS: Twilio, etc.
    // - Slack: Slack API
    // - Push: Firebase, etc.
  };

  const createRule = async () => {
    try {
      const newRuleData: NotificationRule = {
        id: Date.now().toString(),
        ...newRule,
        is_active: true,
        created_at: new Date().toISOString(),
        trigger_count: 0
      };

      setRules(prev => [newRuleData, ...prev]);
      setIsCreateDialogOpen(false);
      
      // Reset form
      setNewRule({
        name: '',
        trigger_type: 'low_stock',
        trigger_conditions: {},
        notification_channels: ['in_app'],
        message_template: '',
        priority: 'medium',
        recipients: ['managers']
      });

      toast({
        title: "Notification Rule Created",
        description: "Your notification rule has been created successfully",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create notification rule",
        variant: "destructive",
      });
    }
  };

  const toggleRule = (ruleId: string) => {
    setRules(prev => 
      prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, is_active: !rule.is_active }
          : rule
      )
    );

    toast({
      title: "Rule Updated",
      description: "Notification rule status has been updated",
    });
  };

  const deleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
    
    toast({
      title: "Rule Deleted",
      description: "Notification rule has been deleted",
    });
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'low_stock': return <AlertTriangle className="h-4 w-4" />;
      case 'sales_goal_achieved': return <Target className="h-4 w-4" />;
      case 'schedule': return <Calendar className="h-4 w-4" />;
      case 'commission_calculated': return <CheckCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-3 w-3" />;
      case 'sms': return <Smartphone className="h-3 w-3" />;
      case 'slack': return <MessageSquare className="h-3 w-3" />;
      case 'in_app': return <Bell className="h-3 w-3" />;
      default: return <Bell className="h-3 w-3" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 border-red-500';
      case 'high': return 'text-orange-600 border-orange-500';
      case 'medium': return 'text-blue-600 border-blue-500';
      case 'low': return 'text-gray-600 border-gray-500';
      default: return 'text-gray-600 border-gray-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automated Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Clock className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading notification system...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Automated Notifications
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Notification Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Rule Name</Label>
                      <Input
                        value={newRule.name}
                        onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Low Stock Alert"
                      />
                    </div>
                    <div>
                      <Label>Trigger Type</Label>
                      <Select
                        value={newRule.trigger_type}
                        onValueChange={(value) => setNewRule(prev => ({ ...prev, trigger_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low_stock">Low Stock</SelectItem>
                          <SelectItem value="sales_goal_achieved">Sales Goal Achieved</SelectItem>
                          <SelectItem value="schedule">Scheduled</SelectItem>
                          <SelectItem value="commission_calculated">Commission Calculated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Message Template</Label>
                    <Input
                      value={newRule.message_template}
                      onChange={(e) => setNewRule(prev => ({ ...prev, message_template: e.target.value }))}
                      placeholder="Use {variable_name} for dynamic content"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Priority</Label>
                      <Select
                        value={newRule.priority}
                        onValueChange={(value: any) => setNewRule(prev => ({ ...prev, priority: value }))}
                      >
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
                    <div>
                      <Label>Recipients</Label>
                      <Select
                        value={newRule.recipients[0]}
                        onValueChange={(value) => setNewRule(prev => ({ ...prev, recipients: [value] }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="managers">Managers</SelectItem>
                          <SelectItem value="all_team">All Team</SelectItem>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="openers">Openers</SelectItem>
                          <SelectItem value="upsellers">Upsellers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createRule} disabled={!newRule.name || !newRule.message_template}>
                      Create Rule
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="rules" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rules">
                Notification Rules
                <Badge variant="outline" className="ml-2">
                  {rules.filter(r => r.is_active).length} active
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="logs">Recent Activity</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="rules" className="space-y-4">
              <div className="grid gap-4">
                {rules.map((rule) => (
                  <Card key={rule.id} className={`border-l-4 ${getPriorityColor(rule.priority)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTriggerIcon(rule.trigger_type)}
                          <div>
                            <div className="font-medium">{rule.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Triggered {rule.trigger_count} times
                              {rule.last_triggered && (
                                <span> • Last: {new Date(rule.last_triggered).toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {rule.notification_channels.map((channel) => (
                              <Badge key={channel} variant="outline" className="text-xs">
                                {getChannelIcon(channel)}
                                <span className="ml-1">{channel}</span>
                              </Badge>
                            ))}
                          </div>
                          <Badge variant={rule.priority === 'urgent' ? 'destructive' : 'outline'}>
                            {rule.priority}
                          </Badge>
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => toggleRule(rule.id)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {rule.message_template}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <div className="grid gap-4">
                {logs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <div className="font-medium">{log.rule_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {log.message_sent}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {log.channels_used.map((channel) => (
                              <Badge key={channel} variant="outline" className="text-xs">
                                {getChannelIcon(channel)}
                              </Badge>
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
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
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Send notifications via email
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">SMS Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Send urgent notifications via SMS
                      </div>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Slack Integration</div>
                      <div className="text-sm text-muted-foreground">
                        Send notifications to Slack channels
                      </div>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};