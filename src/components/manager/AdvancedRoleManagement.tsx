import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  User, 
  Users, 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  UserCheck,
  UserX,
  Crown,
  Briefcase,
  AlertCircle,
  Check,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Employee {
  user_id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  hire_date: string;
  hourly_rate?: number;
  base_commission_rate?: number;
  commission_type: string;
  current_commission_tier?: number;
}

interface RolePermission {
  id: string;
  role: string;
  permission: string;
  enabled: boolean;
}

interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_active: boolean;
}

export const AdvancedRoleManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  
  // Permission management
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  
  // Form states
  const [editForm, setEditForm] = useState({
    role: '',
    hourly_rate: '',
    base_commission_rate: '',
    commission_type: 'hourly',
    is_active: true
  });

  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  const availablePermissions = [
    'pos_access', 'inventory_view', 'inventory_edit', 'reports_view', 'reports_edit',
    'employee_view', 'employee_edit', 'customer_view', 'customer_edit',
    'sales_view', 'analytics_view', 'settings_view', 'settings_edit',
    'commission_view', 'commission_edit', 'schedule_view', 'schedule_edit'
  ];

  const roles = [
    'business_owner', 'manager', 'salesperson', 'employee'
  ];

  useEffect(() => {
    loadEmployees();
    loadPermissions();
    loadCustomRoles();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      
      const { data: userContext } = await supabase.rpc('get_user_business_context', {
        user_uuid: user?.id
      });

      if (!userContext || userContext.length === 0) return;

      const businessId = userContext[0].business_id;

      const { data: memberships, error } = await supabase
        .from('user_business_memberships')
        .select(`
          user_id, role, is_active, hired_date, hourly_rate, 
          base_commission_rate, commission_type, current_commission_tier
        `)
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
        .select('user_id, full_name, username, email')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      const employeeData = memberships.map(m => {
        const profile = profiles?.find(p => p.user_id === m.user_id);
        return {
          user_id: m.user_id,
          full_name: profile?.full_name || "",
          username: profile?.username || "",
          email: profile?.email || "",
          role: m.role,
          is_active: m.is_active,
          hire_date: m.hired_date || "",
          hourly_rate: m.hourly_rate,
          base_commission_rate: m.base_commission_rate,
          commission_type: m.commission_type || 'hourly',
          current_commission_tier: m.current_commission_tier
        };
      });

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

  const loadPermissions = async () => {
    // Mock data - in real app, this would come from database
    const mockPermissions: RolePermission[] = [
      { id: '1', role: 'manager', permission: 'pos_access', enabled: true },
      { id: '2', role: 'manager', permission: 'inventory_edit', enabled: true },
      { id: '3', role: 'salesperson', permission: 'pos_access', enabled: true },
      { id: '4', role: 'salesperson', permission: 'inventory_view', enabled: true },
      { id: '5', role: 'employee', permission: 'pos_access', enabled: true }
    ];
    setPermissions(mockPermissions);
  };

  const loadCustomRoles = async () => {
    // Mock data - in real app, this would come from database
    const mockRoles: CustomRole[] = [
      {
        id: '1',
        name: 'Senior Sales Associate',
        description: 'Advanced sales role with inventory access',
        permissions: ['pos_access', 'inventory_view', 'customer_edit', 'reports_view'],
        is_active: true
      },
      {
        id: '2',
        name: 'Shift Supervisor',
        description: 'Team lead with limited management access',
        permissions: ['pos_access', 'employee_view', 'reports_view', 'schedule_view'],
        is_active: true
      }
    ];
    setCustomRoles(mockRoles);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditForm({
      role: employee.role,
      hourly_rate: employee.hourly_rate?.toString() || '',
      base_commission_rate: employee.base_commission_rate?.toString() || '',
      commission_type: employee.commission_type,
      is_active: employee.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      const { data: userContext } = await supabase.rpc('get_user_business_context', {
        user_uuid: user?.id
      });

      if (!userContext || userContext.length === 0) return;

      const updateData: any = {
        role: editForm.role,
        commission_type: editForm.commission_type,
        is_active: editForm.is_active
      };

      if (editForm.hourly_rate) {
        updateData.hourly_rate = parseFloat(editForm.hourly_rate);
      }

      if (editForm.base_commission_rate) {
        updateData.base_commission_rate = parseFloat(editForm.base_commission_rate);
      }

      const { error } = await supabase
        .from('user_business_memberships')
        .update(updateData)
        .eq('user_id', selectedEmployee.user_id)
        .eq('business_id', userContext[0].business_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee updated successfully",
      });

      setIsEditDialogOpen(false);
      loadEmployees();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive",
      });
    }
  };

  const handleCreateCustomRole = async () => {
    try {
      // Mock creation - in real app, save to database
      const newCustomRole: CustomRole = {
        id: Date.now().toString(),
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions,
        is_active: true
      };

      setCustomRoles(prev => [...prev, newCustomRole]);

      toast({
        title: "Success",
        description: "Custom role created successfully",
      });

      setNewRole({ name: '', description: '', permissions: [] });
      setIsRoleDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create custom role",
        variant: "destructive",
      });
    }
  };

  const togglePermission = (roleId: string, permission: string) => {
    setCustomRoles(prev => prev.map(role => {
      if (role.id === roleId) {
        const permissions = role.permissions.includes(permission)
          ? role.permissions.filter(p => p !== permission)
          : [...role.permissions, permission];
        return { ...role, permissions };
      }
      return role;
    }));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'business_owner': return 'default';
      case 'manager': return 'secondary';
      case 'salesperson': return 'outline';
      case 'employee': return 'destructive';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'business_owner': return Crown;
      case 'manager': return Shield;
      case 'salesperson': return Briefcase;
      case 'employee': return User;
      default: return User;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Role Management</h2>
          <p className="text-muted-foreground">Manage employee roles, permissions, and custom access levels</p>
        </div>
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Custom Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Custom Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role Name</Label>
                  <Input
                    value={newRole.name}
                    onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Senior Sales Associate"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newRole.description}
                    onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Role description"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {availablePermissions.map(permission => (
                    <div key={permission} className="flex items-center space-x-2">
                      <Switch
                        checked={newRole.permissions.includes(permission)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewRole(prev => ({ 
                              ...prev, 
                              permissions: [...prev.permissions, permission] 
                            }));
                          } else {
                            setNewRole(prev => ({ 
                              ...prev, 
                              permissions: prev.permissions.filter(p => p !== permission) 
                            }));
                          }
                        }}
                      />
                      <Label className="text-sm capitalize">
                        {permission.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCustomRole}>
                  Create Role
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="employees">Employee Management</TabsTrigger>
          <TabsTrigger value="roles">Custom Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions Matrix</TabsTrigger>
        </TabsList>

        {/* Employee Management Tab */}
        <TabsContent value="employees" className="space-y-4">
          <div className="grid gap-4">
            {employees.map((employee) => {
              const RoleIcon = getRoleIcon(employee.role);
              
              return (
                <Card key={employee.user_id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{employee.full_name || employee.username}</h3>
                            <Badge 
                              variant={getRoleBadgeColor(employee.role)}
                              className="flex items-center space-x-1"
                            >
                              <RoleIcon className="h-3 w-3" />
                              <span className="capitalize">{employee.role.replace('_', ' ')}</span>
                            </Badge>
                            <Badge variant={employee.is_active ? "default" : "destructive"}>
                              {employee.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                            <span>Hired: {new Date(employee.hire_date).toLocaleDateString()}</span>
                            {employee.hourly_rate && (
                              <span>${employee.hourly_rate}/hr</span>
                            )}
                            {employee.base_commission_rate && (
                              <span>{employee.base_commission_rate}% commission</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEmployee(employee)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Custom Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4">
            {customRoles.map((role) => (
              <Card key={role.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{role.name}</h3>
                        <Badge variant={role.is_active ? "default" : "secondary"}>
                          {role.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{role.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.map(permission => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Permissions Matrix Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permissions Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Permission</th>
                      {roles.map(role => (
                        <th key={role} className="text-center py-2 capitalize">
                          {role.replace('_', ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {availablePermissions.map(permission => (
                      <tr key={permission} className="border-b">
                        <td className="py-2 capitalize">{permission.replace('_', ' ')}</td>
                        {roles.map(role => {
                          const hasPermission = permissions.some(
                            p => p.role === role && p.permission === permission && p.enabled
                          );
                          return (
                            <td key={role} className="text-center py-2">
                              {hasPermission ? (
                                <Check className="h-4 w-4 text-success mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role} value={role}>
                        {role.replace('_', ' ').charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hourly Rate</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.hourly_rate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, hourly_rate: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Commission Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.base_commission_rate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, base_commission_rate: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Commission Type</Label>
                <Select
                  value={editForm.commission_type}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, commission_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="commission">Commission Only</SelectItem>
                    <SelectItem value="hourly_plus_commission">Hourly + Commission</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editForm.is_active}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Active Employee</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEmployee}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};