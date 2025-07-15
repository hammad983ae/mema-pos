import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Shield, 
  Plus,
  Edit,
  Trash2,
  Save,
  X
} from "lucide-react";

interface RolePermission {
  id: string;
  role_name: string;
  permission_category: string;
  permission_name: string;
  access_level: string;
  conditions: any;
}

interface AdvancedRoleManagementProps {
  userRole: string;
}

const AdvancedRoleManagement = ({ userRole }: AdvancedRoleManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [editingPermission, setEditingPermission] = useState<RolePermission | null>(null);
  const [newPermission, setNewPermission] = useState<Partial<RolePermission>>({
    role_name: '',
    permission_category: '',
    permission_name: '',
    access_level: 'none'
  });

  const isManager = userRole === "business_owner" || userRole === "manager";

  const permissionCategories = [
    'pos', 'inventory', 'customers', 'reports', 'admin', 'security'
  ];

  const accessLevels = [
    { value: 'none', label: 'No Access', description: 'Cannot access this resource' },
    { value: 'read', label: 'Read Only', description: 'Can view but not modify' },
    { value: 'write', label: 'Read/Write', description: 'Can view and modify' },
    { value: 'admin', label: 'Full Admin', description: 'Complete control including deletion' }
  ];

  const defaultRoles = [
    'business_owner', 'manager', 'employee', 'cashier', 'opener', 'upseller'
  ];

  const permissionsByCategory = {
    pos: [
      'process_sales', 'process_refunds', 'access_cash_drawer', 'override_prices', 
      'apply_discounts', 'void_transactions', 'end_of_day_reports'
    ],
    inventory: [
      'view_inventory', 'manage_products', 'receive_shipments', 'create_purchase_orders',
      'adjust_stock', 'view_low_stock_alerts', 'manage_suppliers'
    ],
    customers: [
      'view_customers', 'create_customers', 'edit_customers', 'delete_customers',
      'view_customer_history', 'export_customer_data'
    ],
    reports: [
      'view_sales_reports', 'view_inventory_reports', 'view_employee_reports',
      'export_reports', 'view_financial_reports', 'view_analytics'
    ],
    admin: [
      'manage_users', 'manage_business_settings', 'manage_integrations',
      'view_audit_logs', 'manage_backups', 'system_configuration'
    ],
    security: [
      'manage_security_settings', 'view_security_logs', 'manage_user_permissions',
      'manage_api_keys', 'security_compliance', 'incident_response'
    ]
  };

  useEffect(() => {
    const loadRolePermissions = async () => {
      if (!user || !isManager) return;
      
      setLoading(true);
      try {
        // Get user's business ID
        const { data: membership } = await supabase
          .from('user_business_memberships')
          .select('business_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (membership) {
          setBusinessId(membership.business_id);
          
          // Load role permissions
          const { data: permissions, error } = await supabase
            .from('role_permissions')
            .select('*')
            .eq('business_id', membership.business_id)
            .order('role_name, permission_category, permission_name');

          if (error) {
            console.error('Error loading role permissions:', error);
          } else {
            setRolePermissions(permissions || []);
          }
        }
      } catch (error) {
        console.error('Error loading role permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRolePermissions();
  }, [user, isManager]);

  const createDefaultPermissions = async (roleName: string) => {
    if (!businessId) return;

    const defaultPermissionsForRole = {
      business_owner: {
        pos: 'admin', inventory: 'admin', customers: 'admin', 
        reports: 'admin', admin: 'admin', security: 'admin'
      },
      manager: {
        pos: 'admin', inventory: 'admin', customers: 'admin', 
        reports: 'admin', admin: 'write', security: 'write'
      },
      employee: {
        pos: 'write', inventory: 'read', customers: 'write', 
        reports: 'read', admin: 'none', security: 'none'
      },
      cashier: {
        pos: 'write', inventory: 'read', customers: 'read', 
        reports: 'none', admin: 'none', security: 'none'
      },
      opener: {
        pos: 'write', inventory: 'read', customers: 'write', 
        reports: 'read', admin: 'none', security: 'none'
      },
      upseller: {
        pos: 'write', inventory: 'read', customers: 'write', 
        reports: 'read', admin: 'none', security: 'none'
      }
    };

    const roleDefaults = defaultPermissionsForRole[roleName as keyof typeof defaultPermissionsForRole];
    if (!roleDefaults) return;

    const permissionsToCreate = [];
    for (const [category, accessLevel] of Object.entries(roleDefaults)) {
      const categoryPermissions = permissionsByCategory[category as keyof typeof permissionsByCategory] || [];
      for (const permission of categoryPermissions) {
        permissionsToCreate.push({
          business_id: businessId,
          role_name: roleName,
          permission_category: category,
          permission_name: permission,
          access_level: accessLevel,
          conditions: {}
        });
      }
    }

    const { error } = await supabase
      .from('role_permissions')
      .upsert(permissionsToCreate, { 
        onConflict: 'business_id,role_name,permission_category,permission_name' 
      });

    if (error) {
      console.error('Error creating default permissions:', error);
      throw error;
    }
  };

  const savePermission = async (permission: Partial<RolePermission>) => {
    if (!businessId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('role_permissions')
        .upsert({
          business_id: businessId,
          role_name: permission.role_name,
          permission_category: permission.permission_category,
          permission_name: permission.permission_name,
          access_level: permission.access_level,
          conditions: permission.conditions || {}
        }, {
          onConflict: 'business_id,role_name,permission_category,permission_name'
        });

      if (error) throw error;

      toast({
        title: "Permission Saved",
        description: "Role permission has been updated successfully.",
      });

      // Reload permissions
      const { data: permissions } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('business_id', businessId)
        .order('role_name, permission_category, permission_name');

      setRolePermissions(permissions || []);
      setEditingPermission(null);
      setNewPermission({
        role_name: '',
        permission_category: '',
        permission_name: '',
        access_level: 'none'
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePermission = async (permissionId: string) => {
    if (!confirm("Are you sure you want to delete this permission?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('id', permissionId);

      if (error) throw error;

      setRolePermissions(prev => prev.filter(p => p.id !== permissionId));
      toast({
        title: "Permission Deleted",
        description: "Role permission has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'admin': return 'default';
      case 'write': return 'outline';
      case 'read': return 'secondary';
      case 'none': return 'destructive';
      default: return 'outline';
    }
  };

  if (!isManager) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            You don't have permission to manage role permissions.
          </p>
        </CardContent>
      </Card>
    );
  }

  const groupedPermissions = rolePermissions.reduce((acc, permission) => {
    const key = `${permission.role_name}-${permission.permission_category}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(permission);
    return acc;
  }, {} as Record<string, RolePermission[]>);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Advanced Role Management</h3>
        <p className="text-sm text-muted-foreground">
          Configure granular permissions for different user roles
        </p>
      </div>

      {/* Create Default Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Quick Setup
          </CardTitle>
          <CardDescription>
            Create default permission sets for standard roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {defaultRoles.map((role) => (
              <Button
                key={role}
                variant="outline"
                size="sm"
                onClick={() => createDefaultPermissions(role)}
                disabled={loading}
              >
                Setup {role.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add New Permission */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Permission
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input
                value={newPermission.role_name || ''}
                onChange={(e) => setNewPermission(prev => ({ ...prev, role_name: e.target.value }))}
                placeholder="e.g., manager"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newPermission.permission_category || ''}
                onValueChange={(value) => setNewPermission(prev => ({ ...prev, permission_category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {permissionCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Permission</Label>
              <Select
                value={newPermission.permission_name || ''}
                onValueChange={(value) => setNewPermission(prev => ({ ...prev, permission_name: value }))}
                disabled={!newPermission.permission_category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select permission" />
                </SelectTrigger>
                <SelectContent>
                  {newPermission.permission_category && 
                    permissionsByCategory[newPermission.permission_category as keyof typeof permissionsByCategory]?.map((permission) => (
                      <SelectItem key={permission} value={permission}>
                        {permission.replace('_', ' ')}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Access Level</Label>
              <Select
                value={newPermission.access_level || 'none'}
                onValueChange={(value) => setNewPermission(prev => ({ ...prev, access_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accessLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button 
              onClick={() => savePermission(newPermission)}
              disabled={loading || !newPermission.role_name || !newPermission.permission_category || !newPermission.permission_name}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Add Permission
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current Role Permissions
          </CardTitle>
          <CardDescription>
            Manage existing role-based permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading permissions...</p>
            </div>
          ) : Object.keys(groupedPermissions).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No permissions configured yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([key, permissions]) => {
                const [roleName, category] = key.split('-');
                return (
                  <div key={key} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">
                      {roleName.replace('_', ' ')} - {category}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <span className="text-sm">{permission.permission_name.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getAccessLevelColor(permission.access_level) as any}>
                              {permission.access_level}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingPermission(permission)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePermission(permission.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Permission Modal (simplified as inline form) */}
      {editingPermission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Permission
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingPermission(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Permission</Label>
                <Input
                  value={editingPermission.permission_name}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>Access Level</Label>
                <Select
                  value={editingPermission.access_level}
                  onValueChange={(value) => setEditingPermission(prev => prev ? { ...prev, access_level: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accessLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))
                  }</SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button 
                onClick={() => savePermission(editingPermission)}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
              <Button 
                variant="outline"
                onClick={() => setEditingPermission(null)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedRoleManagement;
