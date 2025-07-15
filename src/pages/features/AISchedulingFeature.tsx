import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NavigationHeader } from "@/components/landing/NavigationHeader";
import { 
  Calendar,
  Brain,
  Users,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Zap,
  Target,
  BarChart3
} from "lucide-react";

const AISchedulingFeaturePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Suggestions",
      description: "Our AI analyzes team performance, customer patterns, and sales data to suggest optimal staff scheduling combinations."
    },
    {
      icon: Users,
      title: "Smart Team Pairing",
      description: "Automatically suggests the best opener and upseller combinations based on compatibility scores and sales performance."
    },
    {
      icon: TrendingUp,
      title: "Performance Optimization",
      description: "Learns from your 2-week scheduling patterns to continuously improve recommendations and boost sales."
    },
    {
      icon: Clock,
      title: "Real-Time Adjustments",
      description: "Instantly adapt schedules for sick calls, busy periods, or last-minute changes with AI-powered alternatives."
    }
  ];

  const benefits = [
    "Increase sales by 25% with optimal team pairings",
    "Reduce scheduling conflicts by 80%", 
    "Save 12+ hours per week on schedule management",
    "Improve team satisfaction with fair, balanced schedules",
    "Automatic compliance with labor laws and break requirements",
    "Multi-store optimization for chain operations",
    "Real-time performance tracking and insights",
    "Automatic coverage for sick calls and emergencies"
  ];

  const keyFeatures = [
    {
      icon: Calendar,
      title: "Drag & Drop Interface",
      description: "Intuitive scheduling with visual drag-and-drop functionality. Move staff, adjust times, and see conflicts instantly.",
      stats: "95% faster than traditional scheduling"
    },
    {
      icon: Brain,
      title: "AI-Powered Recommendations", 
      description: "Smart suggestions based on team compatibility, sales history, and customer preferences.",
      stats: "25% average sales increase"
    },
    {
      icon: Users,
      title: "Team Compatibility Analysis",
      description: "AI analyzes working relationships and suggests optimal team pairings for maximum productivity.",
      stats: "40% reduction in team conflicts"
    },
    {
      icon: TrendingUp,
      title: "Performance Optimization",
      description: "Continuous learning from your scheduling patterns to improve recommendations over time.",
      stats: "Improves 5% weekly"
    },
    {
      icon: Clock,
      title: "Automated Compliance",
      description: "Ensures adherence to labor laws, break requirements, and overtime regulations automatically.",
      stats: "100% compliance guaranteed"
    },
    {
      icon: Zap,
      title: "Real-Time Adjustments",
      description: "Instantly adapt to sick calls, busy periods, or last-minute changes with smart alternatives.",
      stats: "Response time under 30 seconds"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
      <NavigationHeader />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <Badge className="mb-6 bg-purple-100 text-purple-700 border-purple-200 px-4 py-2">
              <Brain className="h-4 w-4 mr-2" />
              AI-Enhanced Scheduling
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-br from-gray-900 via-purple-800 to-blue-800 bg-clip-text text-transparent">
              Drag & Drop Scheduling
              <br />
              <span className="text-4xl md:text-5xl">Powered by AI</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Create perfect schedules in minutes with our intuitive drag & drop interface, 
              enhanced by AI that learns your business patterns and suggests optimal team combinations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                onClick={() => navigate('/team')}
              >
                <Calendar className="h-5 w-5 mr-2" />
                Try Live Demo
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/auth')}>
                Start Free Trial
              </Button>
            </div>
          </div>

          {/* Interactive Demo Preview */}
          <div className="max-w-6xl mx-auto mb-20">
            <Card className="overflow-hidden shadow-2xl border-0">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8">
                  <div className="bg-white rounded-lg p-6 shadow-xl">
                    {/* Mock Schedule Interface */}
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold">Weekly Schedule - Elite Beauty Spa</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          <Brain className="h-3 w-3 mr-1" />
                          AI Optimized
                        </Badge>
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +25% Sales Potential
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Staff Performance Metrics */}
                    <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">$1,847</div>
                        <div className="text-sm text-gray-600">Avg Daily Sales</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">94%</div>
                        <div className="text-sm text-gray-600">Team Compatibility</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">12h</div>
                        <div className="text-sm text-gray-600">Time Saved/Week</div>
                      </div>
                    </div>
                    
                    {/* Mock Schedule Grid */}
                    <div className="grid grid-cols-8 gap-2 mb-4">
                      <div className="font-medium text-sm text-gray-600"></div>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="font-medium text-sm text-gray-600 text-center">{day}</div>
                      ))}
                    </div>
                    
                    {/* Time slots */}
                    {['9 AM', '12 PM', '3 PM', '6 PM'].map((time, timeIndex) => (
                      <div key={time} className="grid grid-cols-8 gap-2 mb-2">
                        <div className="text-sm text-gray-600 py-2">{time}</div>
                        {[1,2,3,4,5,6,7].map(day => (
                          <div key={day} className="h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border-2 border-dashed border-purple-300 flex items-center justify-center text-xs">
                            {day <= 5 && timeIndex < 3 ? (
                              <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 rounded text-xs">
                                {timeIndex === 0 ? 'Sarah + Lisa' : timeIndex === 1 ? 'Emma + Mike' : 'Anna + Tom'}
                              </div>
                            ) : day === 6 && timeIndex === 1 ? (
                              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded text-xs animate-pulse">
                                AI Suggestion
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">Available</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  
                  {/* AI Insights Panel */}
                  <div className="mt-6 space-y-3">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg text-white">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <Brain className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Optimal Team Pairing</p>
                          <p className="text-sm opacity-90">Emma (opener) + David (upseller) for Saturday 12 PM - 92% compatibility, +15% projected sales</p>
                        </div>
                        <Button size="sm" variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                          Apply
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 rounded-lg text-white">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <Target className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Peak Hour Alert</p>
                          <p className="text-sm opacity-90">Saturday 2-4 PM typically 40% busier - consider adding Maria to the schedule</p>
                        </div>
                        <Button size="sm" variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                          Auto-Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Features Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Complete Scheduling Solution</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">Everything you need to create perfect schedules, powered by AI intelligence</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {keyFeatures.map((feature, index) => (
                <Card key={feature.title} className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 leading-relaxed">{feature.description}</p>
                    <div className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full inline-block">
                      {feature.stats}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Proven Results for Beauty & Cosmetics Businesses</h2>
              <p className="text-gray-600 text-lg">Join 500+ salons and spas using Mema to optimize their operations</p>
            </div>
            
            {/* Success Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <Card className="text-center p-6 border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="text-3xl font-bold text-green-600 mb-2">$2,400</div>
                <div className="text-sm text-gray-600">Average monthly revenue increase</div>
              </Card>
              <Card className="text-center p-6 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                <div className="text-3xl font-bold text-blue-600 mb-2">12 hrs</div>
                <div className="text-sm text-gray-600">Saved per week on scheduling</div>
              </Card>
              <Card className="text-center p-6 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50">
                <div className="text-3xl font-bold text-purple-600 mb-2">95%</div>
                <div className="text-sm text-gray-600">Customer satisfaction improvement</div>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3 p-4 bg-white/60 rounded-lg hover:bg-white/80 transition-colors">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className="text-center mt-12">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Scheduling?</h3>
                <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
                  Join hundreds of beauty businesses already using AI-powered scheduling to increase sales and reduce stress.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="bg-white text-purple-600 border-white hover:bg-purple-50"
                    onClick={() => navigate('/team')}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Try Interactive Demo
                  </Button>
                  <Button 
                    size="lg"
                    className="bg-purple-800 hover:bg-purple-900"
                    onClick={() => navigate('/auth')}
                  >
                    Start 14-Day Free Trial
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

export default AISchedulingFeaturePage;