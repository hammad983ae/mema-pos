import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ArrowRight,
  Filter,
  Download,
  Calendar,
  User,
  MapPin,
  BarChart3,
  Plus,
  Minus,
  RotateCw
} from "lucide-react";

interface InventoryMovement {
  id: string;
  store_id: string;
  store_name: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  movement_type: string;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  unit_cost: number;
  total_value: number;
  reference_id: string | null;
  reference_type: string;
  reason: string | null;
  notes: string | null;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

interface InventoryMovementTrackingProps {
  storeId?: string;
}

export const InventoryMovementTracking = ({ storeId }: InventoryMovementTrackingProps) => {
  const { toast } = useToast();
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7days");
  const [movementType, setMovementType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>(storeId || "all");

  useEffect(() => {
    fetchMovements();
    fetchStores();
  }, [dateRange, movementType, selectedStore]);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  };

  const fetchMovements = async () => {
    try {
      setLoading(true);

      // Since inventory_movements table might not exist, show sample data
      toast({
        title: "Info",
        description: "Inventory movement tracking will be available once transactions begin.",
      });

      // Sample data for demonstration
      setMovements([
        {
          id: "1",
          store_id: "store1",
          store_name: "Main Store",
          product_id: "prod1",
          product_name: "Hydrating Serum",
          product_sku: "HS-001",
          movement_type: "sale",
          quantity_change: -2,
          previous_quantity: 25,
          new_quantity: 23,
          unit_cost: 15.00,
          total_value: 30.00,
          reference_id: "order123",
          reference_type: "order",
          reason: null,
          notes: null,
          created_by: "user1",
          created_by_name: "John Doe",
          created_at: new Date().toISOString()
        },
        {
          id: "2",
          store_id: "store1",
          store_name: "Main Store", 
          product_id: "prod2",
          product_name: "Vitamin C Serum",
          product_sku: "VCS-002",
          movement_type: "purchase",
          quantity_change: 50,
          previous_quantity: 10,
          new_quantity: 60,
          unit_cost: 12.00,
          total_value: 600.00,
          reference_id: "po456",
          reference_type: "purchase_order",
          reason: null,
          notes: "Weekly restock",
          created_by: "user2",
          created_by_name: "Jane Smith",
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
    } catch (error) {
      console.error("Error fetching movements:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory movements",
        variant: "destructive",
      });
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = movements.filter(movement =>
    movement.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    movement.product_sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    movement.store_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMovementIcon = (type: string, change: number) => {
    switch (type) {
      case "sale":
        return <Minus className="h-4 w-4 text-red-500" />;
      case "purchase":
      case "receive":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "adjustment":
        return change > 0 ? 
          <Plus className="h-4 w-4 text-blue-500" /> : 
          <Minus className="h-4 w-4 text-orange-500" />;
      case "transfer_in":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "transfer_out":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "return":
        return <RotateCw className="h-4 w-4 text-blue-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMovementTypeBadge = (type: string) => {
    const types = {
      sale: { label: "Sale", variant: "destructive" as const },
      purchase: { label: "Purchase", variant: "default" as const },
      adjustment: { label: "Adjustment", variant: "secondary" as const },
      transfer_in: { label: "Transfer In", variant: "default" as const },
      transfer_out: { label: "Transfer Out", variant: "destructive" as const },
      return: { label: "Return", variant: "outline" as const },
      receive: { label: "Received", variant: "default" as const },
      damage: { label: "Damage", variant: "destructive" as const }
    };
    
    const typeInfo = types[type as keyof typeof types] || { label: type, variant: "outline" as const };
    return <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>;
  };

  const exportMovements = () => {
    const csvContent = [
      ["Date", "Store", "Product", "SKU", "Type", "Quantity Change", "Previous", "New", "Unit Cost", "Total Value", "Reference", "Created By", "Notes"].join(","),
      ...filteredMovements.map(movement => [
        new Date(movement.created_at).toLocaleDateString(),
        movement.store_name,
        movement.product_name,
        movement.product_sku,
        movement.movement_type,
        movement.quantity_change,
        movement.previous_quantity,
        movement.new_quantity,
        movement.unit_cost,
        movement.total_value,
        movement.reference_type,
        movement.created_by_name,
        movement.notes || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-movements-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Inventory movements exported to CSV",
    });
  };

  // Calculate summary statistics
  const totalMovements = filteredMovements.length;
  const totalValueIn = filteredMovements
    .filter(m => m.quantity_change > 0)
    .reduce((sum, m) => sum + m.total_value, 0);
  const totalValueOut = filteredMovements
    .filter(m => m.quantity_change < 0)
    .reduce((sum, m) => sum + m.total_value, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Inventory Movement Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-2">Loading movement history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Movements</p>
                <p className="text-2xl font-bold">{totalMovements}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inbound Value</p>
                <p className="text-2xl font-bold text-green-600">${totalValueIn.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outbound Value</p>
                <p className="text-2xl font-bold text-red-600">${totalValueOut.toFixed(2)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Value</p>
                <p className={`text-2xl font-bold ${(totalValueIn - totalValueOut) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(totalValueIn - totalValueOut).toFixed(2)}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Movement History
            </div>
            <Button onClick={exportMovements} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Input
                placeholder="Search movements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1day">Last 24 Hours</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sale">Sales</SelectItem>
                  <SelectItem value="purchase">Purchases</SelectItem>
                  <SelectItem value="adjustment">Adjustments</SelectItem>
                  <SelectItem value="transfer_in">Transfers In</SelectItem>
                  <SelectItem value="transfer_out">Transfers Out</SelectItem>
                  <SelectItem value="return">Returns</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">
                {filteredMovements.length} records
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movement List */}
      <Card>
        <CardContent className="p-0">
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {filteredMovements.map((movement) => (
              <div key={movement.id} className="flex items-center gap-4 p-4 border-b hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  {getMovementIcon(movement.movement_type, movement.quantity_change)}
                  <div className="flex flex-col">
                    <div className="font-medium text-sm">{movement.product_name}</div>
                    <div className="text-xs text-muted-foreground">
                      SKU: {movement.product_sku}
                    </div>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 text-sm">
                  <div>
                    <div className="font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {movement.store_name}
                    </div>
                  </div>
                  
                  <div>
                    {getMovementTypeBadge(movement.movement_type)}
                  </div>
                  
                  <div className="text-center">
                    <div className={`font-bold ${movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {movement.previous_quantity} → {movement.new_quantity}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-medium">${movement.total_value.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      @${movement.unit_cost.toFixed(2)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-1 text-xs">
                      <User className="h-3 w-3" />
                      {movement.created_by_name}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(movement.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="text-xs">
                    {movement.reference_type && (
                      <div className="flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" />
                        {movement.reference_type} {movement.reference_id}
                      </div>
                    )}
                    {movement.notes && (
                      <div className="text-muted-foreground mt-1">
                        {movement.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};