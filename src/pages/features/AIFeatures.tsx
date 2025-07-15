import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NavigationHeader } from "@/components/landing/NavigationHeader";
import { 
  Brain,
  Sparkles,
  TrendingUp,
  FileText,
  MessageSquare,
  BarChart3,
  Package,
  Users,
  Zap,
  ArrowRight,
  CheckCircle,
  Clock,
  Target
} from "lucide-react";

const AIFeaturesPage = () => {
  const navigate = useNavigate();

  const aiFeatures = [
    {
      icon: Brain,
      title: "Business Intelligence AI",
      description: "Get actionable insights about your business performance, customer trends, and growth opportunities with natural language queries.",
      gradient: "from-blue-500 to-cyan-600",
      capabilities: ["Sales trend analysis", "Customer behavior insights", "Inventory optimization", "Predictive analytics"]
    },
    {
      icon: Package,
      title: "Smart Inventory Management",
      description: "AI predicts demand, suggests reorder quantities, and identifies slow-moving products to optimize your inventory investment.",
      gradient: "from-green-500 to-emerald-600",
      capabilities: ["Demand forecasting", "Automated reordering", "Supplier optimization", "Waste reduction"]
    },
    {
      icon: Users,
      title: "Team Performance AI",
      description: "Analyze team compatibility, suggest optimal pairings, and track performance metrics to maximize your team's potential.",
      gradient: "from-purple-500 to-violet-600",
      capabilities: ["Performance tracking", "Team compatibility", "Goal optimization", "Commission calculation"]
    },
    {
      icon: MessageSquare,
      title: "Customer Service AI",
      description: "Intelligent chatbot handles customer inquiries, appointment booking, and provides personalized product recommendations.",
      gradient: "from-pink-500 to-rose-600",
      capabilities: ["24/7 customer support", "Appointment booking", "Product recommendations", "FAQ automation"]
    },
    {
      icon: FileText,
      title: "Document Intelligence",
      description: "Automatically categorize, tag, and extract data from invoices, receipts, and business documents with AI-powered processing.",
      gradient: "from-orange-500 to-amber-600",
      capabilities: ["Auto categorization", "Data extraction", "Smart search", "Invoice processing"]
    },
    {
      icon: BarChart3,
      title: "Predictive Analytics",
      description: "Forecast sales, predict busy periods, and identify opportunities with machine learning algorithms trained on your data.",
      gradient: "from-indigo-500 to-blue-600",
      capabilities: ["Sales forecasting", "Trend prediction", "Seasonal analysis", "Growth modeling"]
    }
  ];

  const integrations = [
    { name: "OpenAI GPT-4", description: "Advanced language processing" },
    { name: "Machine Learning", description: "Pattern recognition & prediction" },
    { name: "Computer Vision", description: "Document & image analysis" },
    { name: "Natural Language", description: "Conversational interfaces" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-100">
      <NavigationHeader />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <Badge className="mb-6 bg-blue-100 text-blue-700 border-blue-200 px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2" />
              Powered by Advanced AI
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-br from-gray-900 via-blue-800 to-cyan-800 bg-clip-text text-transparent">
              AI That Works
              <br />
              <span className="text-4xl md:text-5xl">For Your Business</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Harness the power of artificial intelligence to automate tasks, gain insights, 
              and make smarter decisions for your cosmetics business.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                onClick={() => navigate('/auth')}
              >
                <Brain className="h-5 w-5 mr-2" />
                Try AI Features
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/analytics')}>
                See Live Demo
              </Button>
            </div>
          </div>

          {/* AI Conversation Demo */}
          <div className="max-w-4xl mx-auto mb-20">
            <Card className="overflow-hidden shadow-2xl border-0">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8">
                  <div className="bg-white rounded-lg p-6 shadow-xl">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                        <Brain className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold">Mema AI Assistant</h3>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        Online
                      </Badge>
                    </div>
                    
                    {/* Chat Messages */}
                    <div className="space-y-4">
                      <div className="flex space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                          <p className="text-sm">"What were my top-selling products last month and how should I adjust my inventory?"</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                          <Brain className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 max-w-md">
                          <p className="text-sm mb-2">Based on your sales data, here are your top performers:</p>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span>Luxury Moisturizer Set</span>
                              <span className="font-medium">142 units (+23%)</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Vitamin C Serum</span>
                              <span className="font-medium">98 units (+15%)</span>
                            </div>
                          </div>
                          <p className="text-sm mt-2 text-blue-700">💡 Recommend increasing stock by 30% for holiday season</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Features Grid */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Complete AI Business Suite</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">Six powerful AI modules working together to transform your business operations</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {aiFeatures.map((feature, index) => (
                <Card key={feature.title} className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{feature.description}</p>
                    <div className="space-y-2">
                      {feature.capabilities.map((capability, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-gray-600">{capability}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Use Cases Section */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">AI in Action: Real Business Scenarios</h2>
              <p className="text-gray-600 text-lg">See how Mema AI solves everyday challenges in beauty businesses</p>
            </div>
            
            <div className="space-y-8">
              <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50 p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Inventory Intelligence</h3>
                    <p className="text-gray-700 mb-3">"Which products should I reorder for the holiday season?"</p>
                    <div className="bg-white/60 rounded-lg p-3 text-sm">
                      <strong>AI Response:</strong> Based on last year's data, increase Luxury Gift Sets by 45%, 
                      Moisturizer bundles by 30%. Reduce Summer collections by 20%. Expected ROI: +$15,000.
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-violet-50 p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Team Optimization</h3>
                    <p className="text-gray-700 mb-3">"My Saturday schedule isn't generating enough sales."</p>
                    <div className="bg-white/60 rounded-lg p-3 text-sm">
                      <strong>AI Analysis:</strong> Current team compatibility: 67%. Suggested pairing: Sarah (opener) + 
                      Mike (closer) increases compatibility to 94% and projected sales by 28%.
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Customer Service Automation</h3>
                    <p className="text-gray-700 mb-3">24/7 customer support handling booking and product questions</p>
                    <div className="bg-white/60 rounded-lg p-3 text-sm">
                      <strong>Customer:</strong> "Do you have appointments tomorrow for facials?"<br/>
                      <strong>AI:</strong> "Yes! We have 2 PM and 4 PM available. Would you prefer our Hydrating Facial ($120) or Anti-Aging Treatment ($180)?"
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* AI Technology Stack */}
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Enterprise-Grade AI Technology</h2>
              <p className="text-gray-600 text-lg">Built on the same AI foundations trusted by Fortune 500 companies</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {integrations.map((integration, index) => (
                <Card key={integration.name} className="border-0 shadow-lg bg-white/60 backdrop-blur-sm p-6 hover:shadow-xl transition-shadow">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm mb-2">{integration.name}</h3>
                    <p className="text-xs text-gray-600">{integration.description}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Security & Compliance */}
            <Card className="border-0 shadow-xl bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-4">Enterprise Security & Privacy</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-semibold mb-2">SOC 2 Compliant</h4>
                    <p className="text-sm text-gray-300">Enterprise-grade security standards</p>
                  </div>
                  <div>
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-semibold mb-2">GDPR Ready</h4>
                    <p className="text-sm text-gray-300">Full compliance with privacy regulations</p>
                  </div>
                  <div>
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-semibold mb-2">99.9% Uptime</h4>
                    <p className="text-sm text-gray-300">Reliable AI-powered operations</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Final CTA */}
            <div className="text-center mt-12">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Experience the Future of Business Management</h3>
                <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                  Join the AI revolution and transform your beauty business with intelligent automation, 
                  predictive insights, and personalized customer experiences.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="bg-white text-blue-600 border-white hover:bg-blue-50"
                    onClick={() => navigate('/analytics')}
                  >
                    <BarChart3 className="h-5 w-5 mr-2" />
                    See AI in Action
                  </Button>
                  <Button 
                    size="lg"
                    className="bg-blue-800 hover:bg-blue-900"
                    onClick={() => navigate('/auth')}
                  >
                    Start AI-Powered Trial
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFeaturesPage;