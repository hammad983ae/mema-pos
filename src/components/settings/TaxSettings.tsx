import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Settings, Percent, Calculator } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  description?: string;
  is_active: boolean;
  is_compound: boolean;
  sort_order: number;
}

interface TaxExemption {
  id: string;
  exemption_type: string;
  entity_id: string;
  exemption_reason?: string;
  is_active: boolean;
  tax_rate?: TaxRate;
}

export const TaxSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [exemptions, setExemptions] = useState<TaxExemption[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRate, setEditingRate] = useState<TaxRate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    rate: "",
    description: "",
    is_active: true,
    is_compound: false,
    sort_order: 0
  });

  useEffect(() => {
    fetchTaxRates();
    fetchTaxExemptions();
  }, []);

  const fetchTaxRates = async () => {
    try {
      const { data, error } = await supabase
        .from("tax_rates")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setTaxRates(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load tax rates",
        variant: "destructive",
      });
    }
  };

  const fetchTaxExemptions = async () => {
    try {
      const { data, error } = await supabase
        .from("tax_exemptions")
        .select(`
          *,
          tax_rate:tax_rates(*)
        `)
        .eq("is_active", true);

      if (error) throw error;
      setExemptions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load tax exemptions",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const rateValue = parseFloat(formData.rate) / 100; // Convert percentage to decimal
      
      // Get user's business context
      const { data: userBusiness } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!userBusiness?.business_id) {
        throw new Error("Business context not found");
      }
      
      const taxRateData = {
        business_id: userBusiness.business_id,
        name: formData.name,
        rate: rateValue,
        description: formData.description || null,
        is_active: formData.is_active,
        is_compound: formData.is_compound,
        sort_order: formData.sort_order,
        created_by: user.id
      };

      if (editingRate) {
        const { error } = await supabase
          .from("tax_rates")
          .update(taxRateData)
          .eq("id", editingRate.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Tax rate updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("tax_rates")
          .insert([taxRateData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Tax rate created successfully",
        });
      }

      resetForm();
      fetchTaxRates();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save tax rate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rate: TaxRate) => {
    setEditingRate(rate);
    setFormData({
      name: rate.name,
      rate: (rate.rate * 100).toString(), // Convert decimal to percentage
      description: rate.description || "",
      is_active: rate.is_active,
      is_compound: rate.is_compound,
      sort_order: rate.sort_order
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tax rate?")) return;

    try {
      const { error } = await supabase
        .from("tax_rates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Tax rate deleted successfully",
      });
      fetchTaxRates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tax rate",
        variant: "destructive",
      });
    }
  };

  const toggleTaxRate = async (rate: TaxRate) => {
    try {
      const { error } = await supabase
        .from("tax_rates")
        .update({ is_active: !rate.is_active })
        .eq("id", rate.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Tax rate ${!rate.is_active ? 'activated' : 'deactivated'}`,
      });
      fetchTaxRates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update tax rate status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      rate: "",
      description: "",
      is_active: true,
      is_compound: false,
      sort_order: 0
    });
    setEditingRate(null);
  };

  const calculateTotalTaxRate = () => {
    const activeTaxRates = taxRates.filter(rate => rate.is_active);
    const simpleTaxes = activeTaxRates.filter(rate => !rate.is_compound);
    const compoundTaxes = activeTaxRates.filter(rate => rate.is_compound);
    
    // Calculate simple taxes
    const simpleTaxTotal = simpleTaxes.reduce((sum, rate) => sum + rate.rate, 0);
    
    // Calculate compound taxes (applied on top of simple taxes)
    let compoundTaxTotal = 0;
    if (compoundTaxes.length > 0) {
      const baseAmount = 1 + simpleTaxTotal; // Base amount with simple taxes
      compoundTaxTotal = compoundTaxes.reduce((sum, rate) => sum + (baseAmount * rate.rate), 0);
    }
    
    return (simpleTaxTotal + compoundTaxTotal) * 100; // Convert to percentage
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Tax Configuration
          </h2>
          <p className="text-muted-foreground">
            Configure tax rates and exemptions for your business
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tax Rate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRate ? "Edit Tax Rate" : "Add New Tax Rate"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Tax Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Sales Tax, State Tax, VAT"
                  required
                />
              </div>

              <div>
                <Label htmlFor="rate">Tax Rate (%)</Label>
                <div className="relative">
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
                    placeholder="8.25"
                    required
                  />
                  <Percent className="h-4 w-4 absolute right-3 top-3 text-muted-foreground" />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details about this tax rate"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_compound"
                  checked={formData.is_compound}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_compound: checked }))}
                />
                <Label htmlFor="is_compound">Compound Tax</Label>
                <span className="text-sm text-muted-foreground">
                  (Applied on top of other taxes)
                </span>
              </div>

              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingRate ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tax Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Tax Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {taxRates.filter(rate => rate.is_active).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Tax Rates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {calculateTotalTaxRate().toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground">Total Tax Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {exemptions.length}
              </div>
              <div className="text-sm text-muted-foreground">Active Exemptions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{rate.name}</div>
                      {rate.description && (
                        <div className="text-sm text-muted-foreground">
                          {rate.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{(rate.rate * 100).toFixed(2)}%</TableCell>
                  <TableCell>
                    <Badge variant={rate.is_compound ? "secondary" : "outline"}>
                      {rate.is_compound ? "Compound" : "Simple"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rate.is_active ? "default" : "secondary"}>
                      {rate.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(rate)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleTaxRate(rate)}
                      >
                        <Switch checked={rate.is_active} className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(rate.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {taxRates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No tax rates configured. Add your first tax rate to get started.
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};