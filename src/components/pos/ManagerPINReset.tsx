import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  KeyRound, 
  User, 
  RefreshCw, 
  AlertCircle, 
  Search,
  Shield 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { hashPin, validatePinFormat, logSecurityEvent } from "@/lib/security";

interface Employee {
  user_id: string;
  full_name: string;
  username: string;
  email: string;
  pos_pin_hash: string | null;
  role: string;
  is_active: boolean;
}

export const ManagerPINReset = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      
      // Get business context
      const { data: userContext } = await supabase.rpc('get_user_business_context', {
        user_uuid: user?.id
      });

      if (!userContext || userContext.length === 0) return;

      const businessId = userContext[0].business_id;

      // Fetch team members
      const { data: memberships, error } = await supabase
        .from('user_business_memberships')
        .select('user_id, role, is_active')
        .eq('business_id', businessId)
        .neq('user_id', user?.id); // Exclude current user

      if (error) throw error;

      if (!memberships || memberships.length === 0) {
        setEmployees([]);
        return;
      }

      const userIds = memberships.map(m => m.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, email, pos_pin_hash')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      const employeeData = memberships.map(m => {
        const profile = profiles?.find(p => p.user_id === m.user_id);
        return {
          user_id: m.user_id,
          full_name: profile?.full_name || "",
          username: profile?.username || "",
          email: profile?.email || "",
          pos_pin_hash: profile?.pos_pin_hash || null,
          role: m.role,
          is_active: m.is_active
        };
      }).filter(emp => emp.full_name || emp.username || emp.email);

      setEmployees(employeeData);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPIN = async () => {
    if (!selectedEmployee) return;

    if (!validatePinFormat(newPin)) {
      toast({
        title: "Error",
        description: "PIN must be 4-6 digits",
        variant: "destructive",
      });
      return;
    }

    if (newPin !== confirmPin) {
      toast({
        title: "Error",
        description: "PIN confirmation does not match",
        variant: "destructive",
      });
      return;
    }

    try {
      setResetLoading(true);

      const hashedPin = await hashPin(newPin);
      
      const { error } = await supabase
        .from('profiles')
        .update({ pos_pin_hash: hashedPin })
        .eq('user_id', selectedEmployee.user_id);

      if (error) throw error;

      // Log security event
      const { data: businessData } = await supabase
        .from('user_business_memberships')
        .select('business_id')
        .eq('user_id', selectedEmployee.user_id)
        .single();
        
      if (businessData) {
        await logSecurityEvent(
          businessData.business_id,
          'pin_reset',
          `PIN was reset for user by manager`,
          'warning',
          { target_user_id: selectedEmployee.user_id }
        );
      }

      toast({
        title: "Success",
        description: `PIN reset successfully for ${selectedEmployee.full_name}`,
      });

      // Clear form and reload employees
      setNewPin("");
      setConfirmPin("");
      setSelectedEmployee(null);
      loadEmployees();

    } catch (error: any) {
      console.error('Error resetting PIN:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset PIN",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Manager PIN Reset</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            As a manager, you can reset POS PINs for your team members. Use this responsibly and inform employees of their new PINs.
          </AlertDescription>
        </Alert>

        {/* Employee Search & Selection */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Search Employees</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, username, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Employee</Label>
            <Select
              value={selectedEmployee?.user_id || ""}
              onValueChange={(userId) => {
                const emp = employees.find(e => e.user_id === userId);
                setSelectedEmployee(emp || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an employee to reset PIN" />
              </SelectTrigger>
              <SelectContent>
                {filteredEmployees.map((emp) => (
                  <SelectItem key={emp.user_id} value={emp.user_id}>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{emp.full_name || emp.username || emp.email}</span>
                      <Badge variant={emp.pos_pin_hash ? "default" : "destructive"} className="text-xs">
                        {emp.pos_pin_hash ? "PIN Set" : "No PIN"}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Current Employee Info */}
        {selectedEmployee && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Selected Employee</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span> {selectedEmployee.full_name}
              </div>
              <div>
                <span className="text-muted-foreground">Username:</span> {selectedEmployee.username}
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span> {selectedEmployee.email}
              </div>
              <div>
                <span className="text-muted-foreground">Current PIN:</span>{" "}
                <Badge variant={selectedEmployee.pos_pin_hash ? "default" : "destructive"}>
                  {selectedEmployee.pos_pin_hash ? "Set" : "Not Set"}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* PIN Reset Form */}
        {selectedEmployee && (
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Set New PIN for {selectedEmployee.full_name}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="managerNewPin">New PIN</Label>
                <Input
                  id="managerNewPin"
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 4-6 digit PIN"
                  maxLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="managerConfirmPin">Confirm PIN</Label>
                <Input
                  id="managerConfirmPin"
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Confirm PIN"
                  maxLength={6}
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-6">
              <Button 
                onClick={handleResetPIN}
                disabled={resetLoading || !newPin || !validatePinFormat(newPin) || !selectedEmployee}
                className="flex items-center space-x-2"
              >
                <KeyRound className="h-4 w-4" />
                <span>{resetLoading ? "Resetting..." : "Reset PIN"}</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  setSelectedEmployee(null);
                  setNewPin("");
                  setConfirmPin("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Employee List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Team Members ({employees.length})</h4>
            <Button variant="outline" size="sm" onClick={loadEmployees} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <div className="grid gap-2">
            {filteredEmployees.map((emp) => (
              <div key={emp.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{emp.full_name || emp.username}</p>
                    <p className="text-sm text-muted-foreground">{emp.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={emp.is_active ? "default" : "secondary"}>
                    {emp.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant={emp.pos_pin_hash ? "default" : "destructive"}>
                    {emp.pos_pin_hash ? "PIN Set" : "No PIN"}
                  </Badge>
                </div>
              </div>
            ))}
            
            {filteredEmployees.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                No employees found matching your search.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};