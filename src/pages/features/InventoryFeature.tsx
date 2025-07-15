import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavigationHeader } from "@/components/landing/NavigationHeader";
import {
  Package,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Zap,
  Users,
  Clock,
  Target,
  ArrowRight,
  CheckCircle,
  Truck,
  Brain,
  Shield,
  DollarSign
} from "lucide-react";

const InventoryFeaturesPage = () => {
  const navigate = useNavigate();

  const inventoryFeatures = [
    {
      icon: Package,
      title: "Smart Inventory Tracking",
      description: "Real-time inventory management with automatic stock level monitoring and low-stock alerts.",
      gradient: "from-blue-500 to-indigo-600",
      capabilities: ["Real-time stock tracking", "Multi-location support", "Barcode scanning", "Product categorization"]
    },
    {
      icon: AlertTriangle,
      title: "Intelligent Alerts",
      description: "Get notified before you run out of stock with predictive alerts based on sales patterns.",
      gradient: "from-red-500 to-orange-600",
      capabilities: ["Low stock alerts", "Reorder suggestions", "Expiry notifications", "Custom thresholds"]
    },
    {
      icon: TrendingUp,
      title: "Sales Analytics",
      description: "Understand which products are moving fast and which are sitting on shelves too long.",
      gradient: "from-green-500 to-emerald-600",
      capabilities: ["Product performance", "Velocity analysis", "Turnover rates", "Profit margins"]
    },
    {
      icon: Truck,
      title: "Supplier Management",
      description: "Manage your supplier relationships and automate purchase orders based on inventory levels.",
      gradient: "from-purple-500 to-violet-600",
      capabilities: ["Supplier database", "Purchase orders", "Lead time tracking", "Cost analysis"]
    },
    {
      icon: Brain,
      title: "AI Optimization",
      description: "Machine learning algorithms optimize your inventory levels and predict future demand.",
      gradient: "from-cyan-500 to-blue-600",
      capabilities: ["Demand forecasting", "Optimal stock levels", "Seasonal adjustments", "Trend analysis"]
    },
    {
      icon: BarChart3,
      title: "Comprehensive Reports",
      description: "Detailed inventory reports and analytics to help you make informed business decisions.",
      gradient: "from-pink-500 to-rose-600",
      capabilities: ["Stock reports", "Movement history", "Value analysis", "Custom dashboards"]
    }
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: "Reduce Costs",
      description: "Optimize inventory levels to reduce carrying costs and minimize waste",
      stats: "Up to 30% cost reduction"
    },
    {
      icon: Clock,
      title: "Save Time",
      description: "Automate inventory management tasks and reduce manual counting",
      stats: "15+ hours saved weekly"
    },
    {
      icon: Target,
      title: "Improve Accuracy",
      description: "Real-time tracking eliminates stockouts and overstock situations",
      stats: "99.5% inventory accuracy"
    }
  ];

  const keyFeatures = [
    "Multi-location inventory tracking",
    "Automated reorder points",
    "Barcode and QR code scanning",
    "Real-time stock updates",
    "Purchase order automation",
    "Supplier performance tracking",
    "Inventory valuation methods",
    "Mobile inventory management"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
      <NavigationHeader />
      
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative">
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-6">
          <div className="container mx-auto text-center">
            <Badge className="mb-6 bg-green-100 text-green-700 border-green-200">
              <Package className="w-4 h-4 mr-2" />
              Smart Inventory Management
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Intelligent Inventory Control
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your inventory management with AI-powered insights, real-time tracking, and automated 
              reordering. Never run out of stock or overstock again.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate("/inventory")}
              >
                Try Live Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-green-200 text-green-700 hover:bg-green-50 px-8 py-3 rounded-xl font-semibold"
                onClick={() => navigate("/contact")}
              >
                Schedule Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Interactive Demo Preview */}
        <section className="py-16 px-6">
          <div className="container mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">See Inventory Management in Action</h2>
                <p className="text-gray-600">Interactive preview of our inventory system</p>
              </div>
              
              {/* Mock Inventory Dashboard */}
              <div className="bg-gray-50 rounded-2xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Products</p>
                        <p className="text-2xl font-bold text-blue-600">1,247</p>
                      </div>
                      <Package className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-xs text-blue-600 mt-2">↗ +23 new this month</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Low Stock Items</p>
                        <p className="text-2xl font-bold text-orange-600">8</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-orange-500" />
                    </div>
                    <p className="text-xs text-orange-600 mt-2">Requires attention</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Inventory Value</p>
                        <p className="text-2xl font-bold text-green-600">$89,450</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                    <p className="text-xs text-green-600 mt-2">↗ +5% vs last month</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Avg. Turnover</p>
                        <p className="text-2xl font-bold text-purple-600">12.4x</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-500" />
                    </div>
                    <p className="text-xs text-purple-600 mt-2">↗ Improved efficiency</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-4 flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                      Low Stock Alerts
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Premium Coffee Beans</p>
                          <p className="text-xs text-gray-600">Current: 12 units</p>
                        </div>
                        <Badge className="bg-orange-100 text-orange-700">Low Stock</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Wireless Headphones</p>
                          <p className="text-xs text-gray-600">Current: 3 units</p>
                        </div>
                        <Badge className="bg-red-100 text-red-700">Critical</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Organic Tea Set</p>
                          <p className="text-xs text-gray-600">Current: 8 units</p>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-700">Warning</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-4 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                      Top Moving Products
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Smartphone Cases</span>
                        <div className="text-right">
                          <span className="font-semibold text-sm">156 sold</span>
                          <p className="text-xs text-green-600">↗ +24%</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Bluetooth Speakers</span>
                        <div className="text-right">
                          <span className="font-semibold text-sm">89 sold</span>
                          <p className="text-xs text-green-600">↗ +18%</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Power Banks</span>
                        <div className="text-right">
                          <span className="font-semibold text-sm">67 sold</span>
                          <p className="text-xs text-green-600">↗ +12%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <Button 
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-lg"
                  onClick={() => navigate("/inventory")}
                >
                  Explore Full System <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Inventory Features Grid */}
        <section className="py-20 px-6">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Complete Inventory Solution</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Everything you need to manage your inventory efficiently and profitably
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {inventoryFeatures.map((feature, index) => (
                <Card key={feature.title} className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{feature.description}</p>
                    <div className="space-y-2">
                      {feature.capabilities.map((capability, i) => (
                        <div key={i} className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-gray-600">{capability}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-6 bg-white/50">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Transform Your Operations</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Our inventory management system delivers measurable improvements to your business
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={benefit.title} className="text-center border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <benefit.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                    <p className="text-gray-600 mb-4">{benefit.description}</p>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      {benefit.stats}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Key Features List */}
        <section className="py-20 px-6">
          <div className="container mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border border-white/20">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
                <p className="text-gray-600 text-lg">Powerful features designed for modern inventory management</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {keyFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-gradient-to-r from-green-600 via-emerald-600 to-blue-700">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Optimize Your Inventory?
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses already using our platform to streamline their inventory management and boost profitability.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg"
                className="bg-white text-green-600 hover:bg-gray-100 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate("/auth")}
              >
                <Zap className="mr-2 h-5 w-5" />
                Start Free Trial
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-green-600 px-8 py-3 rounded-xl font-semibold"
                onClick={() => navigate("/contact")}
              >
                Talk to Sales
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default InventoryFeaturesPage;