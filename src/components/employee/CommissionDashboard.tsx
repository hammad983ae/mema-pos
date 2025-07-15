import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  Calendar,
  Trophy,
  Clock,
  Percent,
  Calculator
} from "lucide-react";

interface CommissionData {
  current_sales: number;
  commission_rate: number;
  estimated_commission: number;
  tier_name?: string;
  opens_count: number;
  upsells_count: number;
  position_type?: string;
}

interface GoalProgress {
  goal_id: string;
  goal_type: string;
  position_type?: string;
  target_amount?: number;
  target_count?: number;
  current_amount: number;
  current_count: number;
  progress_percentage: number;
  days_remaining: number;
  estimated_daily_needed: number;
}

const CommissionDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [commissionData, setCommissionData] = useState<CommissionData>({
    current_sales: 0,
    commission_rate: 0,
    estimated_commission: 0,
    opens_count: 0,
    upsells_count: 0,
  });
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchCommissionData();
    }
  }, [user]);

  const fetchCommissionData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user profile with position type
      const { data: profile } = await supabase
        .from('profiles')
        .select('position_type, full_name')
        .eq('user_id', user.id)
        .single();

      setUserProfile(profile);

      // Get current month's sales
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data: salesData } = await supabase
        .from('orders')
        .select('total, sale_type, created_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      // Calculate current month sales and counts
      const currentSales = salesData?.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0;
      const opensCount = salesData?.filter(order => order.sale_type === 'open').length || 0;
      const upsellsCount = salesData?.filter(order => order.sale_type === 'upsell').length || 0;

      // Get current commission tier
      const { data: tierData } = await supabase
        .from('commission_tiers')
        .select('*')
        .eq('role_type', profile?.position_type || 'sales_associate')
        .eq('is_active', true)
        .lte('target_amount', currentSales)
        .order('target_amount', { ascending: false })
        .limit(1)
        .single();

      const commissionRate = tierData?.commission_rate || 0;
      const estimatedCommission = currentSales * (commissionRate / 100);

      setCommissionData({
        current_sales: currentSales,
        commission_rate: commissionRate,
        estimated_commission: estimatedCommission,
        tier_name: tierData?.name,
        opens_count: opensCount,
        upsells_count: upsellsCount,
        position_type: profile?.position_type,
      });

      // Get active goals and calculate progress
      const { data: goalsData } = await supabase
        .from('sales_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0]);

      if (goalsData) {
        const progressData = await Promise.all(
          goalsData.map(async (goal) => {
            // Get sales data for this goal period
            const { data: goalSales } = await supabase
              .from('orders')
              .select('total, sale_type')
              .eq('user_id', user.id)
              .eq('status', 'completed')
              .gte('created_at', `${goal.start_date}T00:00:00`)
              .lte('created_at', `${goal.end_date}T23:59:59`);

            let currentAmount = 0;
            let currentCount = 0;

            if (goalSales) {
              if (goal.position_type === 'opener') {
                const opens = goalSales.filter(sale => sale.sale_type === 'open');
                currentAmount = opens.reduce((sum, sale) => sum + parseFloat(sale.total.toString()), 0);
                currentCount = opens.length;
              } else if (goal.position_type === 'upseller') {
                const upsells = goalSales.filter(sale => sale.sale_type === 'upsell');
                currentAmount = upsells.reduce((sum, sale) => sum + parseFloat(sale.total.toString()), 0);
                currentCount = upsells.length;
              } else {
                currentAmount = goalSales.reduce((sum, sale) => sum + parseFloat(sale.total.toString()), 0);
                currentCount = goalSales.length;
              }
            }

            // Calculate progress percentage
            let progressPercentage = 0;
            if (goal.target_count && goal.target_count > 0) {
              progressPercentage = (currentCount / goal.target_count) * 100;
            } else if (goal.target_amount && goal.target_amount > 0) {
              progressPercentage = (currentAmount / goal.target_amount) * 100;
            }

            // Calculate days remaining
            const endDate = new Date(goal.end_date);
            const today = new Date();
            const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24)));

            // Calculate estimated daily amount needed
            const remaining = goal.target_count 
              ? Math.max(0, goal.target_count - currentCount)
              : Math.max(0, (goal.target_amount || 0) - currentAmount);
            const estimatedDailyNeeded = daysRemaining > 0 ? remaining / daysRemaining : 0;

            return {
              goal_id: goal.id,
              goal_type: goal.goal_type,
              position_type: goal.position_type,
              target_amount: goal.target_amount,
              target_count: goal.target_count,
              current_amount: currentAmount,
              current_count: currentCount,
              progress_percentage: Math.min(progressPercentage, 100),
              days_remaining: daysRemaining,
              estimated_daily_needed: estimatedDailyNeeded,
            };
          })
        );

        setGoalProgress(progressData);
      }

    } catch (error) {
      console.error('Error fetching commission data:', error);
      toast({
        title: "Error",
        description: "Failed to load commission data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Commission Overview */}
      <Card className="bg-gradient-card border-0 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-success" />
            Current Month Performance
            {commissionData.position_type && (
              <Badge variant="outline" className="ml-2 capitalize">
                {commissionData.position_type}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                ${commissionData.current_sales.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Sales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                ${commissionData.estimated_commission.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Estimated Commission ({commissionData.commission_rate}%)
              </div>
            </div>
          </div>

          {commissionData.tier_name && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
              <Trophy className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-sm font-medium text-primary">
                Current Tier: {commissionData.tier_name}
              </p>
            </div>
          )}

          {/* Role-specific metrics */}
          {commissionData.position_type && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="text-center">
                <div className="text-lg font-bold text-warning">
                  {commissionData.opens_count}
                </div>
                <div className="text-xs text-muted-foreground">Opens This Month</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-info">
                  {commissionData.upsells_count}
                </div>
                <div className="text-xs text-muted-foreground">Upsells This Month</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Progress */}
      {goalProgress.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Active Goals
          </h3>
          
          {goalProgress.map((goal) => (
            <Card key={goal.goal_id} className="bg-gradient-card border-0 shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold capitalize">
                      {goal.position_type ? `${goal.position_type} ` : ''}{goal.goal_type} Goal
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {goal.target_count ? (
                        `Target: ${goal.target_count} ${goal.position_type === 'opener' ? 'opens' : goal.position_type === 'upseller' ? 'upsells' : 'sales'}`
                      ) : (
                        `Target: $${goal.target_amount?.toLocaleString() || 0}`
                      )}
                    </p>
                  </div>
                  <Badge 
                    variant={goal.progress_percentage >= 100 ? "default" : goal.days_remaining <= 1 ? "destructive" : "outline"}
                  >
                    {goal.progress_percentage >= 100 ? "Complete" : `${goal.days_remaining} days left`}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{goal.progress_percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={goal.progress_percentage} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">
                      {goal.target_count ? goal.current_count : `$${goal.current_amount.toLocaleString()}`}
                    </div>
                    <div className="text-xs text-muted-foreground">Current</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-warning">
                      {goal.target_count ? 
                        Math.max(0, goal.target_count - goal.current_count) :
                        `$${Math.max(0, (goal.target_amount || 0) - goal.current_amount).toLocaleString()}`
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">Remaining</div>
                  </div>
                </div>

                {goal.days_remaining > 0 && goal.estimated_daily_needed > 0 && (
                  <div className="bg-accent/20 border border-accent/40 rounded-lg p-3 text-center">
                    <Calculator className="h-4 w-4 text-accent mx-auto mb-1" />
                    <p className="text-sm text-accent font-medium">
                      Need {goal.target_count ? 
                        `${Math.ceil(goal.estimated_daily_needed)} ${goal.position_type === 'opener' ? 'opens' : goal.position_type === 'upseller' ? 'upsells' : 'sales'} per day` :
                        `$${goal.estimated_daily_needed.toLocaleString()} per day`
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">to reach your goal</p>
                  </div>
                )}

                {goal.progress_percentage >= 100 && (
                  <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-center">
                    <Trophy className="h-5 w-5 text-success mx-auto mb-1" />
                    <p className="text-sm font-medium text-success">Goal Achieved! 🎉</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Motivational Section */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-0">
        <CardContent className="pt-6 text-center">
          <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold mb-2">Keep Going!</h3>
          <p className="text-sm text-muted-foreground">
            You're making great progress. Every sale brings you closer to your goals and higher commission tiers!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionDashboard;