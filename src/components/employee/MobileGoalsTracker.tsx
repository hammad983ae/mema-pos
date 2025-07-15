import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Target, 
  Plus, 
  Edit3, 
  TrendingUp, 
  Calendar,
  DollarSign,
  ShoppingCart,
  Trophy,
  CheckCircle
} from "lucide-react";

interface SalesGoal {
  id: string;
  goal_type: string;
  position_type?: string;
  target_amount?: number;
  target_count?: number;
  target_transactions?: number;
  current_count?: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

interface GoalProgress {
  current_amount: number;
  current_transactions: number;
  current_count?: number;
  progress_percentage: number;
  days_remaining: number;
}

const MobileGoalsTracker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [goals, setGoals] = useState<SalesGoal[]>([]);
  const [goalProgress, setGoalProgress] = useState<{ [key: string]: GoalProgress }>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_type: 'daily',
    position_type: '', // opener or upseller
    target_amount: '',
    target_count: '', // for opens/upsells count
    target_transactions: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);

  const [userPositionType, setUserPositionType] = useState<string>('');

  useEffect(() => {
    fetchGoals();
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('position_type')
        .eq('user_id', user.id)
        .single();
      
      if (data?.position_type) {
        setUserPositionType(data.position_type);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data: goalsData } = await supabase
        .from('sales_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (goalsData) {
        setGoals(goalsData);
        await calculateProgress(goalsData);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: "Error",
        description: "Failed to load goals",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = async (goalsData: SalesGoal[]) => {
    if (!user) return;

    const progressData: { [key: string]: GoalProgress } = {};

    for (const goal of goalsData) {
      if (!goal.is_active) continue;

      try {
        // Get sales data based on goal type
        let query = supabase
          .from('orders')
          .select('total, created_at, sale_type')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('created_at', `${goal.start_date}T00:00:00`)
          .lt('created_at', `${goal.end_date}T23:59:59`);

        // Filter by sale type if it's a position-specific goal
        if (goal.position_type === 'opener') {
          query = query.eq('sale_type', 'open');
        } else if (goal.position_type === 'upseller') {
          query = query.eq('sale_type', 'upsell');
        }

        const { data: orders } = await query;

        if (orders) {
          const currentAmount = orders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
          const currentTransactions = orders.length;
          const currentCount = goal.current_count || orders.length;
          
          // Calculate progress based on goal type
          let progressPercentage = 0;
          if (goal.target_count && goal.target_count > 0) {
            // Count-based goal (opens/upsells)
            progressPercentage = Math.min((currentCount / goal.target_count) * 100, 100);
          } else if (goal.target_amount && goal.target_amount > 0) {
            // Amount-based goal
            progressPercentage = Math.min((currentAmount / parseFloat(goal.target_amount.toString())) * 100, 100);
          }
          
          const endDate = new Date(goal.end_date);
          const today = new Date();
          const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24)));

          progressData[goal.id] = {
            current_amount: currentAmount,
            current_transactions: currentTransactions,
            current_count: currentCount,
            progress_percentage: progressPercentage,
            days_remaining: daysRemaining
          };
        }
      } catch (error) {
        console.error('Error calculating progress for goal:', goal.id, error);
      }
    }

    setGoalProgress(progressData);
  };

  const createGoal = async () => {
    if (!user || (!newGoal.target_amount && !newGoal.target_count)) return;

    try {
      let endDate = newGoal.end_date;
      
      // Auto-calculate end date based on goal type
      if (newGoal.goal_type === 'daily') {
        endDate = newGoal.start_date;
      } else if (newGoal.goal_type === 'weekly') {
        const startDate = new Date(newGoal.start_date);
        startDate.setDate(startDate.getDate() + 6);
        endDate = startDate.toISOString().split('T')[0];
      } else if (newGoal.goal_type === 'monthly') {
        const startDate = new Date(newGoal.start_date);
        startDate.setMonth(startDate.getMonth() + 1);
        startDate.setDate(startDate.getDate() - 1);
        endDate = startDate.toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('sales_goals')
        .insert({
          user_id: user.id,
          business_id: '00000000-0000-0000-0000-000000000000', // Will be updated when user has business context
          goal_type: newGoal.goal_type,
          position_type: newGoal.position_type || null,
          target_amount: newGoal.target_amount ? parseFloat(newGoal.target_amount) : null,
          target_count: newGoal.target_count ? parseInt(newGoal.target_count) : null,
          target_transactions: newGoal.target_transactions ? parseInt(newGoal.target_transactions) : null,
          start_date: newGoal.start_date,
          end_date: endDate,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Goal Created",
        description: `Your ${newGoal.goal_type} goal has been set successfully`,
      });

      setShowCreateForm(false);
      setNewGoal({
        goal_type: 'daily',
        position_type: '',
        target_amount: '',
        target_count: '',
        target_transactions: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      });
      
      fetchGoals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create goal",
        variant: "destructive"
      });
    }
  };

  const toggleGoalStatus = async (goalId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('sales_goals')
        .update({ is_active: !isActive })
        .eq('id', goalId);

      if (error) throw error;

      toast({
        title: isActive ? "Goal Deactivated" : "Goal Activated",
        description: `Goal has been ${isActive ? 'deactivated' : 'activated'}`,
      });

      fetchGoals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update goal",
        variant: "destructive"
      });
    }
  };

  const getGoalStatusColor = (goal: SalesGoal, progress?: GoalProgress) => {
    if (!goal.is_active) return 'secondary';
    if (!progress) return 'outline';
    
    if (progress.progress_percentage >= 100) return 'default';
    if (progress.progress_percentage >= 75) return 'secondary';
    if (progress.days_remaining <= 1) return 'destructive';
    return 'outline';
  };

  const getGoalStatusText = (goal: SalesGoal, progress?: GoalProgress) => {
    if (!goal.is_active) return 'Inactive';
    if (!progress) return 'No Progress';
    
    if (progress.progress_percentage >= 100) return 'Completed';
    if (progress.days_remaining === 0) return 'Due Today';
    if (progress.days_remaining === 1) return '1 Day Left';
    return `${progress.days_remaining} Days Left`;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sales Goals</h2>
        <Button 
          size="sm"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {/* Create Goal Form */}
      {showCreateForm && (
        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Create New Goal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="goal_type">Goal Type</Label>
                <select
                  id="goal_type"
                  value={newGoal.goal_type}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, goal_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              <div>
                <Label htmlFor="position_type">Position Type</Label>
                <select
                  id="position_type"
                  value={newGoal.position_type}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, position_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">General Goal</option>
                  <option value="opener">Opener Goal</option>
                  <option value="upseller">Upseller Goal</option>
                </select>
              </div>
            </div>

            {newGoal.position_type ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="target_count">
                    {newGoal.position_type === 'opener' ? 'Opens Target' : 'Upsells Target'}
                  </Label>
                  <Input
                    id="target_count"
                    type="number"
                    placeholder={newGoal.position_type === 'opener' ? '50' : '10'}
                    value={newGoal.target_count}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, target_count: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="target_amount">Sales Target ($) (optional)</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    step="0.01"
                    placeholder="10000.00"
                    value={newGoal.target_amount}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, target_amount: e.target.value }))}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="target_amount">Sales Target ($)</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    step="0.01"
                    placeholder="1000.00"
                    value={newGoal.target_amount}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, target_amount: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="target_transactions">Transactions (optional)</Label>
                  <Input
                    id="target_transactions"
                    type="number"
                    placeholder="20"
                    value={newGoal.target_transactions}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, target_transactions: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={newGoal.start_date}
                onChange={(e) => setNewGoal(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={createGoal} 
                className="flex-1"
                disabled={!newGoal.target_amount && !newGoal.target_count}
              >
                <Target className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Goals */}
      <div className="space-y-4">
        {goals.filter(goal => goal.is_active).map((goal) => {
          const progress = goalProgress[goal.id];
          
          return (
            <Card key={goal.id} className="bg-gradient-card border-0 shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold capitalize">
                        {goal.position_type ? `${goal.position_type} ` : ''}{goal.goal_type} Goal
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {goal.target_count ? (
                          `${goal.target_count} ${goal.position_type === 'opener' ? 'opens' : goal.position_type === 'upseller' ? 'upsells' : 'sales'} target`
                        ) : (
                          `$${goal.target_amount?.toFixed(2) || '0.00'} target`
                        )}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getGoalStatusColor(goal, progress)}>
                    {getGoalStatusText(goal, progress)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {progress && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{progress.progress_percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress.progress_percentage} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {goal.target_count ? (
                        <>
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary">
                              {progress.current_count || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {goal.position_type === 'opener' ? 'Opens' : goal.position_type === 'upseller' ? 'Upsells' : 'Count'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-success">
                              {Math.max(0, (goal.target_count || 0) - (progress.current_count || 0))}
                            </div>
                            <div className="text-xs text-muted-foreground">Remaining</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary">
                              ${progress.current_amount.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">Current Sales</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-success">
                              {progress.current_transactions}
                            </div>
                            <div className="text-xs text-muted-foreground">Transactions</div>
                          </div>
                        </>
                      )}
                    </div>

                    {progress.progress_percentage >= 100 && (
                      <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-center">
                        <Trophy className="h-5 w-5 text-success mx-auto mb-1" />
                        <p className="text-sm font-medium text-success">Goal Achieved!</p>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(goal.start_date).toLocaleDateString()} - {new Date(goal.end_date).toLocaleDateString()}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => toggleGoalStatus(goal.id, goal.is_active)}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Inactive Goals */}
      {goals.filter(goal => !goal.is_active).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground">Previous Goals</h3>
          {goals.filter(goal => !goal.is_active).slice(0, 3).map((goal) => (
            <Card key={goal.id} className="bg-muted/30 border-0">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{goal.goal_type} Goal</p>
                    <p className="text-sm text-muted-foreground">
                      ${goal.target_amount.toFixed(2)} target
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">Completed</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(goal.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {goals.length === 0 && (
        <Card className="bg-gradient-card border-0 shadow-card">
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Goals Set</h3>
            <p className="text-muted-foreground mb-4">
              Set your first sales goal to start tracking your performance
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MobileGoalsTracker;