import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { VoiceTrainingDemo } from "@/components/landing/VoiceTrainingDemo";
import { 
  ShoppingCart, 
  BarChart3, 
  Package, 
  Store,
  Check,
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  GraduationCap,
  Brain,
  Target,
  Volume2,
  Mic
} from "lucide-react";

// Import MEMA interface images
import posMockup from "@/assets/mema-pos-interface.jpg";
import dashboardMockup from "@/assets/mema-analytics-dashboard.jpg";
import inventoryMockup from "@/assets/mema-inventory-system.jpg";
import teamMockup from "@/assets/mema-team-management.jpg";

export const FeatureShowcases = () => {
  const navigate = useNavigate();

  return (
    <div className="py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* POS System Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center mb-20 sm:mb-24 lg:mb-32">
          <div className="order-2 lg:order-1">
            <Badge className="mb-4 sm:mb-6 bg-primary/10 text-primary border-primary/20 glass-effect px-4 py-2">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Point of Sale System
            </Badge>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 leading-tight">Touch-First POS Built for Skincare</h3>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
              Streamline your checkout process with our intuitive, touch-optimized interface designed specifically for skincare retail.
            </p>
            
            <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
              <div className="flex items-start space-x-3 sm:space-x-4 glass-effect p-4 rounded-lg">
                <Check className="h-5 w-5 sm:h-6 sm:w-6 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Lightning-Fast Checkout</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Process transactions in under 10 seconds with barcode scanning and quick-add features</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 sm:space-x-4 glass-effect p-4 rounded-lg">
                <Check className="h-5 w-5 sm:h-6 sm:w-6 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Customer Database Integration</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Instantly access customer profiles, purchase history, and loyalty points</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 sm:space-x-4 glass-effect p-4 rounded-lg">
                <Check className="h-5 w-5 sm:h-6 sm:w-6 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Multi-Payment Support</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Accept cash, cards, digital wallets, and gift cards in one system</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/pos')} 
              variant="premium" 
              size="lg" 
              className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold"
            >
              <Store className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Try POS Demo
            </Button>
          </div>
          
          <div className="relative order-1 lg:order-2 image-container">
            <div className="absolute inset-0 bg-gradient-primary opacity-10 rounded-2xl blur-2xl"></div>
            <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden shadow-strong border border-border/20">
              <img 
                src={posMockup} 
                alt="MEMA POS System Interface" 
                className="w-full h-full object-contain bg-background transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* AI Sales Training Showcase - NEW FEATURE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center mb-20 sm:mb-24 lg:mb-32">
          <div className="order-2 lg:order-1">
            <Badge className="mb-4 sm:mb-6 bg-primary/10 text-primary border-primary/20 glass-effect px-4 py-2">
              <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              🚀 New: AI Sales Training
            </Badge>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 leading-tight bg-gradient-primary bg-clip-text text-transparent">Revolutionary AI-Powered Sales Training</h3>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
              Transform your team into sales experts with our intelligent AI trainer. Personalized coaching, real-time feedback, and proven sales methodologies all in one platform.
            </p>
            
            <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
              <div className="flex items-start space-x-3 sm:space-x-4 glass-effect p-4 rounded-lg border border-primary/20">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Personalized AI Coach</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Interactive AI trainer adapts to each employee's learning style and progress</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 sm:space-x-4 glass-effect p-4 rounded-lg border border-primary-light/30">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Proven Sales Methodologies</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Learn from industry-leading techniques: objection handling, closing strategies, and more</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 sm:space-x-4 glass-effect p-4 rounded-lg border border-success/20">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Real-Time Progress Tracking</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Comprehensive analytics for managers to track team performance and growth</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button 
                onClick={() => navigate('/sales-training')} 
                variant="premium" 
                size="lg" 
                className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold bg-success hover:bg-success/90 text-success-foreground hover:shadow-glow"
              >
                <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Try Voice Training
              </Button>
              <Button 
                onClick={() => navigate('/manager')} 
                variant="outline" 
                size="lg" 
                className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base border-success/30 text-success hover:bg-success/5"
              >
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Manager Analytics
              </Button>
            </div>
            
            {/* Voice Training Demo Preview */}
            <div className="mt-8 pt-6 border-t border-success/20">
              <div className="mb-4">
                <Badge className="mb-2 bg-success/10 text-success border-success/20 glass-effect px-3 py-1">
                  <Mic className="h-3 w-3 mr-1" />
                  Live Demo Preview
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Experience a sample of our voice training conversation
                </p>
              </div>
              <div className="scale-90 origin-left">
                <VoiceTrainingDemo />
              </div>
            </div>
          </div>
          
          <div className="relative order-1 lg:order-2 image-container">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-2xl blur-2xl"></div>
            <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden shadow-strong ring-1 ring-primary/20 border border-border/20">
              <img 
                src={teamMockup} 
                alt="MEMA Team Management Interface" 
                className="w-full h-full object-contain bg-background transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div className="absolute top-4 right-4 bg-gradient-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold shadow-glow">
              ✨ AI Powered
            </div>
          </div>
        </div>

        {/* Analytics Dashboard Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center mb-20 sm:mb-24 lg:mb-32">
          <div className="order-2 lg:order-2">
            <Badge className="mb-4 sm:mb-6 bg-warning/10 text-warning border-warning/20 glass-effect px-4 py-2">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Advanced Analytics
            </Badge>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 leading-tight">Real-Time Business Intelligence</h3>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
              Make data-driven decisions with comprehensive analytics covering sales, inventory, and customer insights across all locations.
            </p>
            
            <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
              <div className="flex items-start space-x-3 sm:space-x-4 glass-effect p-4 rounded-lg">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-warning mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Live Sales Tracking</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Monitor performance across all stores with real-time updates and alerts</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 sm:space-x-4 glass-effect p-4 rounded-lg">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-warning mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Revenue Optimization</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Identify top products, peak hours, and growth opportunities instantly</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 sm:space-x-4 glass-effect p-4 rounded-lg">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-warning mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Customer Insights</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Track loyalty trends, purchase patterns, and lifetime value</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/analytics')} 
              variant="glass" 
              size="lg" 
              className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base"
            >
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              View Analytics Demo
            </Button>
          </div>
          
          <div className="relative order-1 lg:order-1 image-container">
            <div className="absolute inset-0 bg-gradient-accent opacity-20 rounded-2xl blur-2xl"></div>
            <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden shadow-strong border border-border/20">
              <img 
                src={dashboardMockup} 
                alt="MEMA Analytics Dashboard" 
                className="w-full h-full object-contain bg-background transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* Inventory Management Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center">
          <div className="order-2 lg:order-1">
            <Badge className="mb-4 sm:mb-6 bg-success/10 text-success border-success/20 glass-effect px-4 py-2">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Smart Inventory
            </Badge>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 leading-tight">Automated Stock Management</h3>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
              Never run out of bestsellers again with intelligent inventory tracking, automated reorder alerts, and supplier management.
            </p>
            
            <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
              <div className="flex items-start space-x-3 sm:space-x-4 glass-effect p-4 rounded-lg">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Smart Reorder Alerts</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Automated notifications when stock levels reach custom thresholds</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 sm:space-x-4 glass-effect p-4 rounded-lg">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Multi-Location Tracking</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">View and transfer inventory across all store locations in real-time</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 sm:space-x-4 glass-effect p-4 rounded-lg">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Supplier Integration</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Streamlined purchase orders and delivery tracking with supplier portal</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/inventory')} 
              variant="glass" 
              size="lg" 
              className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base"
            >
              <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Explore Inventory
            </Button>
          </div>
          
          <div className="relative order-1 lg:order-2 image-container">
            <div className="absolute inset-0 bg-gradient-secondary opacity-15 rounded-2xl blur-2xl"></div>
            <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden shadow-strong border border-border/20">
              <img 
                src={inventoryMockup} 
                alt="MEMA Inventory Management System" 
                className="w-full h-full object-contain bg-background transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};