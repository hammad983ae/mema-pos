import { Button } from "@/components/ui/button";
import { NavigationHeader } from "@/components/landing/NavigationHeader";
import { ShoppingCart, Zap, CreditCard, BarChart, Smartphone, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const POSFeature = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Zap,
      title: "Lightning-Fast Checkout",
      description: "Process transactions in seconds with intuitive touch interface and barcode scanning"
    },
    {
      icon: CreditCard,
      title: "Universal Payment Processing",
      description: "Accept all payment methods including cards, mobile wallets, and contactless payments"
    },
    {
      icon: BarChart,
      title: "Real-Time Analytics",
      description: "Track sales, inventory, and performance metrics with live dashboard updates"
    },
    {
      icon: Smartphone,
      title: "Mobile POS",
      description: "Take payments anywhere with mobile POS capabilities and offline sync"
    },
    {
      icon: Users,
      title: "Customer Management",
      description: "Build customer profiles, loyalty programs, and personalized shopping experiences"
    },
    {
      icon: ShoppingCart,
      title: "Inventory Integration",
      description: "Automatic inventory updates with low-stock alerts and reorder notifications"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <NavigationHeader />
      
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Smart Point of Sale
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-primary-muted bg-clip-text text-transparent">
              Smart POS System
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Lightning-fast checkout with AI-powered recommendations and comprehensive payment processing
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-soft"
                onClick={() => navigate('/pos/demo')}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Try POS Demo
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
          <div className="text-center bg-gradient-to-r from-primary/5 via-primary-glow/5 to-primary-muted/5 rounded-2xl p-8 border border-primary/10">
            <h2 className="text-3xl font-bold mb-4">Ready to Upgrade Your POS?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of retailers who have transformed their checkout experience with our smart POS system
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-primary-muted hover:shadow-soft"
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

export default POSFeature;