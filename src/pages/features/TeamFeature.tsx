import { Button } from "@/components/ui/button";
import { NavigationHeader } from "@/components/landing/NavigationHeader";
import { Users, Target, TrendingUp, Award, Clock, BarChart3, UserCheck, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TeamFeature = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Employee Management",
      description: "Comprehensive employee profiles with role-based access and permissions"
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Set and monitor individual and team performance goals with real-time progress"
    },
    {
      icon: TrendingUp,
      title: "Commission Management",
      description: "Automated commission calculations with tiered structures and bonuses"
    },
    {
      icon: Award,
      title: "Performance Analytics",
      description: "Detailed insights into team performance and productivity metrics"
    },
    {
      icon: Clock,
      title: "Time & Attendance",
      description: "Smart scheduling with clock-in/out and break management"
    },
    {
      icon: BarChart3,
      title: "Sales Leaderboards",
      description: "Gamified sales tracking with leaderboards and achievement badges"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <NavigationHeader />
      
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Trophy className="h-4 w-4" />
              Team Performance & Management
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-success bg-clip-text text-transparent">
              Empower Your Team
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Comprehensive team management with performance tracking, goal setting, and commission management
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-soft"
                onClick={() => navigate('/team/demo')}
              >
                <UserCheck className="h-5 w-5 mr-2" />
                Try Team Demo
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/auth')}
              >
                Get Started Free
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <div key={index} className="glass-effect p-6 rounded-xl border border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-primary/5 via-primary-glow/5 to-success/5 rounded-2xl p-8 border border-primary/10">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Team Management?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of businesses that have improved their team performance with our comprehensive management tools
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-success hover:shadow-soft"
              onClick={() => navigate('/auth')}
            >
              Start Your Free Trial
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamFeature;