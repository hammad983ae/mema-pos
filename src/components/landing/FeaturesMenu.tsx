import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Smartphone, 
  Package, 
  TrendingUp, 
  Calculator, 
  CreditCard,
  ArrowRight,
  Store,
  UserCheck,
  BarChart2
} from "lucide-react";

export const FeaturesMenu = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: ShoppingCart,
      title: "All In One POS",
      description: "Combine multiple features into one in order to streamline your business and make each transaction more profitable",
      color: "text-primary",
      gradient: "bg-gradient-primary",
      path: "/pos"
    },
    {
      icon: UserCheck,
      title: "CRM",
      description: "Make sure customers understand how important they are by providing stellar customer experiences",
      color: "text-blue-600",
      gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
      path: "/crm"
    },
    {
      icon: Calculator,
      title: "Accounting",
      description: "Manage your accounting with tools that are seamlessly integrated into every aspect of your business",
      color: "text-purple-600",
      gradient: "bg-gradient-to-br from-purple-500 to-purple-600",
      path: "/analytics"
    },
    {
      icon: Smartphone,
      title: "Mobile POS",
      description: "Integrate almost any smart device into your POS system and make sales with unprecedented flexibility",
      color: "text-green-600",
      gradient: "bg-gradient-to-br from-green-500 to-green-600",
      path: "/pos"
    },
    {
      icon: Users,
      title: "Employees",
      description: "Manage and empower employees with sophisticated management and communication tools",
      color: "text-orange-600",
      gradient: "bg-gradient-to-br from-orange-500 to-orange-600",
      path: "/team"
    },
    {
      icon: TrendingUp,
      title: "Sales",
      description: "Give employees the power to make sales flexibly and on the best terms possible for the customer",
      color: "text-indigo-600",
      gradient: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      path: "/sales-training"
    },
    {
      icon: Package,
      title: "Inventory",
      description: "Integrate and advanced inventory management system that will keep you organized and informed",
      color: "text-cyan-600",
      gradient: "bg-gradient-to-br from-cyan-500 to-cyan-600",
      path: "/inventory"
    },
    {
      icon: CreditCard,
      title: "Merchant Services",
      description: "Get affordable rates, lightning-fast transaction speeds, and top-notch security for you and your customers",
      color: "text-emerald-600",
      gradient: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      path: "/pos"
    }
  ];

  return (
    <section id="features-menu" className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-br from-foreground via-primary to-primary-glow bg-clip-text text-transparent">
            MEMA POS built for ALL beauty business types
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Everything you need to manage, grow, and scale your beauty business 
            <span className="text-primary font-semibold"> in the palm of your hand.</span>
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-2xl transition-all duration-500 hover:scale-[1.05] hover:-translate-y-2 bg-background/60 backdrop-blur-sm border border-border/50 overflow-hidden relative cursor-pointer"
              onClick={() => navigate(feature.path)}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-primary"></div>
              
              <CardHeader className="relative z-10 pb-4">
                <div className={`w-12 h-12 rounded-lg ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-xl`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="relative z-10 pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 group-hover:text-foreground/80 transition-colors">
                  {feature.description}
                </p>
                
                {/* Arrow indicator */}
                <div className="flex items-center text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                  <span className="text-sm font-medium mr-2">Explore</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <p className="text-lg text-muted-foreground mb-6">
            Ready to transform your beauty business?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/auth')} 
              size="lg" 
              className="px-8 py-3 text-lg font-semibold"
            >
              <Store className="h-5 w-5 mr-2" />
              Start Free Trial
            </Button>
            <Button 
              onClick={() => navigate('/pos')} 
              variant="outline" 
              size="lg" 
              className="px-8 py-3 text-lg font-semibold"
            >
              <BarChart2 className="h-5 w-5 mr-2" />
              View Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};