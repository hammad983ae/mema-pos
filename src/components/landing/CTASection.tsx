import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  CreditCard, 
  Sparkles, 
  ArrowRight, 
  Clock,
  Shield,
  Users,
  CheckCircle2
} from "lucide-react";

export const CTASection = () => {
  const navigate = useNavigate();

  const benefits = [
    { icon: Clock, text: "Setup in under 15 minutes" },
    { icon: Shield, text: "No long-term contracts" },
    { icon: Users, text: "Dedicated onboarding team" },
    { icon: CheckCircle2, text: "14-day money-back guarantee" }
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-primary rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-6 sm:mb-8 bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm sm:text-base glass-effect">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Start Your Transformation Today
          </Badge>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 bg-gradient-to-br from-foreground via-primary to-primary-glow bg-clip-text text-transparent leading-tight">
            Ready to Transform Your Skincare Business?
          </h2>
          
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto px-4">
            Join hundreds of premium skincare businesses already using MemaPOS to streamline operations, 
            boost revenue, and create exceptional customer experiences.
          </p>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3 glass-effect p-4 sm:p-5 rounded-xl hover:scale-105 transition-all duration-300">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-center sm:text-left">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-8 sm:mb-12">
            <Button 
              size="xl" 
              variant="premium"
              className="h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-lg font-semibold w-full sm:w-auto"
              onClick={() => navigate('/auth')}
            >
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
              Start Free Trial
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 ml-2" />
            </Button>
            
            <Button 
              variant="glass" 
              size="xl"
              className="h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-lg w-full sm:w-auto"
              onClick={() => navigate('/pos')}
            >
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
              Try Live Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              No credit card required • 14-day free trial • Setup in minutes
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
                <span>Enterprise Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
                <span>SOC 2 Certified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <span>500+ Happy Customers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-warning" />
                <span>99.9% Uptime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};