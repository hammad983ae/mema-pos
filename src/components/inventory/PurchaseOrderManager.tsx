import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, 
  Package, 
  Plus, 
  Edit, 
  Check,
  X,
  Clock,
  Truck,
  FileText,
  Search,
  Download,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  store_id: string;
  status: string;
  order_date: string;
  expected_date?: string;
  received_date?: string;
  total_amount?: number;
  notes?: string;
  suppliers: { name: string; email?: string };
  stores: { name: string };
  purchase_order_items: PurchaseOrderItem[];
}

interface PurchaseOrderItem {
  id: string;
  product_id: string;
  quantity_ordered: number;
  quantity_received?: number;
  unit_cost: number;
  total_cost: number;
  products: { name: string; sku: string };
}

interface AutoReorderRule {
  id: string;
  product_id: string;
  supplier_id: string;
  reorder_point: number;
  reorder_quantity: number;
  is_active: boolean;
  products: { name: string; sku: string };
  suppliers: { name: string };
}

export const PurchaseOrderManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [autoReorderRules, setAutoReorderRules] = useState<AutoReorderRule[]>([]);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  
  const [poForm, setPOForm] = useState({
    supplier_id: '',
    store_id: '',
    expected_date: '',
    notes: '',
    items: [] as Array<{
      product_id: string;
      quantity: number;
      unit_cost: number;
    }>
  });

  const [receiveForm, setReceiveForm] = useState({
    items: [] as Array<{
      id: string;
      quantity_received: number;
    }>
  });

  const statusColors = {
    'pending': 'default',
    'ordered': 'secondary',
    'partial': 'warning',
    'received': 'success',
    'cancelled': 'destructive'
  };

  useEffect(() => {
    loadPurchaseOrders();
    loadSuppliers();
    loadProducts();
    loadAutoReorderRules();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      
      const { data: userContext } = await supabase.rpc('get_user_business_context', {
        user_uuid: user?.id
      });

      if (!userContext || userContext.length === 0) return;

      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers(name, email),
          stores!inner(name, business_id),
          purchase_order_items(
            *,
            products(name, sku)
          )
        `)
        .eq('stores.business_id', userContext[0].business_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchaseOrders(data || []);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadAutoReorderRules = async () => {
    try {
      // Mock data for now - auto reorder table not yet created
      const mockRules: AutoReorderRule[] = [
        {
          id: '1',
          product_id: 'prod-1',
          supplier_id: 'supp-1',
          reorder_point: 10,
          reorder_quantity: 50,
          is_active: true,
          products: { name: 'Sample Product', sku: 'SKU001' },
          suppliers: { name: 'Sample Supplier' }
        }
      ];
      setAutoReorderRules(mockRules);
    } catch (error) {
      console.error('Error loading auto reorder rules:', error);
    }
  };

  const handleCreatePO = async () => {
    try {
      if (!poForm.supplier_id || poForm.items.length === 0) {
        toast({
          title: "Error",
          description: "Please select a supplier and add items",
          variant: "destructive",
        });
        return;
      }

      const { data: userContext } = await supabase.rpc('get_user_business_context', {
        user_uuid: user?.id
      });

      if (!userContext || userContext.length === 0) return;

      // Generate PO number
      const { data: poNumber } = await supabase.rpc('generate_po_number');

      const totalAmount = poForm.items.reduce((sum, item) => 
        sum + (item.quantity * item.unit_cost), 0);

      // Create purchase order
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          po_number: poNumber,
          supplier_id: poForm.supplier_id,
          store_id: poForm.store_id || userContext[0].store_ids[0],
          status: 'pending',
          expected_date: poForm.expected_date || null,
          total_amount: totalAmount,
          notes: poForm.notes || null
        })
        .select()
        .single();

      if (poError) throw poError;

      // Create purchase order items
      const items = poForm.items.map(item => ({
        purchase_order_id: po.id,
        product_id: item.product_id,
        quantity_ordered: item.quantity,
        unit_cost: item.unit_cost,
        total_cost: item.quantity * item.unit_cost
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(items);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: `Purchase order ${poNumber} created successfully`,
      });

      setIsCreateDialogOpen(false);
      setPOForm({
        supplier_id: '',
        store_id: '',
        expected_date: '',
        notes: '',
        items: []
      });
      
      loadPurchaseOrders();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create purchase order",
        variant: "destructive",
      });
    }
  };

  const handleReceiveItems = async () => {
    if (!selectedPO) return;

    try {
      // Update purchase order items with received quantities
      const updates = receiveForm.items.map(item => 
        supabase
          .from('purchase_order_items')
          .update({ quantity_received: item.quantity_received })
          .eq('id', item.id)
      );

      await Promise.all(updates);

      // Check if all items are fully received
      const allItemsReceived = selectedPO.purchase_order_items.every(item => {
        const receivedItem = receiveForm.items.find(r => r.id === item.id);
        const receivedQty = receivedItem?.quantity_received || item.quantity_received || 0;
        return receivedQty >= item.quantity_ordered;
      });

      // Update PO status
      const newStatus = allItemsReceived ? 'received' : 'partial';
      const updateData: any = { status: newStatus };
      
      if (allItemsReceived) {
        updateData.received_date = new Date().toISOString();
      }

      await supabase
        .from('purchase_orders')
        .update(updateData)
        .eq('id', selectedPO.id);

      // Update inventory levels
      for (const item of receiveForm.items) {
        if (item.quantity_received > 0) {
          const poItem = selectedPO.purchase_order_items.find(p => p.id === item.id);
          if (poItem) {
            // Find inventory record and update
            const { data: inventory } = await supabase
              .from('inventory')
              .select('*')
              .eq('product_id', poItem.product_id)
              .eq('store_id', selectedPO.store_id)
              .single();

            if (inventory) {
              await supabase
                .from('inventory')
                .update({
                  quantity_on_hand: inventory.quantity_on_hand + item.quantity_received
                })
                .eq('id', inventory.id);
            }
          }
        }
      }

      toast({
        title: "Success",
        description: "Items received and inventory updated",
      });

      setIsReceiveDialogOpen(false);
      setSelectedPO(null);
      setReceiveForm({ items: [] });
      
      loadPurchaseOrders();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to receive items",
        variant: "destructive",
      });
    }
  };

  const addItemToPO = () => {
    setPOForm(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1, unit_cost: 0 }]
    }));
  };

  const removeItemFromPO = (index: number) => {
    setPOForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updatePOItem = (index: number, field: string, value: any) => {
    setPOForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const prepareReceiveForm = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setReceiveForm({
      items: po.purchase_order_items.map(item => ({
        id: item.id,
        quantity_received: item.quantity_received || 0
      }))
    });
    setIsReceiveDialogOpen(true);
  };

  const getTotalPOValue = () => {
    return poForm.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_cost), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Purchase Order Manager</h2>
          <p className="text-muted-foreground">Create and manage purchase orders with automated workflows</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Purchase Order
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending Deliveries</TabsTrigger>
          <TabsTrigger value="automation">Auto Reorder</TabsTrigger>
        </TabsList>

        {/* Purchase Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="grid gap-4">
            {purchaseOrders.map((po) => (
              <Card key={po.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{po.po_number}</h3>
                          <Badge variant={statusColors[po.status as keyof typeof statusColors] as any}>
                            {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Supplier: {po.suppliers?.name}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <span>Items: {po.purchase_order_items?.length || 0}</span>
                          {po.total_amount && (
                            <span>Total: ${po.total_amount.toFixed(2)}</span>
                          )}
                          <span>Ordered: {new Date(po.order_date).toLocaleDateString()}</span>
                          {po.expected_date && (
                            <span>Expected: {new Date(po.expected_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {po.status === 'pending' || po.status === 'ordered' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => prepareReceiveForm(po)}
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Receive
                        </Button>
                      ) : null}
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {purchaseOrders.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">No Purchase Orders</h3>
                  <p className="text-muted-foreground">Create your first purchase order to get started</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Pending Deliveries Tab */}
        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4">
            {purchaseOrders
              .filter(po => po.status === 'ordered' || po.status === 'partial')
              .map((po) => (
                <Card key={po.id} className="border-l-4 border-l-warning">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Clock className="h-8 w-8 text-warning" />
                        <div>
                          <h4 className="font-medium">{po.po_number}</h4>
                          <p className="text-sm text-muted-foreground">
                            Expected: {po.expected_date ? new Date(po.expected_date).toLocaleDateString() : 'TBD'}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary">
                              {po.status === 'partial' ? 'Partially Received' : 'Awaiting Delivery'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => prepareReceiveForm(po)}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Receive Items
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Auto Reorder Tab */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Reordering</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Set up automatic reorder rules to maintain optimal stock levels
              </p>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Reorder Rule
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Purchase Order Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select
                  value={poForm.supplier_id}
                  onValueChange={(value) => setPOForm(prev => ({ ...prev, supplier_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Delivery Date</Label>
                <Input
                  type="date"
                  value={poForm.expected_date}
                  onChange={(e) => setPOForm(prev => ({ ...prev, expected_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Order Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItemToPO}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {poForm.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Select
                      value={item.product_id}
                      onValueChange={(value) => updatePOItem(index, 'product_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {product.sku}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updatePOItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Unit Cost"
                      value={item.unit_cost}
                      onChange={(e) => updatePOItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={`$${(item.quantity * item.unit_cost).toFixed(2)}`}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItemFromPO(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {poForm.items.length > 0 && (
                <div className="text-right">
                  <p className="text-lg font-medium">
                    Total: ${getTotalPOValue().toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={poForm.notes}
                onChange={(e) => setPOForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Order notes or special instructions"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePO}>
                Create Purchase Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receive Items Dialog */}
      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Receive Items - {selectedPO?.po_number}</DialogTitle>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-4">
              <div className="space-y-4">
                {selectedPO.purchase_order_items.map((item, index) => {
                  const receiveItem = receiveForm.items.find(r => r.id === item.id);
                  return (
                    <div key={item.id} className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg">
                      <div className="col-span-5">
                        <h4 className="font-medium">{item.products.name}</h4>
                        <p className="text-sm text-muted-foreground">SKU: {item.products.sku}</p>
                      </div>
                      <div className="col-span-2 text-center">
                        <p className="text-sm text-muted-foreground">Ordered</p>
                        <p className="font-medium">{item.quantity_ordered}</p>
                      </div>
                      <div className="col-span-2 text-center">
                        <p className="text-sm text-muted-foreground">Previously</p>
                        <p className="font-medium">{item.quantity_received || 0}</p>
                      </div>
                      <div className="col-span-3">
                        <Label>Receiving Now</Label>
                        <Input
                          type="number"
                          min="0"
                          max={item.quantity_ordered - (item.quantity_received || 0)}
                          value={receiveItem?.quantity_received || 0}
                          onChange={(e) => {
                            const newItems = receiveForm.items.map(r => 
                              r.id === item.id 
                                ? { ...r, quantity_received: parseInt(e.target.value) || 0 }
                                : r
                            );
                            setReceiveForm({ items: newItems });
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsReceiveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleReceiveItems}>
                  Update Inventory
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};