import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProductInventory } from "@/components/inventory/ProductInventory";
import { StockAlerts } from "@/components/inventory/StockAlerts";
import { SupplierManagement } from "@/components/inventory/SupplierManagement";
import { InventoryReports } from "@/components/inventory/InventoryReports";
import { SmartInventoryManager } from "@/components/inventory/SmartInventoryManager";
import { PurchaseOrderManager } from "@/components/inventory/PurchaseOrderManager";
import { 
  Package, 
  AlertTriangle, 
  Search, 
  Plus, 
  Download, 
  Upload,
  Truck,
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface InventoryStats {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
}

const Inventory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0
  });

  useEffect(() => {
    if (user) {
      fetchInventoryStats();
    }
  }, [user]);

  const fetchInventoryStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's business context to filter by stores
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (!membershipData) {
        throw new Error("User not associated with any business");
      }

      // Fetch inventory data with product information
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory")
        .select(`
          *,
          products!inner(name, price, cost, is_active),
          stores!inner(business_id)
        `)
        .eq("stores.business_id", membershipData.business_id)
        .eq("products.is_active", true);

      if (inventoryError) throw inventoryError;

      // Calculate stats
      const totalProducts = inventoryData?.length || 0;
      const lowStockItems = inventoryData?.filter(item => 
        item.quantity_on_hand <= (item.low_stock_threshold || 10)
      ).length || 0;
      const outOfStockItems = inventoryData?.filter(item => 
        item.quantity_on_hand === 0
      ).length || 0;
      
      const totalValue = inventoryData?.reduce((sum, item) => {
        const cost = item.products?.cost || item.products?.price || 0;
        return sum + (cost * item.quantity_on_hand);
      }, 0) || 0;

      setStats({
        totalProducts,
        lowStockItems,
        outOfStockItems,
        totalValue
      });

    } catch (error: any) {
      console.error("Error fetching inventory stats:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Total Products",
      value: stats.totalProducts.toLocaleString(),
      change: "+12",
      icon: Package,
      color: "text-primary"
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems.toString(),
      change: stats.lowStockItems > 0 ? `+${stats.lowStockItems}` : "0",
      icon: AlertTriangle,
      color: "text-warning"
    },
    {
      title: "Out of Stock",
      value: stats.outOfStockItems.toString(),
      change: stats.outOfStockItems > 0 ? `${stats.outOfStockItems}` : "0",
      icon: Package,
      color: "text-destructive"
    },
    {
      title: "Total Value",
      value: `$${stats.totalValue.toLocaleString()}`,
      change: "+8.2%",
      icon: DollarSign,
      color: "text-success"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <BackButton to="/dashboard" label="Back to Dashboard" />
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
              <p className="text-muted-foreground">
                Track products, manage stock levels, and monitor inventory performance
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedStore === "all" ? "default" : "outline"}
              onClick={() => setSelectedStore("all")}
              size="sm"
            >
              All Stores
            </Button>
            <Button
              variant={selectedStore === "main" ? "default" : "outline"}
              onClick={() => setSelectedStore("main")}
              size="sm"
            >
              Main Store
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-card transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <div className="flex items-center mt-1">
                        {stat.change.includes('+') ? (
                          <TrendingUp className="h-3 w-3 text-success mr-1" />
                        ) : stat.change.includes('-') ? (
                          <TrendingDown className="h-3 w-3 text-destructive mr-1" />
                        ) : null}
                        <p className={`text-sm ${
                          stat.change.includes('+') ? 'text-success' : 
                          stat.change.includes('-') ? 'text-destructive' : 
                          'text-muted-foreground'
                        }`}>
                          {stat.change}
                        </p>
                      </div>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="smart" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-8">
            <TabsTrigger value="smart" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Smart Manager</span>
            </TabsTrigger>
            <TabsTrigger value="sync" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Real-time Sync</span>
            </TabsTrigger>
            <TabsTrigger value="reorder" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Auto Reorder</span>
            </TabsTrigger>
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Vendor Catalog</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Products</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
              {stats.lowStockItems > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {stats.lowStockItems}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Suppliers</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="smart">
            <SmartInventoryManager />
          </TabsContent>

          <TabsContent value="orders">
            <PurchaseOrderManager />
          </TabsContent>

          <TabsContent value="products">
            <ProductInventory 
              searchQuery={searchQuery}
              selectedStore={selectedStore}
            />
          </TabsContent>

          <TabsContent value="alerts">
            <StockAlerts />
          </TabsContent>

          <TabsContent value="suppliers">
            <SupplierManagement />
          </TabsContent>

          <TabsContent value="reports">
            <InventoryReports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Inventory;