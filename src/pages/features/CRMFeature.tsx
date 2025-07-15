import { Button } from "@/components/ui/button";
import { NavigationHeader } from "@/components/landing/NavigationHeader";
import { Heart, Users, MessageSquare, Gift, BarChart3, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CRMFeature = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Customer Profiles",
      description: "Comprehensive customer database with purchase history and preferences"
    },
    {
      icon: Heart,
      title: "Loyalty Programs", 
      description: "Customizable rewards and points system to increase customer retention"
    },
    {
      icon: MessageSquare,
      title: "Communication Hub",
      description: "Automated messaging, email campaigns, and customer support integration"
    },
    {
      icon: Gift,
      title: "Personalization Engine",
      description: "AI-powered product recommendations and personalized shopping experiences"
    },
    {
      icon: BarChart3,
      title: "Customer Analytics",
      description: "Deep insights into customer behavior, lifetime value, and engagement metrics"
    },
    {
      icon: Zap,
      title: "Automated Workflows",
      description: "Smart automation for follow-ups, birthday rewards, and re-engagement campaigns"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <NavigationHeader />
      
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-muted/10 text-primary-muted px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Heart className="h-4 w-4" />
              Customer Experience
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-muted via-primary to-primary-glow bg-clip-text text-transparent">
              Customer Experience
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Complete CRM with loyalty programs, personalization, and automated customer engagement
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary-muted to-primary hover:shadow-soft"
                onClick={() => navigate('/crm')}
              >
                <Users className="h-5 w-5 mr-2" />
                Explore CRM
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
                  <div className="p-2 rounded-lg bg-primary-muted/10">
                    <feature.icon className="h-6 w-6 text-primary-muted" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-primary-muted/5 via-primary/5 to-primary-glow/5 rounded-2xl p-8 border border-primary/10">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Customer Relationships?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Build lasting customer relationships with our comprehensive CRM and loyalty platform
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary-muted to-primary hover:shadow-soft"
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

export default CRMFeature;