import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Save, DollarSign, Target, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EmployeeCommissionTiers } from "@/components/manager/EmployeeCommissionTiers";

interface CommissionTier {
  id?: string;
  tier_number: number;
  target_amount: number;
  commission_rate: number;
  target_period: string;
  name: string;
  description?: string;
  role_type: string;
}

interface Employee {
  user_id: string;
  full_name: string;
  position_type: string;
}

export const CommissionStructure = () => {
  const [tiers, setTiers] = useState<CommissionTier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCommissionTiers();
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const { data: businessData } = await supabase
        .from('user_business_memberships')
        .select('business_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!businessData) return;

      const { data, error } = await supabase
        .from('user_business_memberships')
        .select(`
          user_id,
          profiles!inner(
            full_name,
            position_type
          )
        `)
        .eq('business_id', businessData.business_id)
        .eq('is_active', true)
        .neq('role', 'business_owner');

      if (error) throw error;

      const employeesList = data.map((item: any) => ({
        user_id: item.user_id,
        full_name: item.profiles?.full_name || 'Unknown',
        position_type: item.profiles?.position_type || 'employee'
      }));

      setEmployees(employeesList);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadCommissionTiers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('commission_tiers')
        .select('*')
        .is('user_id', null) // Only load role-based tiers
        .order('role_type, tier_number');

      if (error) throw error;
      
      setTiers(data.map(tier => ({
        id: tier.id,
        tier_number: tier.tier_number,
        target_amount: tier.target_amount,
        commission_rate: tier.commission_rate * 100, // Convert to percentage for display
        target_period: tier.target_period,
        name: tier.name,
        description: tier.description,
        role_type: tier.role_type
      })));
    } catch (error) {
      toast({
        title: "Error loading commission tiers",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTier = () => {
    const newTier: CommissionTier = {
      tier_number: tiers.length + 1,
      target_amount: 0,
      commission_rate: 0,
      target_period: 'monthly',
      name: `Tier ${tiers.length + 1}`,
      description: '',
      role_type: 'opener'
    };
    setTiers([...tiers, newTier]);
  };

  const updateTier = (index: number, field: keyof CommissionTier, value: any) => {
    const updatedTiers = [...tiers];
    updatedTiers[index] = { ...updatedTiers[index], [field]: value };
    setTiers(updatedTiers);
  };

  const removeTier = (index: number) => {
    const updatedTiers = tiers.filter((_, i) => i !== index);
    setTiers(updatedTiers);
  };

  const saveTiers = async () => {
    setSaving(true);
    try {
      // Get business context
      const { data: businessData } = await supabase
        .from('user_business_memberships')
        .select('business_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!businessData) throw new Error('Could not find business context');

      // Delete existing role-based tiers
      await supabase
        .from('commission_tiers')
        .delete()
        .eq('business_id', businessData.business_id)
        .is('user_id', null);

      // Insert new tiers
      if (tiers.length > 0) {
        const tiersToInsert = tiers.map((tier, index) => ({
          business_id: businessData.business_id,
          tier_number: index + 1,
          target_amount: tier.target_amount,
          commission_rate: tier.commission_rate / 100, // Convert percentage to decimal
          target_period: tier.target_period,
          name: tier.name,
          description: tier.description,
          role_type: tier.role_type,
          user_id: null, // Role-based tiers don't have user_id
          is_active: true
        }));

        const { error } = await supabase
          .from('commission_tiers')
          .insert(tiersToInsert);

        if (error) throw error;
      }

      toast({
        title: "Commission tiers saved",
        description: "Successfully updated role-based commission structure",
      });

      loadCommissionTiers(); // Reload to get IDs
    } catch (error) {
      toast({
        title: "Error saving commission tiers",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-success">
          <DollarSign className="h-5 w-5 mr-2" />
          Commission Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="role-based" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="role-based" className="flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Role-Based Tiers
            </TabsTrigger>
            <TabsTrigger value="employee-specific" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Employee-Specific
            </TabsTrigger>
          </TabsList>

          <TabsContent value="role-based" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-success">Default Role-Based Commission Tiers</h3>
                  <p className="text-sm text-muted-foreground">
                    These tiers apply to all employees unless they have individual tier overrides
                  </p>
                </div>
                <Button 
                  onClick={addTier} 
                  variant="outline" 
                  size="sm"
                  className="border-success/30 text-success hover:bg-success/5"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-success border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading commission tiers...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tiers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No commission tiers configured</p>
                      <p className="text-sm">Add tiers to create a commission structure</p>
                    </div>
                  ) : (
                    tiers.map((tier, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border border-success/20 rounded-lg bg-success/5">
                        <div>
                          <Label htmlFor={`tier-name-${index}`}>Tier Name</Label>
                          <Input
                            id={`tier-name-${index}`}
                            value={tier.name}
                            onChange={(e) => updateTier(index, 'name', e.target.value)}
                            placeholder="e.g. Base Rate"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`role-type-${index}`}>Role Type</Label>
                          <Select 
                            value={tier.role_type} 
                            onValueChange={(value) => updateTier(index, 'role_type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="opener">Opener</SelectItem>
                              <SelectItem value="upseller">Upseller</SelectItem>
                              <SelectItem value="general">General</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor={`target-amount-${index}`}>Target Amount ($)</Label>
                          <Input
                            id={`target-amount-${index}`}
                            type="number"
                            value={tier.target_amount}
                            onChange={(e) => updateTier(index, 'target_amount', Number(e.target.value))}
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`commission-rate-${index}`}>Commission (%)</Label>
                          <Input
                            id={`commission-rate-${index}`}
                            type="number"
                            step="0.1"
                            value={tier.commission_rate}
                            onChange={(e) => updateTier(index, 'commission_rate', Number(e.target.value))}
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`target-period-${index}`}>Period</Label>
                          <Select 
                            value={tier.target_period} 
                            onValueChange={(value) => updateTier(index, 'target_period', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-end">
                          <Button
                            onClick={() => removeTier(index)}
                            variant="outline"
                            size="sm"
                            className="w-full border-destructive/30 text-destructive hover:bg-destructive/5"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}

                  {tiers.length > 0 && (
                    <div className="flex justify-end space-x-2 pt-4 border-t border-success/20">
                      <Button
                        onClick={() => loadCommissionTiers()}
                        variant="outline"
                        disabled={loading}
                      >
                        Reset Changes
                      </Button>
                      <Button
                        onClick={saveTiers}
                        disabled={saving}
                        className="bg-success hover:bg-success/90 text-success-foreground"
                      >
                        {saving ? (
                          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Tiers
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="employee-specific" className="mt-6">
            <EmployeeCommissionTiers 
              selectedEmployeeId={selectedEmployeeId}
              employees={employees}
              onEmployeeSelect={setSelectedEmployeeId}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};