import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { KeyRound, Shield, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  user_id: string;
  full_name: string;
  username: string;
  email: string;
}

export const EmployeePasswordReset = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      // Get current user's business context
      const { data: userContext } = await supabase.rpc('get_user_business_context', {
        user_uuid: (await supabase.auth.getUser()).data.user?.id
      });

      if (!userContext || userContext.length === 0) {
        throw new Error("No business access found");
      }

      const businessId = userContext[0].business_id;

      // Get all memberships first
      const { data: memberships, error: memberError } = await supabase
        .from('user_business_memberships')
        .select('user_id')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .neq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        setEmployees([]);
        return;
      }

      // Get profiles for these users
      const userIds = memberships.map(m => m.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, email')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      const employeeList = profiles?.map(profile => ({
        user_id: profile.user_id,
        full_name: profile.full_name || "",
        username: profile.username || "",
        email: profile.email || ""
      })) || [];

      setEmployees(employeeList);
    } catch (error: any) {
      console.error('Error loading employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employee list",
        variant: "destructive",
      });
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!selectedEmployee || !newPassword) {
      toast({
        title: "Error",
        description: "Please select an employee and enter a new password",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          targetUserId: selectedEmployee,
          newPassword: newPassword
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Failed to reset password");
      }

      toast({
        title: "Success",
        description: "Employee password has been reset successfully",
      });

      // Clear form
      setSelectedEmployee("");
      setNewPassword("");
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployeeData = employees.find(emp => emp.user_id === selectedEmployee);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Employee Password Reset</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingEmployees ? (
          <div className="text-center py-4">
            <Users className="h-8 w-8 mx-auto mb-2 animate-spin" />
            <p>Loading employees...</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="employee">Select Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.user_id} value={employee.user_id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{employee.full_name}</span>
                        <span className="text-sm text-muted-foreground">@{employee.username}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                minLength={6}
              />
            </div>

            {selectedEmployeeData && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Selected Employee:</p>
                <p className="text-sm">{selectedEmployeeData.full_name}</p>
                <p className="text-sm text-muted-foreground">@{selectedEmployeeData.username}</p>
                <p className="text-sm text-muted-foreground">{selectedEmployeeData.email}</p>
              </div>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  className="w-full" 
                  disabled={!selectedEmployee || !newPassword || loading}
                  variant="destructive"
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Password Reset</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to reset the password for{" "}
                    <strong>{selectedEmployeeData?.full_name}</strong>? 
                    This action cannot be undone and the employee will need to use the new password to log in.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePasswordReset} disabled={loading}>
                    {loading ? "Resetting..." : "Reset Password"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardContent>
    </Card>
  );
};