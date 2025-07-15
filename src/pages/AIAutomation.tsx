import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Bot, 
  Calendar, 
  Package, 
  GraduationCap,
  Settings,
  Activity,
  Users,
  MessageSquare,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Loader2,
  BarChart3,
  Target,
  Lightbulb
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/ui/back-button";

interface AIService {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'learning';
  icon: React.ReactNode;
  metrics: {
    accuracy: number;
    usage: number;
    impact: string;
  };
  lastActive: string;
}

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  executions: number;
}

export default function AIAutomation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [aiServices, setAIServices] = useState<AIService[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [selectedService, setSelectedService] = useState<AIService | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [overallPerformance, setOverallPerformance] = useState({
    efficiency: 85,
    accuracy: 92,
    cost_savings: 34,
    user_satisfaction: 88
  });

  useEffect(() => {
    loadAIServices();
    loadAutomationRules();
  }, []);

  const loadAIServices = () => {
    const services: AIService[] = [
      {
        id: 'scheduling',
        name: 'AI Scheduling Assistant',
        description: 'Optimizes team schedules and suggests best pairings',
        status: 'active',
        icon: <Calendar className="h-5 w-5 text-blue-600" />,
        metrics: { accuracy: 89, usage: 245, impact: '+15% efficiency' },
        lastActive: '2 minutes ago'
      },
      {
        id: 'customer_service',
        name: 'Customer Service Chatbot',
        description: 'Handles customer inquiries with intelligent responses',
        status: 'active',
        icon: <MessageSquare className="h-5 w-5 text-green-600" />,
        metrics: { accuracy: 94, usage: 1247, impact: '67% resolution rate' },
        lastActive: 'Active now'
      },
      {
        id: 'inventory',
        name: 'Inventory AI Manager',
        description: 'Predicts stock needs and automates reordering',
        status: 'learning',
        icon: <Package className="h-5 w-5 text-orange-600" />,
        metrics: { accuracy: 78, usage: 89, impact: '23% cost reduction' },
        lastActive: '15 minutes ago'
      },
      {
        id: 'training',
        name: 'Sales Training AI',
        description: 'Personalized training and performance coaching',
        status: 'active',
        icon: <GraduationCap className="h-5 w-5 text-purple-600" />,
        metrics: { accuracy: 91, usage: 156, impact: '+28% conversion' },
        lastActive: '5 minutes ago'
      }
    ];
    setAIServices(services);
  };

  const loadAutomationRules = () => {
    const rules: AutomationRule[] = [
      {
        id: '1',
        name: 'Low Stock Alert',
        trigger: 'Inventory level < 10 units',
        action: 'Generate purchase order + notify manager',
        enabled: true,
        executions: 23
      },
      {
        id: '2',
        name: 'Customer Follow-up',
        trigger: 'No response for 24 hours',
        action: 'Send personalized follow-up message',
        enabled: true,
        executions: 156
      },
      {
        id: '3',
        name: 'Team Performance Alert',
        trigger: 'Sales below target for 3 days',
        action: 'Schedule AI coaching session',
        enabled: false,
        executions: 8
      },
      {
        id: '4',
        name: 'Schedule Optimization',
        trigger: 'New week starts',
        action: 'Generate optimal team pairings',
        enabled: true,
        executions: 4
      }
    ];
    setAutomationRules(rules);
  };

  const toggleAIService = async (serviceId: string, enabled: boolean) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAIServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { ...service, status: enabled ? 'active' : 'inactive' }
          : service
      ));

      toast({
        title: enabled ? "AI Service Activated" : "AI Service Deactivated",
        description: `${serviceId} service has been ${enabled ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle AI service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomationRule = (ruleId: string, enabled: boolean) => {
    setAutomationRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled } : rule
    ));
    
    toast({
      title: enabled ? "Automation Enabled" : "Automation Disabled",
      description: `Rule has been ${enabled ? 'enabled' : 'disabled'}`,
    });
  };

  const openAIServiceSettings = (serviceId: string, serviceName: string) => {
    console.log("Opening settings for AI service:", { serviceId, serviceName });
    const service = aiServices.find(s => s.id === serviceId);
    if (service) {
      setSelectedService(service);
      setSettingsOpen(true);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case 'learning':
        return <Badge className="bg-yellow-100 text-yellow-700">Learning</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      
      {/* AI Service Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {selectedService?.name} Settings
            </DialogTitle>
            <DialogDescription>
              Configure the settings and parameters for {selectedService?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedService && (
            <div className="space-y-6 py-4">
              {/* Service Status */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Service Status</Label>
                  <p className="text-sm text-muted-foreground">Enable or disable this AI service</p>
                </div>
                <Switch 
                  checked={selectedService.status === 'active'}
                  onCheckedChange={(checked) => toggleAIService(selectedService.id, checked)}
                />
              </div>

              {/* Accuracy Threshold */}
              <div className="space-y-3">
                <div>
                  <Label className="text-base font-medium">Accuracy Threshold</Label>
                  <p className="text-sm text-muted-foreground">Minimum accuracy required for automated decisions</p>
                </div>
                <div className="space-y-2">
                  <Slider
                    value={[selectedService.metrics.accuracy]}
                    max={100}
                    min={50}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>50%</span>
                    <span className="font-medium">{selectedService.metrics.accuracy}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Service-specific settings */}
              {selectedService.id === 'scheduling' && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Schedule Optimization</Label>
                    <p className="text-sm text-muted-foreground">Configure how the AI optimizes team schedules</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="team-compatibility">Consider team compatibility</Label>
                      <Switch id="team-compatibility" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="skill-matching">Enable skill-based matching</Label>
                      <Switch id="skill-matching" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="workload-balance">Balance workload automatically</Label>
                      <Switch id="workload-balance" defaultChecked />
                    </div>
                  </div>
                </div>
              )}

              {selectedService.id === 'customer_service' && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Chatbot Configuration</Label>
                    <p className="text-sm text-muted-foreground">Configure customer service chatbot behavior</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-escalate">Auto-escalate complex issues</Label>
                      <Switch id="auto-escalate" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="learn-responses">Learn from agent responses</Label>
                      <Switch id="learn-responses" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sentiment-analysis">Enable sentiment analysis</Label>
                      <Switch id="sentiment-analysis" defaultChecked />
                    </div>
                  </div>
                </div>
              )}

              {selectedService.id === 'inventory' && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Inventory Predictions</Label>
                    <p className="text-sm text-muted-foreground">Configure inventory management AI behavior</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-reorder">Enable automatic reordering</Label>
                      <Switch id="auto-reorder" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="seasonal-adjust">Seasonal demand adjustment</Label>
                      <Switch id="seasonal-adjust" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="supplier-optimize">Optimize supplier selection</Label>
                      <Switch id="supplier-optimize" defaultChecked />
                    </div>
                  </div>
                </div>
              )}

              {selectedService.id === 'training' && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Training AI Settings</Label>
                    <p className="text-sm text-muted-foreground">Configure personalized training and coaching</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="adaptive-learning">Adaptive learning paths</Label>
                      <Switch id="adaptive-learning" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="performance-tracking">Real-time performance tracking</Label>
                      <Switch id="performance-tracking" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="coaching-notifications">Proactive coaching notifications</Label>
                      <Switch id="coaching-notifications" defaultChecked />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({
                    title: "Settings Saved",
                    description: `${selectedService.name} settings have been updated successfully.`,
                  });
                  setSettingsOpen(false);
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            AI & Automation Hub
          </h1>
          <p className="text-muted-foreground">
            Manage your intelligent business automation and AI services
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">System Status</p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Efficiency</p>
                <p className="text-2xl font-bold">{overallPerformance.efficiency}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={overallPerformance.efficiency} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-2xl font-bold">{overallPerformance.accuracy}%</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={overallPerformance.accuracy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cost Savings</p>
                <p className="text-2xl font-bold">{overallPerformance.cost_savings}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
            <Progress value={overallPerformance.cost_savings} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Satisfaction</p>
                <p className="text-2xl font-bold">{overallPerformance.user_satisfaction}%</p>
              </div>
              <Sparkles className="h-8 w-8 text-yellow-500" />
            </div>
            <Progress value={overallPerformance.user_satisfaction} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">AI Services</TabsTrigger>
          <TabsTrigger value="automation">Automation Rules</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiServices.map((service) => (
              <Card key={service.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {service.icon}
                      <div>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                    </div>
                    {getStatusBadge(service.status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Accuracy</p>
                      <p className="font-semibold">{service.metrics.accuracy}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Usage</p>
                      <p className="font-semibold">{service.metrics.usage}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Impact</p>
                      <p className="font-semibold text-green-600">{service.metrics.impact}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Last active: {service.lastActive}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={service.status === 'active'}
                        onCheckedChange={(checked) => toggleAIService(service.id, checked)}
                        disabled={loading}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openAIServiceSettings(service.id, service.name)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>

                {service.status === 'learning' && (
                  <div className="absolute top-0 left-0 right-0 bg-yellow-500/10 p-2">
                    <div className="flex items-center gap-2 text-yellow-700 text-xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      AI is learning from new data...
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <div className="space-y-4">
            {automationRules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{rule.name}</h3>
                        {rule.enabled ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Trigger:</strong> {rule.trigger}</p>
                        <p><strong>Action:</strong> {rule.action}</p>
                        <p className="text-xs">Executed {rule.executions} times</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-bold">{rule.executions}</p>
                        <p className="text-xs text-muted-foreground">executions</p>
                      </div>
                      <Switch 
                        checked={rule.enabled}
                        onCheckedChange={(checked) => toggleAutomationRule(rule.id, checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-dashed border-2 border-muted">
            <CardContent className="p-6 text-center">
              <Zap className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">Create New Automation Rule</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set up custom triggers and actions to automate your business processes
              </p>
              <Button>
                <Zap className="h-4 w-4 mr-2" />
                Add Automation Rule
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Scheduling Optimization</h4>
                  <p className="text-sm text-muted-foreground">
                    Pair Sarah and Mike together on Tuesday shifts for 15% better performance
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Inventory Prediction</h4>
                  <p className="text-sm text-muted-foreground">
                    Order 50 units of Product A before Friday to avoid stockout
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Training Focus</h4>
                  <p className="text-sm text-muted-foreground">
                    Team needs objection handling training - 23% improvement potential
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  Recent AI Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">2 min ago</span>
                  <span>Customer service bot resolved inquiry #1247</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span className="text-muted-foreground">15 min ago</span>
                  <span>Schedule AI optimized Tuesday pairings</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-muted-foreground">1 hour ago</span>
                  <span>Inventory AI predicted reorder for 3 products</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                  <span className="text-muted-foreground">2 hours ago</span>
                  <span>Training AI provided coaching to 5 team members</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                AI Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Performance analytics dashboard coming soon</p>
                <p className="text-sm">Track AI efficiency, accuracy, and business impact over time</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}