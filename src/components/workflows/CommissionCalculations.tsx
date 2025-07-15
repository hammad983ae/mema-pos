import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  TrendingUp, 
  Calculator,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  Award,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface CommissionCalculation {
  id: string;
  user_id: string;
  user_name: string;
  period: string;
  sales_amount: number;
  commission_rate: number;
  commission_amount: number;
  tier_achieved: string;
  bonus_amount: number;
  status: 'pending' | 'calculated' | 'paid';
  created_at: string;
}

interface PerformanceMetrics {
  user_id: string;
  user_name: string;
  position_type: string;
  monthly_sales: number;
  monthly_commission: number;
  current_tier: string;
  next_tier_target: number;
  progress_to_next_tier: number;
  total_sales_ytd: number;
  total_commission_ytd: number;
}

export const CommissionCalculations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [calculations, setCalculations] = useState<CommissionCalculation[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  useEffect(() => {
    loadCommissionData();
  }, [selectedPeriod]);

  const loadCommissionData = async () => {
    try {
      setLoading(true);
      
      const { data: userContext } = await supabase.rpc('get_user_business_context');
      if (!userContext || userContext.length === 0) return;

      const businessId = userContext[0].business_id;

      // Load existing commission calculations
      const { data: commissionsData } = await supabase
        .from('commission_payments')
        .select('*')
        .eq('business_id', businessId)
        .eq('payment_period', selectedPeriod)
        .order('created_at', { ascending: false })
        .limit(50);

      // Load employee profiles
      const { data: profilesData } = await supabase
        .from('user_business_memberships')
        .select(`
          user_id,
          profiles(full_name, position_type)
        `)
        .eq('business_id', businessId)
        .eq('is_active', true)
        .neq('role', 'business_owner');

      const profilesMap = new Map(
        profilesData?.map((p: any) => [p.user_id, {
          name: p.profiles?.full_name || 'Unknown',
          position: p.profiles?.position_type || 'employee'
        }]) || []
      );

      // Transform commission data
      const calculationsData: CommissionCalculation[] = commissionsData?.map(comm => ({
        id: comm.id,
        user_id: comm.user_id,
        user_name: profilesMap.get(comm.user_id)?.name || 'Unknown',
        period: comm.payment_period,
        sales_amount: comm.sale_amount,
        commission_rate: comm.commission_rate,
        commission_amount: comm.commission_amount,
        tier_achieved: comm.tier_name || 'Base',
        bonus_amount: 0,
        status: comm.is_paid ? 'paid' : 'calculated',
        created_at: comm.created_at
      })) || [];

      setCalculations(calculationsData);

      // Calculate performance metrics
      await calculatePerformanceMetrics(businessId, profilesMap);

    } catch (error) {
      console.error('Error loading commission data:', error);
      toast({
        title: "Error",
        description: "Failed to load commission data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformanceMetrics = async (businessId: string, profilesMap: Map<string, any>) => {
    try {
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const startOfYear = new Date(currentMonth.getFullYear(), 0, 1);

      // Get monthly sales for each employee
      const { data: monthlySales } = await supabase
        .from('orders')
        .select(`
          user_id,
          total,
          stores!inner(business_id)
        `)
        .eq('stores.business_id', businessId)
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      // Get YTD sales
      const { data: ytdSales } = await supabase
        .from('orders')
        .select(`
          user_id,
          total,
          stores!inner(business_id)
        `)
        .eq('stores.business_id', businessId)
        .eq('status', 'completed')
        .gte('created_at', startOfYear.toISOString());

      // Get commission tiers
      const { data: tiersData } = await supabase
        .from('commission_tiers')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('target_amount');

      // Calculate metrics for each employee
      const metricsData: PerformanceMetrics[] = [];

      for (const [userId, profile] of profilesMap.entries()) {
        const userMonthlySales = monthlySales?.filter(s => s.user_id === userId)
          .reduce((sum, sale) => sum + sale.total, 0) || 0;

        const userYtdSales = ytdSales?.filter(s => s.user_id === userId)
          .reduce((sum, sale) => sum + sale.total, 0) || 0;

        // Find current tier
        const applicableTiers = tiersData?.filter(t => 
          t.role_type === profile.position || t.role_type === 'general'
        ) || [];

        let currentTier = 'Base';
        let nextTierTarget = 0;
        let currentCommissionRate = 0;

        for (const tier of applicableTiers) {
          if (userMonthlySales >= tier.target_amount) {
            currentTier = tier.name;
            currentCommissionRate = tier.commission_rate;
          } else if (nextTierTarget === 0) {
            nextTierTarget = tier.target_amount;
            break;
          }
        }

        const monthlyCommission = userMonthlySales * currentCommissionRate;
        const progressToNextTier = nextTierTarget > 0 
          ? (userMonthlySales / nextTierTarget) * 100 
          : 100;

        // Calculate YTD commission (simplified)
        const ytdCommission = userYtdSales * currentCommissionRate;

        metricsData.push({
          user_id: userId,
          user_name: profile.name,
          position_type: profile.position,
          monthly_sales: userMonthlySales,
          monthly_commission: monthlyCommission,
          current_tier: currentTier,
          next_tier_target: nextTierTarget,
          progress_to_next_tier: Math.min(progressToNextTier, 100),
          total_sales_ytd: userYtdSales,
          total_commission_ytd: ytdCommission
        });
      }

      setMetrics(metricsData.sort((a, b) => b.monthly_sales - a.monthly_sales));

    } catch (error) {
      console.error('Error calculating performance metrics:', error);
    }
  };

  const runCommissionCalculation = async () => {
    try {
      setCalculating(true);
      
      const { data: userContext } = await supabase.rpc('get_user_business_context');
      if (!userContext || userContext.length === 0) return;

      // Get all completed orders for the selected period
      const periodStart = getPeriodStart(selectedPeriod);
      
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          stores!inner(business_id)
        `)
        .eq('stores.business_id', userContext[0].business_id)
        .eq('status', 'completed')
        .gte('created_at', periodStart.toISOString());

      if (!ordersData) return;

      // Calculate commissions for each employee
      const employeeSales = new Map<string, number>();
      
      ordersData.forEach(order => {
        if (order.user_id) {
          const currentSales = employeeSales.get(order.user_id) || 0;
          employeeSales.set(order.user_id, currentSales + order.total);
        }
      });

      // Create commission payments
      const commissionPayments = [];
      
      for (const [userId, salesAmount] of employeeSales.entries()) {
        const commissionRate = await getCommissionRate(userId, salesAmount, selectedPeriod);
        const commissionAmount = salesAmount * commissionRate;

        if (commissionAmount > 0) {
          commissionPayments.push({
            business_id: userContext[0].business_id,
            user_id: userId,
            payment_period: selectedPeriod,
            payment_type: 'sales_commission',
            sale_amount: salesAmount,
            commission_rate: commissionRate,
            commission_amount: commissionAmount,
            is_paid: false
          });
        }
      }

      if (commissionPayments.length > 0) {
        const { error } = await supabase
          .from('commission_payments')
          .insert(commissionPayments);

        if (error) throw error;

        toast({
          title: "Commission Calculation Complete",
          description: `Calculated commissions for ${commissionPayments.length} employees`,
        });

        await loadCommissionData();
      } else {
        toast({
          title: "No Commissions to Calculate",
          description: "No eligible sales found for the selected period",
        });
      }

    } catch (error) {
      console.error('Error calculating commissions:', error);
      toast({
        title: "Calculation Error",
        description: "Failed to calculate commissions",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  const getCommissionRate = async (userId: string, salesAmount: number, period: string) => {
    try {
      const { data } = await supabase.rpc('get_user_commission_rate', {
        p_user_id: userId,
        p_sales_amount: salesAmount,
        p_period: period
      });

      return data || 0;
    } catch (error) {
      console.error('Error getting commission rate:', error);
      return 0;
    }
  };

  const getPeriodStart = (period: string) => {
    const now = new Date();
    switch (period) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'weekly':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        return startOfWeek;
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'yearly':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  };

  const markAsPaid = async (calculationId: string) => {
    try {
      const { error } = await supabase
        .from('commission_payments')
        .update({ 
          is_paid: true, 
          paid_at: new Date().toISOString() 
        })
        .eq('id', calculationId);

      if (error) throw error;

      setCalculations(prev => 
        prev.map(calc => 
          calc.id === calculationId 
            ? { ...calc, status: 'paid' as const }
            : calc
        )
      );

      toast({
        title: "Commission Paid",
        description: "Commission has been marked as paid",
      });

    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({
        title: "Error",
        description: "Failed to mark commission as paid",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Commission Calculations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Clock className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading commission data...</span>
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
              <Calculator className="h-5 w-5" />
              Commission Calculations
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={runCommissionCalculation}
                disabled={calculating}
              >
                {calculating ? (
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Calculator className="h-4 w-4 mr-2" />
                )}
                Calculate
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="performance" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
              <TabsTrigger value="calculations">
                Calculations
                <Badge variant="outline" className="ml-2">
                  {calculations.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending Payments
                <Badge variant="outline" className="ml-2">
                  {calculations.filter(c => c.status !== 'paid').length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid gap-4">
                {metrics.map((metric) => (
                  <Card key={metric.user_id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5" />
                          <div>
                            <div className="font-medium">{metric.user_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {metric.position_type} • Current Tier: {metric.current_tier}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {metric.progress_to_next_tier.toFixed(0)}% to next tier
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Monthly Sales</div>
                          <div className="text-2xl font-bold text-green-600">
                            ${metric.monthly_sales.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Monthly Commission</div>
                          <div className="text-xl font-semibold">
                            ${metric.monthly_commission.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">YTD Sales</div>
                          <div className="text-xl font-semibold">
                            ${metric.total_sales_ytd.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">YTD Commission</div>
                          <div className="text-xl font-semibold">
                            ${metric.total_commission_ytd.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {metric.next_tier_target > 0 && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress to next tier</span>
                            <span>${metric.next_tier_target.toLocaleString()} target</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(metric.progress_to_next_tier, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="calculations" className="space-y-4">
              <div className="grid gap-4">
                {calculations.map((calc) => (
                  <Card key={calc.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-5 w-5 text-green-500" />
                          <div>
                            <div className="font-medium">{calc.user_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {calc.period} • Sales: ${calc.sales_amount.toLocaleString()} • Rate: {(calc.commission_rate * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            ${calc.commission_amount.toFixed(2)}
                          </div>
                          <Badge variant={
                            calc.status === 'paid' ? 'default' : 
                            calc.status === 'calculated' ? 'secondary' : 'destructive'
                          }>
                            {calc.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <div className="grid gap-4">
                {calculations.filter(c => c.status !== 'paid').map((calc) => (
                  <Card key={calc.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          <div>
                            <div className="font-medium">{calc.user_name}</div>
                            <div className="text-sm text-muted-foreground">
                              Commission pending payment
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xl font-bold">
                            ${calc.commission_amount.toFixed(2)}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => markAsPaid(calc.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Paid
                          </Button>
                        </div>
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