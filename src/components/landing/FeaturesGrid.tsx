import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShoppingCart, 
  BarChart3, 
  Users, 
  Package, 
  MessageSquare, 
  Calendar
} from "lucide-react";

export const FeaturesGrid = () => {
  const features = [
    {
      icon: ShoppingCart,
      title: "Touch-First POS",
      description: "Lightning-fast checkout with barcode scanning, customer lookup, and integrated payment processing optimized for cosmetics retail",
      color: "text-primary",
      gradient: "bg-gradient-primary"
    },
    {
      icon: Package,
      title: "Smart Inventory",
      description: "AI-powered stock management with predictive reordering, multi-location transfers, and real-time alerts to prevent stockouts",
      color: "text-success",
      gradient: "bg-gradient-to-br from-success to-success-glow"
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Comprehensive reporting on sales performance, customer trends, and profitability across all locations with actionable insights",
      color: "text-warning",
      gradient: "bg-gradient-to-br from-warning to-warning-glow"
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Integrated scheduling, task management, performance tracking, and team communication tools designed for cosmetics professionals",
      color: "text-primary-muted",
      gradient: "bg-gradient-secondary"
    },
    {
      icon: MessageSquare,
      title: "Customer Experience",
      description: "Complete CRM with customer profiles, purchase history, personalized recommendations, and automated loyalty program management",
      color: "text-accent-foreground",
      gradient: "bg-gradient-accent"
    },
    {
      icon: Calendar,
      title: "Appointment System",
      description: "Smart booking system with automated reminders, staff optimization, treatment scheduling, and customer self-service portal",
      color: "text-success",
      gradient: "bg-gradient-to-br from-success to-success-glow"
    }
  ];

  return (
    <section id="features" className="py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-br from-foreground via-primary to-primary-glow bg-clip-text text-transparent">
            Everything You Need to Scale
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
            Built specifically for cosmetics retail with enterprise-grade features that grow with your business
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-strong transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2 bg-gradient-card border-0 overflow-hidden relative">
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-primary"></div>
              
              <CardHeader className="relative z-10 pb-4">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl ${feature.gradient} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-all duration-300 shadow-soft group-hover:shadow-glow`}>
                  <feature.icon className={`h-6 w-6 sm:h-7 sm:w-7 ${feature.color === 'text-accent-foreground' ? 'text-white' : feature.color}`} />
                </div>
                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-semibold leading-tight group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 pt-0">
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional feature highlights */}
        <div className="mt-16 sm:mt-20 lg:mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto">
          <div className="text-center glass-effect p-6 sm:p-8 rounded-2xl hover:scale-105 transition-all duration-300">
            <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">99.9%</div>
            <div className="text-sm sm:text-base text-muted-foreground">Uptime SLA</div>
          </div>
          <div className="text-center glass-effect p-6 sm:p-8 rounded-2xl hover:scale-105 transition-all duration-300">
            <div className="text-3xl sm:text-4xl font-bold text-success mb-2">24/7</div>
            <div className="text-sm sm:text-base text-muted-foreground">Expert Support</div>
          </div>
          <div className="text-center glass-effect p-6 sm:p-8 rounded-2xl hover:scale-105 transition-all duration-300">
            <div className="text-3xl sm:text-4xl font-bold text-warning mb-2">API</div>
            <div className="text-sm sm:text-base text-muted-foreground">Integration Ready</div>
          </div>
          <div className="text-center glass-effect p-6 sm:p-8 rounded-2xl hover:scale-105 transition-all duration-300">
            <div className="text-3xl sm:text-4xl font-bold text-primary-glow mb-2">SOC2</div>
            <div className="text-sm sm:text-base text-muted-foreground">Security Certified</div>
          </div>
        </div>
      </div>
    </section>
  );
};