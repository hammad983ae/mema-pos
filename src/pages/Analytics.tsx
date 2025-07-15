import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { DashboardOverview } from "@/components/analytics/DashboardOverview";
import { SalesCharts } from "@/components/analytics/SalesCharts";
import { StorePerformance } from "@/components/analytics/StorePerformance";
import { TeamMetrics } from "@/components/analytics/TeamMetrics";
import { RealtimeMetrics } from "@/components/analytics/RealtimeMetrics";
import { AIInsights } from "@/components/analytics/AIInsights";
import { BusinessIntelligenceDashboard } from "@/components/analytics/BusinessIntelligenceDashboard";
import { AdvancedSalesAnalytics } from "@/components/analytics/AdvancedSalesAnalytics";
import { DataMigrationTool } from "@/components/analytics/DataMigrationTool";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useToast } from "@/hooks/use-toast";
import { Download, Filter, Calendar, TrendingUp, Loader2, Brain, Database, Zap } from "lucide-react";

const Analytics = () => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: new Date(),
    to: new Date(),
  });
  const [selectedStore, setSelectedStore] = useState("all");
  
  const { analyticsData, stores, loading } = useAnalyticsData(dateRange, selectedStore);

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your analytics report will be downloaded shortly",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <BackButton to="/dashboard" label="Back to Dashboard" />
            <div className="h-6 w-px bg-border" />
            <h1 className="text-2xl font-bold text-foreground">Business Analytics</h1>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <TrendingUp className="h-3 w-3 mr-1" />
              Live Data
            </Badge>
          </div>
          
          <div className="flex items-center space-x-3">
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DatePickerWithRange
              date={dateRange}
              onDateChange={(newRange) => {
                if (newRange?.from && newRange?.to) {
                  setDateRange({ from: newRange.from, to: newRange.to });
                }
              }}
            />
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Real-time Metrics Bar */}
        <RealtimeMetrics analyticsData={analyticsData} />

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-8 lg:w-[900px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="business-intelligence">BI Dashboard</TabsTrigger>
            <TabsTrigger value="advanced-sales" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Advanced Sales
            </TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="stores">Stores</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="data-migration" className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              Data Migration
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <DashboardOverview 
              dateRange={dateRange}
              selectedStore={selectedStore}
            />
          </TabsContent>

          <TabsContent value="business-intelligence" className="mt-6">
            <BusinessIntelligenceDashboard 
              dateRange={dateRange}
              selectedStore={selectedStore}
            />
          </TabsContent>

          <TabsContent value="advanced-sales" className="mt-6">
            <AdvancedSalesAnalytics 
              dateRange={dateRange}
              selectedStore={selectedStore}
            />
          </TabsContent>

          <TabsContent value="data-migration" className="mt-6">
            <DataMigrationTool />
          </TabsContent>

          <TabsContent value="sales" className="mt-6">
            <SalesCharts 
              dateRange={dateRange}
              selectedStore={selectedStore}
            />
          </TabsContent>

          <TabsContent value="stores" className="mt-6">
            <StorePerformance 
              dateRange={dateRange}
              selectedStore={selectedStore}
            />
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <TeamMetrics 
              dateRange={dateRange}
              selectedStore={selectedStore}
            />
          </TabsContent>

          <TabsContent value="ai-insights" className="mt-6">
            <AIInsights 
              dateRange={dateRange}
              selectedStore={selectedStore}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;