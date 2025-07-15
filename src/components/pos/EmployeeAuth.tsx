import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { User, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  username: string;
  full_name: string;
  position_type: string;
  business_id: string;
}

interface EmployeeAuthProps {
  isOpen: boolean;
  onClose: () => void;
  onEmployeeAuthenticated: (employee: Employee) => void;
  businessId?: string;
}

export function EmployeeAuth({ isOpen, onClose, onEmployeeAuthenticated, businessId }: EmployeeAuthProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && businessId) {
      fetchEmployees();
    }
  }, [isOpen, businessId]);

  const fetchEmployees = async () => {
    if (!businessId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          position_type,
          user_business_memberships!inner(
            business_id,
            role,
            is_active
          )
        `)
        .eq('user_business_memberships.business_id', businessId)
        .eq('user_business_memberships.is_active', true)
        .neq('user_business_memberships.role', 'business_owner');

      if (error) throw error;

      const formattedEmployees = data?.map((profile: any) => ({
        id: profile.id,
        username: profile.username || profile.full_name || 'Unknown',
        full_name: profile.full_name || 'Unknown Employee',
        position_type: profile.position_type || 'staff',
        business_id: businessId
      })) || [];

      setEmployees(formattedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleEmployeeClick = (employee: Employee) => {
    setUsername(employee.username);
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Find employee by username
      const employee = employees.find(emp => 
        emp.username.toLowerCase() === username.toLowerCase()
      );

      if (!employee) {
        setError("Employee not found");
        setIsLoading(false);
        return;
      }

      // In a real implementation, you would verify the password against a hash
      // For now, we'll use a simple check (this is NOT secure for production)
      if (password === "1234" || password === "password") {
        onEmployeeAuthenticated(employee);
        toast({
          title: "Success",
          description: `Welcome back, ${employee.full_name}!`,
        });
        onClose();
        setUsername("");
        setPassword("");
      } else {
        setError("Invalid password");
      }
    } catch (error) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Employee Clock In
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee List */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Select Employee
            </Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {employees.map((employee) => (
                <Card 
                  key={employee.id}
                  className={`p-3 cursor-pointer transition-all border-2 ${
                    username === employee.username 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleEmployeeClick(employee)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{employee.full_name}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {employee.position_type}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-lg"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Clock In"}
            </Button>
          </form>

          <div className="text-xs text-center text-muted-foreground">
            Demo: Use password "1234" or "password"
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}