import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { Settings, LogOut, User, Users } from "lucide-react";
import { EmployeePinAuth } from "./EmployeePinAuth";
import { EmployeeDashboard } from "./EmployeeDashboard";
import { supabase } from "@/integrations/supabase/client";

export const POSHeader = () => {
  const navigate = useNavigate();
  const [posUser, setPosUser] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string>('');
  const [isPinAuthOpen, setIsPinAuthOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [authenticatedEmployee, setAuthenticatedEmployee] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('pos_user');
    if (userData) {
      setPosUser(JSON.parse(userData));
    }
    
    // Get business ID from current POS session
    const sessionData = localStorage.getItem('pos_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setBusinessId(session.business_id || '');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('pos_user');
    navigate("/pos/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEmployeeAuth = (employee: any) => {
    setAuthenticatedEmployee(employee);
    setIsPinAuthOpen(false);
    setIsDashboardOpen(true);
  };

  const handleDashboardClose = () => {
    setIsDashboardOpen(false);
    setAuthenticatedEmployee(null);
  };

  return (
    <header className="h-16 bg-primary text-primary-foreground border-b">
      <div className="flex items-center justify-between h-full px-6">
        {/* Brand */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Mema POS</h1>
          <Badge variant="secondary" className="bg-primary-light text-foreground">
            Terminal Session
          </Badge>
        </div>

        {/* Center - Current Time & Date */}
        <div className="text-center">
          <div className="text-sm opacity-90">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div className="text-lg font-semibold">
            {new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-3">
          {/* My Dash Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary-foreground hover:bg-primary-muted"
            onClick={() => setIsPinAuthOpen(true)}
          >
            <Users className="h-4 w-4 mr-2" />
            My Dash
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary-foreground hover:bg-primary-muted"
            onClick={() => navigate("/settings")}
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-2 pl-2 border-l border-primary-muted">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary-light text-foreground">
                {posUser?.name ? getInitials(posUser.name) : <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-medium">
                {posUser?.name || "POS User"}
              </div>
              <div className="text-xs opacity-80">
                {new Date(posUser?.loginTime).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })} Login
              </div>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary-foreground hover:bg-primary-muted"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PIN Authentication Modal */}
      <EmployeePinAuth
        isOpen={isPinAuthOpen}
        onClose={() => setIsPinAuthOpen(false)}
        onSuccess={handleEmployeeAuth}
        businessId={businessId}
      />

      {/* Employee Dashboard Modal - Using Dialog wrapper */}
      {authenticatedEmployee && isDashboardOpen && (
        <div className="fixed inset-0 z-50 bg-background">
          <EmployeeDashboard
            employee={authenticatedEmployee}
            onSignOut={handleDashboardClose}
          />
        </div>
      )}
    </header>
  );
};