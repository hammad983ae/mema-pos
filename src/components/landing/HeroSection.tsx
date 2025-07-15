import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, 
  BarChart3, 
  Package, 
  Store,
  Sparkles,
  ArrowRight
} from "lucide-react";

export const HeroSection = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <>
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 glass-effect">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-primary rounded-xl shadow-glow"></div>
              <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Mema</span>
            </div>
            
            {/* Mobile Menu Button */}
            <button className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-border hover:bg-muted transition-colors">
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span className="block w-5 h-0.5 bg-foreground mb-1"></span>
                <span className="block w-5 h-0.5 bg-foreground mb-1"></span>
                <span className="block w-5 h-0.5 bg-foreground"></span>
              </div>
            </button>
            
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <a href="#features" className="text-sm lg:text-base font-medium hover:text-primary transition-all duration-300 animated-underline">Features</a>
              <a href="#pricing" className="text-sm lg:text-base font-medium hover:text-primary transition-all duration-300 animated-underline">Pricing</a>
              <a href="#demo" className="text-sm lg:text-base font-medium hover:text-primary transition-all duration-300 animated-underline">Demo</a>
            </nav>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {user ? (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <span className="hidden sm:block text-sm text-muted-foreground">Welcome back!</span>
                  <Button variant="outline" size="sm" onClick={() => navigate('/pos')} className="hidden sm:flex">
                    <Store className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button variant="outline" size="icon-sm" onClick={() => navigate('/pos')} className="sm:hidden">
                    <Store className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={signOut}>
                    <span className="hidden sm:block">Sign Out</span>
                    <span className="sm:hidden">Out</span>
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                    <span className="hidden sm:block">Sign In</span>
                    <span className="sm:hidden">In</span>
                  </Button>
                  <Button size="sm" onClick={() => navigate('/auth')} className="bg-gradient-primary shadow-button hover:shadow-button-hover">
                    <span className="hidden sm:block">Start Free Trial</span>
                    <span className="sm:hidden">Trial</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-hero min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pb-24 lg:pb-32 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <Badge className="mb-6 sm:mb-8 bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm sm:text-base glass-effect">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Built by Cosmetics Shop Owners, for Cosmetics Shop Owners
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 sm:mb-8 bg-gradient-to-br from-foreground via-primary to-primary-glow bg-clip-text text-transparent leading-tight">
              Mema
            </h1>
            
            <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto px-4">
              The complete business management platform designed specifically for cosmetics shops, 
              beauty retailers, and skincare businesses.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 max-w-6xl mx-auto">
              <Button 
                size="xl" 
                variant="premium"
                className="col-span-1 sm:col-span-2 lg:col-span-1 xl:col-span-2 h-12 sm:h-14 text-sm sm:text-base font-semibold"
                onClick={() => navigate('/auth')}
              >
                <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Sign In
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
              </Button>
              <Button 
                variant="glass" 
                size="lg"
                className="h-12 sm:h-14 text-sm sm:text-base"
                onClick={() => navigate('/pos/demo')}
              >
                <Store className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="hidden sm:block">Launch POS Demo</span>
                <span className="sm:hidden">POS Demo</span>
              </Button>
              <Button 
                variant="glass" 
                size="lg"
                className="h-12 sm:h-14 text-sm sm:text-base"
                onClick={() => navigate('/analytics/demo')}
              >
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="hidden sm:block">View Analytics</span>
                <span className="sm:hidden">Analytics</span>
              </Button>
              <Button 
                variant="glass" 
                size="lg"
                className="h-12 sm:h-14 text-sm sm:text-base"
                onClick={() => navigate('/inventory')}
              >
                <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="hidden sm:block">Manage Inventory</span>
                <span className="sm:hidden">Inventory</span>
              </Button>
              <Button 
                variant="glass" 
                size="lg"
                className="h-12 sm:h-14 text-sm sm:text-base"
                onClick={() => navigate('/team/demo')}
              >
                <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="hidden sm:block">Team Management</span>
                <span className="sm:hidden">Team</span>
              </Button>
              <Button 
                variant="glass" 
                size="lg"
                className="h-12 sm:h-14 text-sm sm:text-base"
                onClick={() => navigate('/employee')}
              >
                <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="hidden sm:block">Employee Portal</span>
                <span className="sm:hidden">Employee</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center max-w-2xl mx-auto">
              <div className="glass-effect p-6 rounded-2xl transform hover:scale-105 transition-all duration-300">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2">200+</div>
                <div className="text-sm sm:text-base text-muted-foreground">Store Locations</div>
              </div>
              <div className="glass-effect p-6 rounded-2xl transform hover:scale-105 transition-all duration-300">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-success mb-2">&lt;3s</div>
                <div className="text-sm sm:text-base text-muted-foreground">Transaction Speed</div>
              </div>
              <div className="glass-effect p-6 rounded-2xl transform hover:scale-105 transition-all duration-300">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-warning mb-2">$2M+</div>
                <div className="text-sm sm:text-base text-muted-foreground">Revenue Processed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};