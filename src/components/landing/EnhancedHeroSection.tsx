import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { NavigationHeader } from "./NavigationHeader";
import { 
  Brain, 
  Calendar, 
  Store,
  BarChart3,
  Sparkles,
  ArrowRight,
  Zap,
  Users,
  Package
} from "lucide-react";

export const EnhancedHeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const keyFeatures = [
    {
      icon: Brain,
      title: "AI-Powered Everything",
      description: "Smart inventory predictions, scheduling optimization, and business insights",
      gradient: "from-primary to-primary-glow",
      delay: "0s"
    },
    {
      icon: Calendar,
      title: "Drag & Drop Scheduling",
      description: "Intuitive visual scheduling with AI suggestions for optimal team placement",
      gradient: "from-primary-muted to-primary", 
      delay: "0.2s"
    },
    {
      icon: Store,
      title: "Smart POS System",
      description: "Lightning-fast checkout with integrated inventory and customer management",
      gradient: "from-success to-primary-glow",
      delay: "0.4s"
    }
  ];

  return (
    <>
      <NavigationHeader />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-hero min-h-screen flex items-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-primary/20 to-primary-glow/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-primary-light/30 to-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-3/4 left-1/3 w-48 h-48 bg-gradient-to-br from-success/20 to-primary-glow/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Floating Elements Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
            <div className="w-6 h-6 bg-gradient-primary rounded-lg shadow-elegant"></div>
          </div>
          <div className="absolute top-40 right-32 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}>
            <div className="w-4 h-4 bg-gradient-to-br from-primary-glow to-success rounded-full shadow-elegant"></div>
          </div>
          <div className="absolute bottom-32 left-48 animate-bounce" style={{ animationDelay: '2s', animationDuration: '3.5s' }}>
            <div className="w-5 h-5 bg-gradient-accent rounded-lg shadow-elegant"></div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 relative z-10">
          <div className="text-center max-w-6xl mx-auto">
            <Badge className="mb-8 bg-primary/10 text-primary border-primary/20 px-6 py-3 text-base glass-effect shadow-elegant">
              <Sparkles className="h-4 w-4 mr-2" />
              Built by Cosmetics Shop Owners, for Cosmetics Shop Owners
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 bg-gradient-to-br from-foreground via-primary to-primary-glow bg-clip-text text-transparent leading-tight animate-fade-in">
              Mema
            </h1>
            
            <p className="text-xl sm:text-2xl lg:text-3xl text-muted-foreground mb-12 leading-relaxed max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
              The complete business management platform that grows with your cosmetics business
            </p>

            {/* Key Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto">
              {keyFeatures.map((feature, index) => (
                <div 
                  key={feature.title}
                  className="group relative card-modern p-6 rounded-2xl shadow-card hover:shadow-medium transition-all duration-500 hover:scale-105 animate-fade-in"
                  style={{ animationDelay: feature.delay }}
                >
                  <div className="absolute inset-0 bg-gradient-card rounded-2xl"></div>
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-button`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <Button 
                size="xl" 
                className="bg-gradient-primary shadow-button-hover hover:shadow-glow transition-all duration-300 text-lg px-8 py-4"
                onClick={() => navigate('/auth')}
              >
                <Zap className="h-5 w-5 mr-2" />
                Start Free Trial
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                size="xl"
                className="border-2 border-border hover:border-primary glass-effect shadow-soft hover:shadow-card transition-all duration-300 text-lg px-8 py-4"
                onClick={() => navigate('/features/scheduling')}
              >
                <Calendar className="h-5 w-5 mr-2" />
                See AI Scheduling Demo
              </Button>
            </div>

            {/* Live Demo Previews */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <button 
                onClick={() => navigate('/pos')}
                className="group glass-effect p-6 rounded-xl shadow-card hover:shadow-medium transition-all duration-300 hover:scale-105 border border-border"
              >
                <Store className="h-8 w-8 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
                <div className="text-lg font-semibold text-foreground mb-1">Live POS Demo</div>
                <div className="text-sm text-muted-foreground">Try the full checkout experience</div>
              </button>
              
              <button 
                onClick={() => navigate('/features/scheduling')}
                className="group glass-effect p-6 rounded-xl shadow-card hover:shadow-medium transition-all duration-300 hover:scale-105 border border-border"
              >
                <Calendar className="h-8 w-8 mx-auto mb-3 text-primary-muted group-hover:scale-110 transition-transform" />
                <div className="text-lg font-semibold text-foreground mb-1">AI Scheduling</div>
                <div className="text-sm text-muted-foreground">See drag & drop in action</div>
              </button>
              
              <button 
                onClick={() => navigate('/analytics')}
                className="group glass-effect p-6 rounded-xl shadow-card hover:shadow-medium transition-all duration-300 hover:scale-105 border border-border"
              >
                <BarChart3 className="h-8 w-8 mx-auto mb-3 text-success group-hover:scale-110 transition-transform" />
                <div className="text-lg font-semibold text-foreground mb-1">Business Insights</div>
                <div className="text-sm text-muted-foreground">Real-time analytics dashboard</div>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '1s' }}>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">500+</div>
                <div className="text-muted-foreground">Cosmetics Shops</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-glow mb-2">98%</div>
                <div className="text-muted-foreground">Customer Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-success mb-2">$10M+</div>
                <div className="text-muted-foreground">Revenue Processed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};