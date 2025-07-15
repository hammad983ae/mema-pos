import { Button } from "@/components/ui/button";
import { NavigationHeader } from "@/components/landing/NavigationHeader";
import { Shield, Lock, Eye, UserCheck, FileText, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SecurityFeature = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: UserCheck,
      title: "Role-Based Access",
      description: "Granular permissions system with customizable roles for employees, managers, and admins"
    },
    {
      icon: Eye,
      title: "Activity Monitoring",
      description: "Real-time tracking of all user actions with comprehensive audit trails"
    },
    {
      icon: Lock,
      title: "Data Encryption",
      description: "End-to-end encryption for all sensitive data and secure payment processing"
    },
    {
      icon: FileText,
      title: "Compliance Management",
      description: "Built-in compliance tools for PCI DSS, GDPR, and industry regulations"
    },
    {
      icon: AlertTriangle,
      title: "Security Alerts",
      description: "Automated alerts for suspicious activities and security policy violations"
    },
    {
      icon: Shield,
      title: "Multi-Factor Authentication",
      description: "Advanced authentication options including 2FA, biometrics, and SSO integration"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <NavigationHeader />
      
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-muted/10 text-muted-foreground px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              Security & Access Control
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-muted via-primary-muted to-primary bg-clip-text text-transparent">
              Security & Access
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Enterprise-grade security with role-based permissions and comprehensive activity monitoring
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-muted to-primary-muted hover:shadow-soft"
                onClick={() => navigate('/settings')}
              >
                <Shield className="h-5 w-5 mr-2" />
                View Security Settings
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
                  <div className="p-2 rounded-lg bg-muted/10">
                    <feature.icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-muted/5 via-primary-muted/5 to-primary/5 rounded-2xl p-8 border border-primary/10">
            <h2 className="text-3xl font-bold mb-4">Secure Your Business Operations</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Protect your business with enterprise-grade security features and compliance tools
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-muted to-primary hover:shadow-soft"
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

export default SecurityFeature;