import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Minus, Plus, Search, AlertCircle, RefreshCw } from "lucide-react";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: {
    name: string;
    sku: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  total: number;
  payment_method: string;
  created_at: string;
  customer_id: string;
  customers?: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  order_items: OrderItem[];
}

interface RefundItem {
  orderItemId: string;
  productId: string;
  maxQuantity: number;
  refundQuantity: number;
  unitPrice: number;
  productName: string;
}

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefundComplete: () => void;
}

export const RefundModal = ({
  isOpen,
  onClose,
  onRefundComplete
}: RefundModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'search' | 'items' | 'confirm'>('search');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundItems, setRefundItems] = useState<RefundItem[]>([]);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('partial');
  const [reason, setReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Order[]>([]);

  const searchOrders = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      // Search by order number or customer phone
      let query = supabase
        .from("orders")
        .select(`
          *,
          customers(first_name, last_name, phone),
          order_items(
            id,
            product_id,
            quantity,
            unit_price,
            total_price,
            products(name, sku)
          )
        `)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(10);

      if (searchTerm.startsWith("ORD-")) {
        query = query.eq("order_number", searchTerm);
      } else {
        // Search by customer phone in related customers table
        const { data: customerData } = await supabase
          .from("customers")
          .select("id")
          .ilike("phone", `%${searchTerm}%`);
        
        if (customerData && customerData.length > 0) {
          const customerIds = customerData.map(c => c.id);
          query = query.in("customer_id", customerIds);
        } else {
          setSearchResults([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setSearchResults(data || []);
      
    } catch (error: any) {
      console.error("Error searching orders:", error);
      toast({
        title: "Search Error",
        description: "Failed to search orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectOrder = (order: Order) => {
    setSelectedOrder(order);
    
    // Initialize refund items
    const items: RefundItem[] = order.order_items.map(item => ({
      orderItemId: item.id,
      productId: item.product_id,
      maxQuantity: item.quantity,
      refundQuantity: 0,
      unitPrice: item.unit_price,
      productName: item.products.name
    }));
    
    setRefundItems(items);
    setStep('items');
  };

  const updateRefundQuantity = (orderItemId: string, quantity: number) => {
    setRefundItems(items =>
      items.map(item =>
        item.orderItemId === orderItemId
          ? { ...item, refundQuantity: Math.max(0, Math.min(quantity, item.maxQuantity)) }
          : item
      )
    );
  };

  const getTotalRefundAmount = () => {
    return refundItems.reduce((total, item) => 
      total + (item.refundQuantity * item.unitPrice), 0
    );
  };

  const getRefundableItems = () => {
    return refundItems.filter(item => item.refundQuantity > 0);
  };

  const processRefund = async () => {
    if (!user || !selectedOrder) return;
    
    const refundableItems = getRefundableItems();
    if (refundableItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select items to refund",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get user's business context
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id, businesses!inner(stores!inner(id))")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData?.businesses?.stores?.length) {
        throw new Error("No store found for user");
      }

      const storeId = membershipData.businesses.stores[0].id;
      const totalRefunded = getTotalRefundAmount();

      // Create refund record
      const { data: refundData, error: refundError } = await supabase
        .from("refunds")
        .insert({
          original_order_id: selectedOrder.id,
          store_id: storeId,
          user_id: user.id,
          customer_id: selectedOrder.customer_id,
          refund_type: refundType,
          reason: reason || null,
          total_refunded: totalRefunded,
          payment_method: paymentMethod,
          status: 'processed',
          processed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (refundError) throw refundError;

      // Create refund items
      const refundItemsData = refundableItems.map(item => ({
        refund_id: refundData.id,
        order_item_id: item.orderItemId,
        product_id: item.productId,
        quantity_refunded: item.refundQuantity,
        unit_price: item.unitPrice,
        total_refund_amount: item.refundQuantity * item.unitPrice
      }));

      const { error: itemsError } = await supabase
        .from("refund_items")
        .insert(refundItemsData);

      if (itemsError) throw itemsError;

      toast({
        title: "Refund Processed",
        description: `Refund ${refundData.refund_number} processed successfully`,
      });

      onRefundComplete();
      handleClose();

    } catch (error: any) {
      console.error("Refund error:", error);
      toast({
        title: "Refund Failed",
        description: error.message || "Failed to process refund",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('search');
    setSearchTerm("");
    setSelectedOrder(null);
    setRefundItems([]);
    setReason("");
    setSearchResults([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Process Refund
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            ← Back
          </Button>
        </DialogHeader>

        {step === 'search' && (
          <div className="space-y-4">
            <div>
              <Label>Search by Order Number or Customer Phone</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="ORD-20240101-0001 or (555) 123-4567"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchOrders()}
                />
                <Button onClick={searchOrders} disabled={loading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Search Results</h3>
                {searchResults.map((order) => (
                  <Card key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => selectOrder(order)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{order.order_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.customers 
                              ? `${order.customers.first_name} ${order.customers.last_name} - ${order.customers.phone}`
                              : "Walk-in Customer"
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${order.total.toFixed(2)}</div>
                          <Badge variant="outline">{order.payment_method}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 'items' && selectedOrder && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Refund Items - {selectedOrder.order_number}</h3>
                <p className="text-sm text-muted-foreground">
                  Select items and quantities to refund
                </p>
              </div>
              <Button variant="outline" onClick={() => setStep('search')}>
                Back to Search
              </Button>
            </div>

            <div className="space-y-3">
              {refundItems.map((item) => (
                <Card key={item.orderItemId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-muted-foreground">
                          ${item.unitPrice.toFixed(2)} each • Max: {item.maxQuantity}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateRefundQuantity(item.orderItemId, item.refundQuantity - 1)}
                          disabled={item.refundQuantity <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="w-8 text-center">{item.refundQuantity}</span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateRefundQuantity(item.orderItemId, item.refundQuantity + 1)}
                          disabled={item.refundQuantity >= item.maxQuantity}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        
                        <div className="w-20 text-right font-medium">
                          ${(item.refundQuantity * item.unitPrice).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            <div className="flex justify-between items-center font-medium text-lg">
              <span>Total Refund:</span>
              <span>${getTotalRefundAmount().toFixed(2)}</span>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('search')} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={() => setStep('confirm')}
                disabled={getRefundableItems().length === 0}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Confirm Refund</h3>
              <Button variant="outline" onClick={() => setStep('items')}>
                Back
              </Button>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Order:</span>
                    <span>{selectedOrder?.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Items:</span>
                    <span>{getRefundableItems().length}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Refund Amount:</span>
                    <span>${getTotalRefundAmount().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <Label>Refund Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash">Cash</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card">Original Payment Method</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Reason for Refund</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional reason..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('items')} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={processRefund}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Processing..." : "Process Refund"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};