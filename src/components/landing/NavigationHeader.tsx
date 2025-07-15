import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  ChevronDown,
  Store,
  Users,
  BarChart3,
  Package,
  Calendar,
  MessageSquare,
  Brain,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  CreditCard,
  Settings
} from "lucide-react";

export const NavigationHeader = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const features = [
    {
      category: "Core Systems",
      items: [
        {
          icon: Store,
          title: "Smart POS",
          description: "Lightning-fast checkout with AI-powered recommendations",
          href: "/features/pos",
          gradient: "from-primary to-primary-glow"
        },
        {
          icon: Package,
          title: "AI Inventory",
          description: "Predictive stock management with automated reordering",
          href: "/features/inventory", 
          gradient: "from-success to-primary-glow"
        },
        {
          icon: BarChart3,
          title: "Analytics & Insights",
          description: "Real-time performance tracking and business intelligence",
          href: "/features/analytics",
          gradient: "from-warning to-primary-muted"
        },
        {
          icon: MessageSquare,
          title: "Customer Experience",
          description: "Complete CRM with loyalty programs and personalization",
          href: "/features/crm",
          gradient: "from-primary-muted to-primary"
        }
      ]
    },
    {
      category: "Team Management",
      items: [
        {
          icon: Calendar,
          title: "AI-Powered Scheduling",
          description: "Drag & drop scheduling with AI optimization suggestions",
          href: "/features/scheduling",
          gradient: "from-primary-light to-primary",
          badge: "AI Enhanced"
        },
        {
          icon: Users,
          title: "Team Performance",
          description: "Track goals, commissions, and team collaboration",
          href: "/features/team",
          gradient: "from-primary to-success"
        },
        {
          icon: Brain,
          title: "AI Assistant", 
          description: "Smart business insights and automated task management",
          href: "/features/ai",
          gradient: "from-primary-glow to-primary",
          badge: "New"
        },
        {
          icon: Shield,
          title: "Security & Access",
          description: "Role-based permissions and activity monitoring",
          href: "/features/security",
          gradient: "from-muted to-primary-muted"
        }
      ]
    }
  ];

  const solutions = [
    { title: "Beauty Salons", href: "/solutions/beauty-salons" },
    { title: "Cosmetics Retail", href: "/solutions/cosmetics-retail" },
    { title: "Spas & Wellness", href: "/solutions/spas-wellness" },
    { title: "Multi-Location Chains", href: "/solutions/multi-location" }
  ];

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 glass-effect">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-primary rounded-xl shadow-button flex items-center justify-center">
              <Sparkles className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
            </div>
            <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Mema
            </span>
          </button>
          
          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {/* Features Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setActiveDropdown('features')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors">
                <span>Features</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {activeDropdown === 'features' && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-[800px] bg-card rounded-2xl shadow-strong border border-border p-8 animate-fade-in">
                  <div className="grid grid-cols-2 gap-8">
                    {features.map((category) => (
                      <div key={category.category}>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                          {category.category}
                        </h3>
                        <div className="space-y-3">
                          {category.items.map((item) => (
                            <button
                              key={item.title}
                              onClick={() => navigate(item.href)}
                              className="flex items-start space-x-4 p-3 rounded-xl hover:bg-accent transition-all w-full text-left group"
                            >
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center group-hover:scale-110 transition-transform shadow-button`}>
                                <item.icon className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {item.title}
                                  </h4>
                                  {item.badge && (
                                    <Badge variant="secondary" className="text-xs">
                                      {item.badge}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {item.description}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Solutions Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setActiveDropdown('solutions')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors">
                <span>Solutions</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {activeDropdown === 'solutions' && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-card rounded-xl shadow-medium border border-border p-4 animate-fade-in">
                  <div className="space-y-2">
                    {solutions.map((solution) => (
                      <button
                        key={solution.title}
                        onClick={() => navigate(solution.href)}
                        className="block w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        <span className="font-medium text-foreground">{solution.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <a href="#pricing" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#contact" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Contact
            </a>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" onClick={() => {
                  // Route based on user role like in Auth.tsx
                  navigate('/dashboard'); // Default to main dashboard for business owners
                }}>
                  <Store className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => navigate('/auth')} 
                  className="bg-gradient-primary shadow-button hover:shadow-button-hover"
                >
                  Free Trial
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};