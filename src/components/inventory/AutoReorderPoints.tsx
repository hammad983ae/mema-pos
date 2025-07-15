import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  AlertTriangle, 
  Settings, 
  Save, 
  Package, 
  ShoppingCart,
  TrendingDown,
  Bell,
  Plus,
  Edit,
  Trash2
} from "lucide-react";

interface ReorderRule {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  store_id: string;
  store_name: string;
  reorder_point: number;
  reorder_quantity: number;
  preferred_supplier_id: string;
  preferred_supplier_name: string;
  auto_generate_po: boolean;
  is_active: boolean;
  last_triggered: string | null;
}

interface AutoReorderPointsProps {
  storeId: string;
}

export const AutoReorderPoints = ({ storeId }: AutoReorderPointsProps) => {
  const { toast } = useToast();
  const [reorderRules, setReorderRules] = useState<ReorderRule[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string>('');
  const [newRule, setNewRule] = useState({
    product_id: '',
    store_id: storeId,
    reorder_point: 10,
    reorder_quantity: 50,
    preferred_supplier_id: '',
    auto_generate_po: true
  });

  useEffect(() => {
    fetchData();
    setupRealtimeMonitoring();
  }, [storeId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get business context first
      const { data: userContext } = await supabase.rpc('get_user_business_context');
      if (userContext && userContext.length > 0) {
        setBusinessId(userContext[0].business_id);
      }
      
      // Fetch reorder rules - handle gracefully if table doesn't exist yet
      const { data: rulesData, error: rulesError } = await supabase
        .from("inventory_reorder_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (rulesError) {
        console.log("Rules error:", rulesError);
        setReorderRules([]);
      } else {
        const transformedRules: ReorderRule[] = rulesData?.map(rule => ({
          id: rule.id,
          product_id: rule.product_id,
          product_name: 'Product',
          product_sku: 'N/A',
          store_id: rule.store_id,
          store_name: 'Store',
          reorder_point: rule.reorder_point,
          reorder_quantity: rule.reorder_quantity,
          preferred_supplier_id: rule.preferred_supplier_id,
          preferred_supplier_name: 'Supplier',
          auto_generate_po: rule.auto_generate_po,
          is_active: rule.is_active,
          last_triggered: rule.last_triggered
        })) || [];
        setReorderRules(transformedRules);
      }

      // Fetch products with explicit typing
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select<any, any>("id, name, sku")
        .eq("is_active", true)
        .order("name");

      if (productsError) {
        console.log("Products error:", productsError);
        setProducts([]);
      } else {
        setProducts(productsData || []);
      }

      // Fetch suppliers with simple query
      try {
        const suppliersResult = await supabase
          .from("suppliers")
          .select("id, name");
        
        if (suppliersResult.error) {
          console.log("Suppliers error:", suppliersResult.error);
          setSuppliers([]);
        } else {
          setSuppliers(suppliersResult.data || []);
        }
      } catch (e) {
        console.log("Suppliers fetch error:", e);
        setSuppliers([]);
      }

      // Fetch stores
      const { data: storesData, error: storesError } = await supabase
        .from("stores")
        .select("id, name")
        .order("name");

      if (storesError) {
        console.log("Stores error:", storesError);
        setStores([]);
      } else {
        setStores(storesData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load reorder rules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeMonitoring = () => {
    // Monitor inventory changes that might trigger reorder points
    const channel = supabase
      .channel('reorder-monitoring')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inventory'
        },
        async (payload) => {
          const { new: newRecord } = payload;
          await checkReorderTriggers(newRecord);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const checkReorderTriggers = async (inventoryRecord: any) => {
    const { store_id, product_id, quantity_on_hand } = inventoryRecord;

    // Find applicable reorder rule
    const rule = reorderRules.find(r => 
      r.store_id === store_id && 
      r.product_id === product_id && 
      r.is_active
    );

    if (rule && quantity_on_hand <= rule.reorder_point) {
      await triggerReorder(rule, quantity_on_hand);
    }
  };

  const triggerReorder = async (rule: ReorderRule, currentStock: number) => {
    try {
      // Update last triggered time
      await supabase
        .from("inventory_reorder_rules")
        .update({ last_triggered: new Date().toISOString() })
        .eq("id", rule.id);

      toast({
        title: "Reorder Triggered",
        description: `${rule.product_name} has reached reorder point. ${rule.auto_generate_po ? 'Purchase order should be created manually.' : 'Manual review needed.'}`,
      });
    } catch (error) {
      console.error("Error triggering reorder:", error);
    }
  };

  const saveRule = async () => {
    try {
      const { error } = await supabase
        .from("inventory_reorder_rules")
        .insert({
          ...newRule,
          business_id: businessId,
          is_active: true
        });

      if (error) throw error;

      await fetchData();
      setNewRule({
        product_id: '',
        store_id: storeId,
        reorder_point: 10,
        reorder_quantity: 50,
        preferred_supplier_id: '',
        auto_generate_po: true
      });

      toast({
        title: "Rule Created",
        description: "Reorder rule has been created successfully",
      });
    } catch (error) {
      console.error("Error saving rule:", error);
      toast({
        title: "Error",
        description: "Failed to create reorder rule",
        variant: "destructive",
      });
    }
  };

  const updateRule = async (ruleId: string, updates: Partial<ReorderRule>) => {
    try {
      const { error } = await supabase
        .from("inventory_reorder_rules")
        .update(updates)
        .eq("id", ruleId);

      if (error) throw error;

      await fetchData();
      setIsEditing(null);

      toast({
        title: "Rule Updated",
        description: "Reorder rule has been updated successfully",
      });
    } catch (error) {
      console.error("Error updating rule:", error);
      toast({
        title: "Error",
        description: "Failed to update reorder rule",
        variant: "destructive",
      });
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from("inventory_reorder_rules")
        .delete()
        .eq("id", ruleId);

      if (error) throw error;

      await fetchData();

      toast({
        title: "Rule Deleted",
        description: "Reorder rule has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting rule:", error);
      toast({
        title: "Error",
        description: "Failed to delete reorder rule",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Automatic Reorder Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-2">Loading reorder rules...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Rule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Reorder Rule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select
                value={newRule.product_id}
                onValueChange={(value) => setNewRule(prev => ({ ...prev, product_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Store</Label>
              <Select
                value={newRule.store_id}
                onValueChange={(value) => setNewRule(prev => ({ ...prev, store_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Preferred Supplier</Label>
              <Select
                value={newRule.preferred_supplier_id}
                onValueChange={(value) => setNewRule(prev => ({ ...prev, preferred_supplier_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reorder Point</Label>
              <Input
                type="number"
                value={newRule.reorder_point}
                onChange={(e) => setNewRule(prev => ({ ...prev, reorder_point: parseInt(e.target.value) || 0 }))}
                placeholder="Minimum stock level"
              />
            </div>

            <div className="space-y-2">
              <Label>Reorder Quantity</Label>
              <Input
                type="number"
                value={newRule.reorder_quantity}
                onChange={(e) => setNewRule(prev => ({ ...prev, reorder_quantity: parseInt(e.target.value) || 0 }))}
                placeholder="Quantity to order"
              />
            </div>

            <div className="space-y-2">
              <Label>Auto Generate PO</Label>
              <div className="flex items-center space-x-2 pt-3">
                <Switch
                  checked={newRule.auto_generate_po}
                  onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, auto_generate_po: checked }))}
                />
                <span className="text-sm text-muted-foreground">
                  Automatically create purchase orders
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button 
              onClick={saveRule}
              disabled={!newRule.product_id || !newRule.preferred_supplier_id}
            >
              <Save className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Reorder Rules ({reorderRules.length})
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Bell className="h-3 w-3" />
              {reorderRules.filter(r => r.is_active).length} Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reorderRules.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">{rule.product_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {rule.store_name} • SKU: {rule.product_sku}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(isEditing === rule.id ? null : rule.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isEditing === rule.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="text-xs">Reorder Point</Label>
                      <Input
                        type="number"
                        defaultValue={rule.reorder_point}
                        className="mt-1"
                        onChange={(e) => {
                          rule.reorder_point = parseInt(e.target.value) || 0;
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Reorder Quantity</Label>
                      <Input
                        type="number"
                        defaultValue={rule.reorder_quantity}
                        className="mt-1"
                        onChange={(e) => {
                          rule.reorder_quantity = parseInt(e.target.value) || 0;
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Auto Generate PO</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Switch
                          checked={rule.auto_generate_po}
                          onCheckedChange={(checked) => {
                            rule.auto_generate_po = checked;
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button
                        size="sm"
                        onClick={() => updateRule(rule.id, {
                          reorder_point: rule.reorder_point,
                          reorder_quantity: rule.reorder_quantity,
                          auto_generate_po: rule.auto_generate_po
                        })}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Reorder Point:</span>
                      <div className="font-medium">{rule.reorder_point} units</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reorder Quantity:</span>
                      <div className="font-medium">{rule.reorder_quantity} units</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Supplier:</span>
                      <div className="font-medium">{rule.preferred_supplier_name}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Auto PO:</span>
                      <div className={`font-medium ${rule.auto_generate_po ? 'text-green-600' : 'text-orange-600'}`}>
                        {rule.auto_generate_po ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                  </div>
                )}

                {rule.last_triggered && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Last triggered: {new Date(rule.last_triggered).toLocaleString()}
                  </div>
                )}
              </div>
            ))}

            {reorderRules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No reorder rules configured yet.</p>
                <p className="text-sm">Create rules above to automate inventory reordering.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
