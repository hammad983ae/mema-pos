import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  CheckCircle,
  ArrowRight,
  Building,
  Users,
  Package,
  CreditCard,
  Settings,
  Loader2,
  Star,
  Sparkles,
  LucideIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  completed: boolean;
  action: string;
  route: string;
}

const WelcomeOwner = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [businessData, setBusinessData] = useState<any>(null);
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Load user data and setup status
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      setUserProfile(profile);

      // Get business membership
      const { data: membership } = await supabase
        .from('user_business_memberships')
        .select('business_id')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .maybeSingle();

      if (membership?.business_id) {
        // Get business details separately
        const { data: business } = await supabase
          .from('businesses')
          .select('id, name, email, phone, address, invitation_code')
          .eq('id', membership.business_id)
          .single();

        setBusinessData(business);
        await checkSetupProgress(membership.business_id);
      } else {
        // No business yet, need to create one
        initializeSetupSteps(false);
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      initializeSetupSteps(false);
    } finally {
      setLoading(false);
    }
  };

  const checkSetupProgress = async (businessId: string) => {
    try {
      // Check stores
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('business_id', businessId)
        .limit(1);

      // Check team members  
      const { data: members } = await supabase
        .from('user_business_memberships')
        .select('id')
        .eq('business_id', businessId)
        .neq('user_id', user?.id)
        .limit(1);

      // Check if they have products in their inventory
      let hasProducts = false;
      if (stores && stores.length > 0) {
        const { data: inventory } = await supabase
          .from('inventory')
          .select('id')
          .eq('store_id', stores[0].id)
          .limit(1);
        
        hasProducts = (inventory?.length || 0) > 0;
      }

      const hasStores = (stores?.length || 0) > 0;
      const hasMembers = (members?.length || 0) > 0;

      initializeSetupSteps(true, {
        hasStores,
        hasMembers,
        hasProducts
      });

    } catch (error) {
      console.error('Error checking setup progress:', error);
      initializeSetupSteps(true);
    }
  };

  const initializeSetupSteps = (hasBusiness: boolean, progress?: any) => {
    const steps: SetupStep[] = [
      {
        id: 'business',
        title: 'Business Information',
        description: 'Set up your business details and subscription',
        icon: Building,
        completed: hasBusiness,
        action: hasBusiness ? 'Review' : 'Set Up',
        route: '/business/setup'
      },
      {
        id: 'stores',
        title: 'Add Store Locations',
        description: 'Create your first store location',
        icon: Settings,
        completed: progress?.hasStores || false,
        action: progress?.hasStores ? 'Manage' : 'Add Store',
        route: '/manager'
      },
      {
        id: 'team',
        title: 'Invite Team Members',
        description: 'Add employees and assign roles',
        icon: Users,
        completed: progress?.hasMembers || false,
        action: progress?.hasMembers ? 'Manage Team' : 'Add Members',
        route: '/team'
      },
      {
        id: 'products',
        title: 'Add Products',
        description: 'Set up your product catalog',
        icon: Package,
        completed: progress?.hasProducts || false,
        action: progress?.hasProducts ? 'Manage Products' : 'Add Products',
        route: '/inventory'
      },
      {
        id: 'pos',
        title: 'POS System',
        description: 'Configure your point of sale system',
        icon: CreditCard,
        completed: hasBusiness, // Enabled once business is created
        action: 'Configure POS',
        route: '/pos'
      }
    ];

    setSetupSteps(steps);
  };

  const getCompletionPercentage = () => {
    const completedSteps = setupSteps.filter(step => step.completed).length;
    return Math.round((completedSteps / setupSteps.length) * 100);
  };

  const getNextStep = () => {
    return setupSteps.find(step => !step.completed);
  };

  const handleStepClick = (step: SetupStep) => {
    if (step.id === 'business' && !step.completed) {
      navigate('/business/setup');
    } else if (step.completed || step.id === 'business') {
      navigate(step.route);
    } else {
      toast({
        title: "Complete previous steps first",
        description: "Please complete your business setup before proceeding.",
        variant: "destructive"
      });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const nextStep = getNextStep();
  const completionPercentage = getCompletionPercentage();

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold">Mema</span>
          </div>
          
          <h1 className="text-4xl font-bold mb-2">
            {getGreeting()}, {userProfile?.full_name || 'Owner'}! 
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            {businessData ? `Welcome to ${businessData.name}` : "Let's get your business set up for success"}
          </p>
          
          {businessData && (
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <span>Business Code: <Badge variant="secondary">{businessData.invitation_code}</Badge></span>
            </div>
          )}
        </div>

        {/* Progress Overview */}
        <Card className="mb-8 bg-card/50 backdrop-blur-sm border-0 shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Setup Progress</CardTitle>
                <p className="text-muted-foreground">
                  {completionPercentage === 100 
                    ? "🎉 All set up! Your business is ready to go." 
                    : `${setupSteps.filter(s => s.completed).length} of ${setupSteps.length} steps completed`
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{completionPercentage}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={completionPercentage} className="h-3 mb-6" />
            
            {nextStep && (
              <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <nextStep.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Next: {nextStep.title}</h3>
                      <p className="text-sm text-muted-foreground">{nextStep.description}</p>
                    </div>
                  </div>
                  <Button onClick={() => handleStepClick(nextStep)}>
                    {nextStep.action}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {setupSteps.map((step, index) => {
            const Icon = step.icon;
            const isAccessible = step.completed || index === 0 || setupSteps[index - 1]?.completed;
            
            return (
              <Card 
                key={step.id}
                className={`cursor-pointer transition-all hover:shadow-lg bg-card/50 backdrop-blur-sm border-0 shadow-elegant ${
                  step.completed 
                    ? 'ring-2 ring-success/20 bg-success/5' 
                    : isAccessible 
                    ? 'hover:ring-2 hover:ring-primary/20' 
                    : 'opacity-60'
                }`}
                onClick={() => isAccessible && handleStepClick(step)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      step.completed 
                        ? 'bg-success text-success-foreground' 
                        : isAccessible 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    {step.completed && (
                      <Badge variant="secondary" className="bg-success/20 text-success">
                        Complete
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{step.action}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        {completionPercentage === 100 && (
          <Card className="mt-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <Star className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">🎉 You're all set!</h2>
                <p className="text-muted-foreground mb-6">
                  Your business is fully configured and ready to start serving customers.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button onClick={() => navigate('/manager')} size="lg">
                    Go to Manager Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/pos/login')} size="lg">
                    Launch POS System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WelcomeOwner;