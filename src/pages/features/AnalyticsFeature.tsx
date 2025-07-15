import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavigationHeader } from "@/components/landing/NavigationHeader";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Target,
  Users,
  DollarSign,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle,
  Zap,
  Brain,
  LineChart
} from "lucide-react";

const AnalyticsFeaturesPage = () => {
  const navigate = useNavigate();

  const analyticsFeatures = [
    {
      icon: BarChart3,
      title: "Real-Time Sales Dashboard",
      description: "Monitor your business performance with live sales data, revenue tracking, and key performance indicators.",
      gradient: "from-blue-500 to-indigo-600",
      capabilities: ["Live sales tracking", "Revenue analytics", "Performance KPIs", "Custom date ranges"]
    },
    {
      icon: TrendingUp,
      title: "Trend Analysis",
      description: "Identify patterns and trends in your sales data to make informed business decisions and forecasts.",
      gradient: "from-green-500 to-emerald-600",
      capabilities: ["Sales trends", "Customer patterns", "Seasonal analysis", "Growth forecasting"]
    },
    {
      icon: PieChart,
      title: "Product Performance",
      description: "Analyze which products are performing best and optimize your inventory and pricing strategies.",
      gradient: "from-purple-500 to-violet-600",
      capabilities: ["Product rankings", "Profit margins", "Category analysis", "Inventory insights"]
    },
    {
      icon: Users,
      title: "Customer Analytics",
      description: "Understand your customers better with detailed demographics, buying patterns, and loyalty metrics.",
      gradient: "from-pink-500 to-rose-600",
      capabilities: ["Customer segments", "Buying behavior", "Loyalty tracking", "Lifetime value"]
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Set and monitor business goals with visual progress tracking and performance alerts.",
      gradient: "from-orange-500 to-amber-600",
      capabilities: ["Sales goals", "Team targets", "Progress tracking", "Performance alerts"]
    },
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Get intelligent recommendations and predictions powered by machine learning algorithms.",
      gradient: "from-cyan-500 to-blue-600",
      capabilities: ["Predictive analytics", "Smart recommendations", "Anomaly detection", "Auto insights"]
    }
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: "Increase Revenue",
      description: "Make data-driven decisions that directly impact your bottom line",
      stats: "Up to 25% revenue increase"
    },
    {
      icon: Clock,
      title: "Save Time",
      description: "Automated reporting and insights save hours of manual analysis",
      stats: "10+ hours saved weekly"
    },
    {
      icon: Target,
      title: "Hit Your Goals",
      description: "Clear visibility into performance helps you achieve targets faster",
      stats: "90% goal achievement rate"
    }
  ];

  const keyFeatures = [
    "Real-time dashboard updates",
    "Customizable report generation",
    "Mobile-responsive design",
    "Data export capabilities",
    "Advanced filtering options",
    "Automated insights",
    "Multi-store support",
    "Historical data analysis"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <NavigationHeader />
      
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative">
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-6">
          <div className="container mx-auto text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-700 border-blue-200">
              <BarChart3 className="w-4 h-4 mr-2" />
              Advanced Analytics
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Data-Driven Business Intelligence
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your business data into actionable insights with our comprehensive analytics platform. 
              Make smarter decisions with real-time dashboards, predictive analytics, and automated reporting.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate("/analytics/demo")}
              >
                Try Live Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 px-8 py-3 rounded-xl font-semibold"
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
                <h2 className="text-3xl font-bold mb-4">See Analytics in Action</h2>
                <p className="text-gray-600">Interactive preview of our analytics dashboard</p>
              </div>
              
              {/* Mock Dashboard */}
              <div className="bg-gray-50 rounded-2xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-600">$24,890</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                    <p className="text-xs text-green-600 mt-2">↗ +12% vs last month</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Orders</p>
                        <p className="text-2xl font-bold text-blue-600">342</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-xs text-blue-600 mt-2">↗ +8% vs last month</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Customers</p>
                        <p className="text-2xl font-bold text-purple-600">189</p>
                      </div>
                      <Users className="h-8 w-8 text-purple-500" />
                    </div>
                    <p className="text-xs text-purple-600 mt-2">↗ +15% vs last month</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Avg. Order</p>
                        <p className="text-2xl font-bold text-orange-600">$72.50</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-orange-500" />
                    </div>
                    <p className="text-xs text-orange-600 mt-2">↗ +5% vs last month</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-4 flex items-center">
                      <LineChart className="h-5 w-5 mr-2 text-blue-500" />
                      Sales Trend (7 days)
                    </h3>
                    <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-end justify-center">
                      <p className="text-sm text-gray-600">Interactive chart would appear here</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-4 flex items-center">
                      <PieChart className="h-5 w-5 mr-2 text-green-500" />
                      Top Products
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Premium Service</span>
                        <span className="font-semibold">$890</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Standard Package</span>
                        <span className="font-semibold">$650</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Basic Service</span>
                        <span className="font-semibold">$420</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg"
                  onClick={() => navigate("/analytics/demo")}
                >
                  Explore Full Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Analytics Features Grid */}
        <section className="py-20 px-6">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Comprehensive Analytics Suite</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Everything you need to understand your business performance and make data-driven decisions
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {analyticsFeatures.map((feature, index) => (
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
              <h2 className="text-4xl font-bold mb-6">Drive Real Business Results</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Our analytics platform delivers measurable improvements to your business performance
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={benefit.title} className="text-center border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
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
                <p className="text-gray-600 text-lg">Powerful features designed for modern businesses</p>
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
        <section className="py-20 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses already using our analytics platform to drive growth and make smarter decisions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate("/auth")}
              >
                <Zap className="mr-2 h-5 w-5" />
                Start Free Trial
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-xl font-semibold"
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

export default AnalyticsFeaturesPage;