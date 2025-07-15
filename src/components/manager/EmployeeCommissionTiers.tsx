import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Save, User, Percent, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface CommissionTier {
  id?: string;
  tier_number: number;
  target_amount: number;
  commission_rate: number;
  target_period: string;
  name: string;
  description?: string;
}

interface Employee {
  user_id: string;
  full_name: string;
  position_type: string;
}

interface EmployeeCommissionTiersProps {
  selectedEmployeeId: string | null;
  employees: Employee[];
  onEmployeeSelect: (employeeId: string | null) => void;
}

export const EmployeeCommissionTiers = ({ 
  selectedEmployeeId, 
  employees, 
  onEmployeeSelect 
}: EmployeeCommissionTiersProps) => {
  const [tiers, setTiers] = useState<CommissionTier[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const selectedEmployee = employees.find(e => e.user_id === selectedEmployeeId);

  useEffect(() => {
    if (selectedEmployeeId) {
      loadEmployeeTiers();
    } else {
      setTiers([]);
    }
  }, [selectedEmployeeId]);

  const loadEmployeeTiers = async () => {
    if (!selectedEmployeeId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('commission_tiers')
        .select('*')
        .eq('user_id', selectedEmployeeId)
        .order('target_amount');

      if (error) throw error;
      
      setTiers(data.map(tier => ({
        id: tier.id,
        tier_number: tier.tier_number,
        target_amount: tier.target_amount,
        commission_rate: tier.commission_rate,
        target_period: tier.target_period,
        name: tier.name,
        description: tier.description
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
      description: ''
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
    if (!selectedEmployeeId) return;

    setSaving(true);
    try {
      // Get business context
      const { data: businessData } = await supabase
        .from('user_business_memberships')
        .select('business_id')
        .eq('user_id', selectedEmployeeId)
        .single();

      if (!businessData) throw new Error('Could not find business context');

      // Delete existing tiers for this employee
      await supabase
        .from('commission_tiers')
        .delete()
        .eq('user_id', selectedEmployeeId);

      // Insert new tiers
      if (tiers.length > 0) {
        const tiersToInsert = tiers.map((tier, index) => ({
          business_id: businessData.business_id,
          user_id: selectedEmployeeId,
          tier_number: index + 1,
          target_amount: tier.target_amount,
          commission_rate: tier.commission_rate / 100, // Convert percentage to decimal
          target_period: tier.target_period,
          name: tier.name,
          description: tier.description,
          role_type: null, // Employee-specific tiers don't have role_type
          is_active: true
        }));

        const { error } = await supabase
          .from('commission_tiers')
          .insert(tiersToInsert);

        if (error) throw error;
      }

      toast({
        title: "Commission tiers saved",
        description: `Successfully updated commission structure for ${selectedEmployee?.full_name}`,
      });

      loadEmployeeTiers(); // Reload to get IDs
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
    <div className="space-y-6">
      {/* Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-success">
            <User className="h-5 w-5 mr-2" />
            Employee Commission Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="employee-select">Select Employee</Label>
              <Select value={selectedEmployeeId || ""} onValueChange={onEmployeeSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an employee to configure commission tiers..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.user_id} value={employee.user_id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{employee.full_name}</span>
                        <Badge variant="outline" className="ml-2 text-success border-success/30">
                          {employee.position_type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEmployee && (
              <div className="p-4 bg-success/5 rounded-lg border border-success/20">
                <p className="text-sm text-muted-foreground">
                  Configuring commission tiers for <strong>{selectedEmployee.full_name}</strong> ({selectedEmployee.position_type})
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Employee-specific tiers override default role-based commission rates
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Commission Tiers Configuration */}
      {selectedEmployeeId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-success">
                <Target className="h-5 w-5 mr-2" />
                Commission Tiers
              </CardTitle>
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
          </CardHeader>
          <CardContent>
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
                    <p className="text-sm">Add tiers to create a custom commission structure</p>
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
                        <div className="relative">
                          <Input
                            id={`commission-rate-${index}`}
                            type="number"
                            step="0.1"
                            value={tier.commission_rate}
                            onChange={(e) => updateTier(index, 'commission_rate', Number(e.target.value))}
                            placeholder="0"
                          />
                          <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
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

                      <div>
                        <Label htmlFor={`description-${index}`}>Description</Label>
                        <Input
                          id={`description-${index}`}
                          value={tier.description || ''}
                          onChange={(e) => updateTier(index, 'description', e.target.value)}
                          placeholder="Optional description"
                        />
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
                      onClick={() => loadEmployeeTiers()}
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

                {tiers.length > 0 && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2 text-success">How it works:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Employee will earn the highest commission rate based on their current {tiers[0]?.target_period || 'monthly'} sales</li>
                      <li>• Tiers are applied based on reaching the target amount (sales {">="} target)</li>
                      <li>• If no employee-specific tiers exist, default role-based rates apply</li>
                      <li>• Commission is calculated in real-time when orders are completed</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};