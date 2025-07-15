import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  TrendingDown,
  ShoppingCart,
  RefreshCw,
  Clock,
  ArrowRight,
  Zap,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface WorkflowRule {
  id: string;
  workflow_type: string;
  trigger_conditions: any;
  actions: any[];
  is_active: boolean;
  last_triggered?: string;
  execution_count: number;
}

interface PendingWorkflow {
  id: string;
  workflow_type: string;
  trigger_data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

export const InventoryWorkflows = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([]);
  const [pendingWorkflows, setPendingWorkflows] = useState<PendingWorkflow[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflowData();
    setupRealtimeMonitoring();
  }, []);

  const loadWorkflowData = async () => {
    try {
      setLoading(true);
      
      const { data: userContext } = await supabase.rpc('get_user_business_context');
      if (!userContext || userContext.length === 0) return;

      const businessId = userContext[0].business_id;

      // Load low stock items that need attention
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select(`
          *,
          products!inner(name, sku, cost, price),
          stores!inner(name, business_id)
        `)
        .eq('stores.business_id', businessId)
        .order('quantity_on_hand', { ascending: true });

      const lowStock = inventoryData?.filter(item => 
        item.quantity_on_hand <= item.low_stock_threshold
      ) || [];

      setLowStockItems(lowStock);

      // Simulate workflow rules (these would be stored in database)
      const mockWorkflowRules: WorkflowRule[] = [
        {
          id: '1',
          workflow_type: 'auto_reorder',
          trigger_conditions: { stock_threshold: 10, product_categories: ['all'] },
          actions: ['create_purchase_order', 'notify_manager'],
          is_active: true,
          execution_count: 0
        },
        {
          id: '2',
          workflow_type: 'stock_alert',
          trigger_conditions: { stock_level: 'critical' },
          actions: ['send_notification', 'email_manager'],
          is_active: true,
          execution_count: 0
        },
        {
          id: '3',
          workflow_type: 'supplier_rotation',
          trigger_conditions: { delivery_delay: 3 },
          actions: ['switch_supplier', 'notify_team'],
          is_active: false,
          execution_count: 0
        }
      ];

      setWorkflowRules(mockWorkflowRules);

      // Generate pending workflows based on current low stock
      const pendingWorkflowsData: PendingWorkflow[] = lowStock.slice(0, 5).map((item, index) => ({
        id: `pending_${index}`,
        workflow_type: item.quantity_on_hand === 0 ? 'emergency_restock' : 'auto_reorder',
        trigger_data: {
          product_name: item.products.name,
          current_stock: item.quantity_on_hand,
          threshold: item.low_stock_threshold,
          store_name: item.stores.name
        },
        status: ['pending', 'processing', 'completed'][Math.floor(Math.random() * 3)] as any,
        created_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      }));

      setPendingWorkflows(pendingWorkflowsData);

    } catch (error) {
      console.error('Error loading workflow data:', error);
      toast({
        title: "Error",
        description: "Failed to load workflow data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeMonitoring = () => {
    const channel = supabase
      .channel('inventory-workflows')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        (payload) => {
          handleInventoryChange(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleInventoryChange = async (payload: any) => {
    const { new: newRecord, old: oldRecord } = payload;
    
    if (newRecord.quantity_on_hand <= newRecord.low_stock_threshold) {
      await triggerWorkflow('stock_alert', {
        product_id: newRecord.product_id,
        store_id: newRecord.store_id,
        current_stock: newRecord.quantity_on_hand,
        threshold: newRecord.low_stock_threshold
      });
    }

    if (newRecord.quantity_on_hand === 0 && oldRecord?.quantity_on_hand > 0) {
      await triggerWorkflow('emergency_restock', {
        product_id: newRecord.product_id,
        store_id: newRecord.store_id,
        urgency: 'critical'
      });
    }
  };

  const triggerWorkflow = async (workflowType: string, triggerData: any) => {
    try {
      // Find active workflow rule
      const rule = workflowRules.find(r => r.workflow_type === workflowType && r.is_active);
      if (!rule) return;

      // Execute workflow actions
      await executeWorkflowActions(rule, triggerData);

      // Update execution count
      setWorkflowRules(prev => 
        prev.map(r => 
          r.id === rule.id 
            ? { ...r, execution_count: r.execution_count + 1, last_triggered: new Date().toISOString() }
            : r
        )
      );

      toast({
        title: "Workflow Triggered",
        description: `${workflowType} workflow executed successfully`,
      });

    } catch (error) {
      console.error('Error triggering workflow:', error);
    }
  };

  const executeWorkflowActions = async (rule: WorkflowRule, triggerData: any) => {
    for (const action of rule.actions) {
      switch (action) {
        case 'create_purchase_order':
          await createAutomaticPurchaseOrder(triggerData);
          break;
        case 'send_notification':
          await sendStockNotification(triggerData);
          break;
        case 'notify_manager':
          await notifyManager(triggerData);
          break;
        case 'email_manager':
          await emailManager(triggerData);
          break;
        default:
          console.log(`Unknown action: ${action}`);
      }
    }
  };

  const createAutomaticPurchaseOrder = async (triggerData: any) => {
    // This would create a purchase order automatically
    console.log('Creating automatic purchase order for:', triggerData);
    
    // For demo purposes, we'll just show a notification
    toast({
      title: "Purchase Order Created",
      description: "Automatic purchase order generated for low stock items",
    });
  };

  const sendStockNotification = async (triggerData: any) => {
    const { data: userContext } = await supabase.rpc('get_user_business_context');
    if (!userContext || userContext.length === 0) return;

    // Create notification in the notifications table
    await supabase
      .from('notifications')
      .insert({
        business_id: userContext[0].business_id,
        type: 'inventory_alert',
        title: 'Low Stock Alert',
        message: `Stock is running low and needs attention`,
        data: triggerData
      });
  };

  const notifyManager = async (triggerData: any) => {
    console.log('Notifying manager about:', triggerData);
  };

  const emailManager = async (triggerData: any) => {
    console.log('Sending email to manager about:', triggerData);
  };

  const toggleWorkflowRule = async (ruleId: string) => {
    setWorkflowRules(prev => 
      prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, is_active: !rule.is_active }
          : rule
      )
    );

    toast({
      title: "Workflow Updated",
      description: "Workflow rule status has been updated",
    });
  };

  const executeManualRestock = async (item: any) => {
    await triggerWorkflow('auto_reorder', {
      product_id: item.product_id,
      store_id: item.store_id,
      current_stock: item.quantity_on_hand,
      manual_trigger: true
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getWorkflowTypeIcon = (type: string) => {
    switch (type) {
      case 'auto_reorder': return <ShoppingCart className="h-4 w-4" />;
      case 'stock_alert': return <AlertTriangle className="h-4 w-4" />;
      case 'emergency_restock': return <Zap className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Inventory Workflows
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading workflows...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Inventory Management Workflows
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="alerts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="alerts">
                Stock Alerts
                {lowStockItems.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {lowStockItems.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="workflows">
                Active Workflows
                <Badge variant="outline" className="ml-2">
                  {workflowRules.filter(r => r.is_active).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending Actions
                <Badge variant="outline" className="ml-2">
                  {pendingWorkflows.filter(p => p.status === 'pending').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="history">Execution History</TabsTrigger>
            </TabsList>

            <TabsContent value="alerts" className="space-y-4">
              <div className="grid gap-4">
                {lowStockItems.length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      All items are adequately stocked. No alerts at this time.
                    </AlertDescription>
                  </Alert>
                ) : (
                  lowStockItems.map((item) => (
                    <Card key={`${item.store_id}-${item.product_id}`} className="border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            <div>
                              <div className="font-medium">{item.products.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.stores.name} • Current: {item.quantity_on_hand} • Threshold: {item.low_stock_threshold}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={item.quantity_on_hand === 0 ? "destructive" : "secondary"}>
                              {item.quantity_on_hand === 0 ? "Out of Stock" : "Low Stock"}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => executeManualRestock(item)}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Reorder
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="workflows" className="space-y-4">
              <div className="grid gap-4">
                {workflowRules.map((rule) => (
                  <Card key={rule.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getWorkflowTypeIcon(rule.workflow_type)}
                          <div>
                            <div className="font-medium capitalize">
                              {rule.workflow_type.replace('_', ' ')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Actions: {rule.actions.join(', ')} • Executed: {rule.execution_count} times
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={rule.is_active ? "default" : "secondary"}>
                            {rule.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleWorkflowRule(rule.id)}
                          >
                            {rule.is_active ? "Disable" : "Enable"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <div className="grid gap-4">
                {pendingWorkflows.map((workflow) => (
                  <Card key={workflow.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getWorkflowTypeIcon(workflow.workflow_type)}
                          <div>
                            <div className="font-medium">
                              {workflow.trigger_data?.product_name || 'Product'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {workflow.trigger_data?.store_name} • Stock: {workflow.trigger_data?.current_stock}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(workflow.status)}
                          <Badge variant={
                            workflow.status === 'completed' ? 'default' :
                            workflow.status === 'failed' ? 'destructive' : 'secondary'
                          }>
                            {workflow.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="grid gap-4">
                {workflowRules.filter(r => r.execution_count > 0).map((rule) => (
                  <Card key={rule.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getWorkflowTypeIcon(rule.workflow_type)}
                          <div>
                            <div className="font-medium capitalize">
                              {rule.workflow_type.replace('_', ' ')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Last executed: {rule.last_triggered ? new Date(rule.last_triggered).toLocaleString() : 'Never'}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {rule.execution_count} executions
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};