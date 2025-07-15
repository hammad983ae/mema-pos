import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  Target,
  Users,
  Package,
  Brain,
  Loader2,
  RefreshCw,
  Lightbulb
} from "lucide-react";

interface Insight {
  type: string;
  title: string;
  description: string;
  confidence: number;
  impact?: string;
  urgency?: string;
  timeframe?: string;
  category?: string;
  actionable?: boolean;
}

interface Forecast {
  type: string;
  title: string;
  description: string;
  urgency: string;
  timeframe: string;
  confidence: number;
}

interface Recommendation {
  action: string;
  reason: string;
  priority: string;
}

interface AIInsightsProps {
  dateRange: { from: Date; to: Date };
  selectedStore: string;
}

export const AIInsights = ({ dateRange, selectedStore }: AIInsightsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [salesInsights, setSalesInsights] = useState<Insight[]>([]);
  const [inventoryForecasts, setInventoryForecasts] = useState<{ forecasts: Forecast[], recommendations: Recommendation[] }>({ forecasts: [], recommendations: [] });
  const [customerInsights, setCustomerInsights] = useState<Insight[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      getUserBusinessId();
    }
  }, [user]);

  useEffect(() => {
    if (businessId) {
      generateAllInsights();
    }
  }, [businessId, dateRange, selectedStore]);

  const getUserBusinessId = async () => {
    try {
      const { data: context, error } = await supabase.rpc('get_user_business_context');
      
      if (error) throw error;
      
      if (context && context.length > 0) {
        setBusinessId(context[0].business_id || null);
      } else {
        setBusinessId(null);
      }
    } catch (error) {
      console.error("Error getting business ID:", error);
    }
  };

  const generateAllInsights = async () => {
    setLoading(true);
    try {
      await Promise.all([
        generateSalesInsights(),
        generateInventoryForecasts(),
        generateCustomerInsights()
      ]);
    } catch (error) {
      console.error("Error generating insights:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI insights",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSalesInsights = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('business-intelligence-ai', {
        body: {
          action: 'sales_insights',
          businessId,
          dateRange: {
            from: dateRange.from.toISOString(),
            to: dateRange.to.toISOString()
          },
          storeId: selectedStore
        }
      });

      if (error) throw error;
      setSalesInsights(data.insights || []);
    } catch (error) {
      console.error("Error generating sales insights:", error);
    }
  };

  const generateInventoryForecasts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('business-intelligence-ai', {
        body: {
          action: 'inventory_forecast',
          businessId,
          storeId: selectedStore
        }
      });

      if (error) throw error;
      setInventoryForecasts(data);
    } catch (error) {
      console.error("Error generating inventory forecasts:", error);
    }
  };

  const generateCustomerInsights = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('business-intelligence-ai', {
        body: {
          action: 'customer_behavior',
          businessId,
          dateRange: {
            from: dateRange.from.toISOString(),
            to: dateRange.to.toISOString()
          },
          storeId: selectedStore
        }
      });

      if (error) throw error;
      setCustomerInsights(data.insights || []);
    } catch (error) {
      console.error("Error generating customer insights:", error);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity': return <Target className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getInsightVariant = (type: string, impact?: string) => {
    if (type === 'warning') return 'destructive';
    if (type === 'opportunity') return 'default';
    if (impact === 'high') return 'default';
    return 'secondary';
  };

  const getUrgencyVariant = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  if (!businessId) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Unable to load business data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">AI Business Intelligence</h2>
            <p className="text-sm text-muted-foreground">
              AI-powered insights, forecasts, and recommendations
            </p>
          </div>
        </div>
        <Button 
          onClick={generateAllInsights} 
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Insights
        </Button>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Sales Insights
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory Forecast
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customer Behavior
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Analyzing sales patterns...</p>
                </div>
              </CardContent>
            </Card>
          ) : salesInsights.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Info className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No sales insights available for the selected period</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {salesInsights.map((insight, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getInsightIcon(insight.type)}
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        {insight.impact && (
                          <Badge variant={getInsightVariant(insight.type, insight.impact)}>
                            {insight.impact} impact
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {Math.round(insight.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{insight.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Generating inventory forecasts...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Forecasts */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Inventory Forecasts
                </h3>
                <div className="grid gap-4">
                  {inventoryForecasts.forecasts.map((forecast, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{forecast.title}</CardTitle>
                          <div className="flex items-center space-x-2">
                            <Badge variant={getUrgencyVariant(forecast.urgency)}>
                              {forecast.urgency} urgency
                            </Badge>
                            <Badge variant="outline">
                              {forecast.timeframe}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{forecast.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {inventoryForecasts.recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Recommended Actions
                  </h3>
                  <div className="grid gap-3">
                    {inventoryForecasts.recommendations.map((rec, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{rec.action}</p>
                              <p className="text-sm text-muted-foreground">{rec.reason}</p>
                            </div>
                            <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                              {rec.priority} priority
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Analyzing customer behavior...</p>
                </div>
              </CardContent>
            </Card>
          ) : customerInsights.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No customer insights available for the selected period</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {customerInsights.map((insight, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <div className="flex items-center space-x-2">
                        {insight.category && (
                          <Badge variant="secondary">
                            {insight.category}
                          </Badge>
                        )}
                        {insight.actionable && (
                          <Badge variant="default">
                            Actionable
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {Math.round(insight.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{insight.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};