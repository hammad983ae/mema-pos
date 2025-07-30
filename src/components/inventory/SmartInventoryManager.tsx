import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageUpload } from "@/components/ui/image-upload";
import { LabelWithTooltip } from "@/components/ui/label-with-tooltip";
import {
  Package2,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Search,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_PRODUCT,
  DELETE_PRODUCT,
  GET_INVENTORY,
  Inventory,
  InventoryStockStatus,
  Mutation,
  MutationCreateProductArgs,
  MutationDeleteProductArgs,
  Query,
  QueryGetInventoryByBusinessArgs,
} from "@/graphql";
import { showSuccess } from "@/hooks/useToastMessages.tsx";
import { useDebounce } from "@/hooks/useDebounce.ts";
import Pagination from "@/components/ui/pagination.tsx";

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  cost?: number;
  category_id?: string;
  is_active: boolean;
  track_inventory: boolean;
  image_url?: string;
  description?: string;
}

interface InventoryItem {
  id: string;
  product_id: string;
  store_id: string;
  quantity_on_hand: number;
  low_stock_threshold: number;
  max_stock_level?: number;
  last_count_date?: string;
  products: Product;
  stores: { name: string };
}

interface StockMovement {
  id: string;
  product_id: string;
  movement_type: string;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  created_at: string;
  notes?: string;
  created_by?: string;
  products: { name: string; sku: string };
}

type Props = {
  refetchStats: () => void;
};

const stockFilters = [
  { label: "All Items", value: "all" },
  { label: "Low Stock", value: InventoryStockStatus.LowStock },
  { label: "Out of Stock", value: InventoryStockStatus.OutOfStock },
  { label: "In Stock", value: InventoryStockStatus.InStock },
  { label: "Overstocked", value: InventoryStockStatus.Overstocked },
];

export const SmartInventoryManager = ({ refetchStats }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Inventory[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState<number>(1);
  const [stockFilter, setStockFilter] = useState<"all" | InventoryStockStatus>(
    "all",
  );
  const [selectedStore, setSelectedStore] = useState("all");
  const debouncedSearch = useDebounce(searchQuery, 500);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const { data, loading, refetch } = useQuery<
    Query,
    QueryGetInventoryByBusinessArgs
  >(GET_INVENTORY, {
    fetchPolicy: "network-only",
    variables: {
      pagination: { take: 10, page },
      filters: {
        search: debouncedSearch,
        status: stockFilter === "all" ? null : stockFilter,
      },
    },
  });

  const [createProduct, { loading: creatingProduct }] = useMutation<
    Mutation,
    MutationCreateProductArgs
  >(CREATE_PRODUCT);

  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    price: "",
    cost: "",
    minimumPrice: "",
    description: "",
    image_url: "",
    low_stock_threshold: "10",
    max_stock_level: "",
    initial_quantity: "0",
  });

  const [adjustmentForm, setAdjustmentForm] = useState({
    adjustment_type: "manual",
    quantity_change: "",
    reason: "",
    notes: "",
  });

  const movementTypes = [
    { value: "manual", label: "Manual Adjustment" },
    { value: "sale", label: "Sale" },
    { value: "purchase", label: "Purchase" },
    { value: "return", label: "Return" },
    { value: "damage", label: "Damage/Loss" },
    { value: "transfer", label: "Store Transfer" },
  ];

  useEffect(() => {
    loadInventoryData();
    loadRecentMovements();

    // Set up real-time subscription for low stock alerts
    const inventorySubscription = supabase
      .channel("inventory-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory" },
        () => {
          loadInventoryData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inventorySubscription);
    };
  }, []);

  const loadInventoryData = async () => {
    try {
      //
      // const { data: userContext } = await supabase.rpc(
      //   "get_user_business_context",
      //   {
      //     user_uuid: user?.id,
      //   },
      // );
      //
      // if (!userContext || userContext.length === 0) return;

      // Load inventory with product details
      const { data: inventoryData, error } = await supabase
        .from("inventory")
        .select(
          `
          *,
          products!inner(
            id, name, sku, barcode, price, cost, 
            category_id, is_active, track_inventory,
            image_url, description
          ),
          stores!inner(name, business_id)
        `,
        )
        .eq("stores.business_id", userContext[0].business_id)
        .eq("products.is_active", true)
        .order("name", { foreignTable: "products", ascending: true });

      if (error) throw error;

      setInventory(inventoryData || []);

      // Extract unique products
      const uniqueProducts =
        data?.getInventoryByBusiness?.data.reduce((acc, item) => {
          const product = item.product;
          if (!acc.find((p) => p.id === product.id)) {
            acc.push(product);
          }
          return acc;
        }, [] as Product[]) || [];

      setProducts(uniqueProducts);

      // Identify low stock items
      const lowStock =
        data?.getInventoryByBusiness?.data.filter(
          (item) => item.quantity_on_hand <= item.low_stock_threshold,
        ) || [];

      setLowStockItems(lowStock);

      // Send notifications for critical low stock
      const criticalItems = lowStock.filter(
        (item) => item.quantity_on_hand === 0,
      );
      if (criticalItems.length > 0) {
        toast({
          title: "Critical Stock Alert",
          description: `${criticalItems.length} items are out of stock`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive",
      });
    } finally {
      // setLoading(false);
    }
  };

  const loadRecentMovements = async () => {
    try {
      const { data: userContext } = await supabase.rpc(
        "get_user_business_context",
        {
          user_uuid: user?.id,
        },
      );

      if (!userContext || userContext.length === 0) return;

      const { data, error } = await supabase
        .from("inventory_movements")
        .select(
          `
          *,
          products!inner(name, sku),
          stores!inner(business_id)
        `,
        )
        .eq("stores.business_id", userContext[0].business_id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error("Error loading movements:", error);
    }
  };

  const handleAddProduct = () => {
    const {
      name,
      sku,
      barcode,
      price,
      cost,
      minimum_price,
      description,
      max_stock_level,
      initial_quantity,
      low_stock_threshold,
    } = productForm;

    createProduct({
      variables: {
        input: {
          name,
          sku,
          barcode,
          price: parseFloat(price),
          cost: parseFloat(cost),
          minimum_price,
          description,
          is_active: true,
        },
        inventory: {
          quantity_on_hand: parseInt(initial_quantity),
          low_stock_threshold: parseInt(low_stock_threshold),
          max_stock_level: parseInt(max_stock_level),
        },
      },
    }).then(() => {
      showSuccess("Success", "Product added successfully");

      refetch();
      refetchStats();

      setProductForm({
        name: "",
        sku: "",
        barcode: "",
        price: "",
        cost: "",
        minimumPrice: "",
        description: "",
        image_url: "",
        low_stock_threshold: "10",
        max_stock_level: "",
        initial_quantity: "0",
      });

      setIsAddDialogOpen(false);
    });
  };

  const getStockStatus = (item: Inventory) => {
    if (item.quantity_on_hand === 0) {
      return {
        status: "Out of Stock",
        color: "destructive",
        icon: AlertTriangle,
      };
    } else if (item.quantity_on_hand <= item.low_stock_threshold) {
      return { status: "Low Stock", color: "warning", icon: AlertTriangle };
    } else if (
      item.max_stock_level &&
      item.quantity_on_hand > item.max_stock_level
    ) {
      return { status: "Overstocked", color: "secondary", icon: TrendingUp };
    } else {
      return { status: "In Stock", color: "default", icon: Package2 };
    }
  };

  const filteredInventory =
    data?.getInventoryByBusiness?.data.filter((item) => {
      const matchesSearch =
        item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.product.barcode &&
          item.product.barcode
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      const matchesStockFilter = (() => {
        switch (stockFilter) {
          case "low_stock":
            return item.quantity_on_hand <= item.low_stock_threshold;
          case "out_of_stock":
            return item.quantity_on_hand === 0;
          case "in_stock":
            return item.quantity_on_hand > item.low_stock_threshold;
          case "overstocked":
            return (
              item.max_stock_level &&
              item.quantity_on_hand > item.max_stock_level
            );
          default:
            return true;
        }
      })();

      return matchesSearch && matchesStockFilter;
    }) ?? [];

  const handleStockAdjustment = async () => {
    // try {
    const quantityChange = parseInt(adjustmentForm.quantity_change);
    const newQuantity = item.quantity_on_hand + quantityChange;

    //   if (newQuantity < 0) {
    //     toast({
    //       title: "Error",
    //       description: "Adjustment would result in negative stock",
    //       variant: "destructive",
    //     });
    //     return;
    //   }
    //
    //   // Update inventory
    //   const { error: updateError } = await supabase
    //     .from("inventory")
    //     .update({
    //       quantity_on_hand: newQuantity,
    //       last_count_date: new Date().toISOString(),
    //     })
    //     .eq("id", selectedItem.id);
    //
    //   if (updateError) throw updateError;
    //
    //   // Record movement
    //   const { error: movementError } = await supabase
    //     .from("inventory_movements")
    //     .insert({
    //       store_id: selectedItem.store_id,
    //       product_id: selectedItem.product_id,
    //       movement_type: adjustmentForm.adjustment_type,
    //       quantity_change: quantityChange,
    //       previous_quantity: selectedItem.quantity_on_hand,
    //       new_quantity: newQuantity,
    //       notes: adjustmentForm.notes || adjustmentForm.reason,
    //       created_by: user?.id,
    //     });
    //
    //   if (movementError) throw movementError;
    //
    //   toast({
    //     title: "Success",
    //     description: "Stock adjustment recorded successfully",
    //   });
    //
    //   setIsAdjustDialogOpen(false);
    //   setSelectedItem(null);
    //   setAdjustmentForm({
    //     adjustment_type: "manual",
    //     quantity_change: "",
    //     reason: "",
    //     notes: "",
    //   });
    //
    //   loadInventoryData();
    //   loadRecentMovements();
    // } catch (error) {
    //   toast({
    //     title: "Error",
    //     description: "Failed to record stock adjustment",
    //     variant: "destructive",
    //   });
    // }
  };

  return (
    <div className="space-y-6">
      {/* Header with Smart Alerts */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Smart Inventory Manager</h2>
          <p className="text-muted-foreground">
            Real-time stock tracking with automated alerts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {lowStockItems.length > 0 && (
            <Alert className="w-auto">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {lowStockItems.length} items need attention
              </AlertDescription>
            </Alert>
          )}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
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

        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by stock" />
          </SelectTrigger>
          <SelectContent>
            {stockFilters.map((filter) => (
              <SelectItem key={filter.value} value={filter.value}>
                {filter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => {
            refetch();
            refetchStats();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Current Stock</TabsTrigger>
          <TabsTrigger value="movements">Recent Movements</TabsTrigger>
          <TabsTrigger value="alerts">
            Smart Alerts
            {lowStockItems.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {lowStockItems.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4">
            {data?.getInventoryByBusiness?.data.map((item) => (
              <InventoryItem
                item={item}
                getStockStatus={getStockStatus}
                handleAdjust={() => setShowAdjustDialog(true)}
                refetch={() => {
                  refetch();
                  refetchStats();
                }}
              />
            ))}

            <Pagination
              count={data?.getInventoryByBusiness?.count}
              page={page}
              setPage={setPage}
            />
          </div>
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent value="movements" className="space-y-4">
          <div className="grid gap-4">
            {movements.slice(0, 20).map((movement) => (
              <Card key={movement.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        {movement.quantity_change > 0 ? (
                          <TrendingUp className="h-5 w-5 text-success" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {movement.products.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {movement.movement_type
                            .replace("_", " ")
                            .charAt(0)
                            .toUpperCase() +
                            movement.movement_type.slice(1).replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${movement.quantity_change > 0 ? "text-success" : "text-destructive"}`}
                      >
                        {movement.quantity_change > 0 ? "+" : ""}
                        {movement.quantity_change}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(movement.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {movement.notes && (
                    <p className="text-sm text-muted-foreground mt-2 ml-14">
                      {movement.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4">
            {lowStockItems.map((item) => {
              const stockStatus = getStockStatus(item);
              const StatusIcon = stockStatus.icon;

              return (
                <Card key={item.id} className="border-l-4 border-l-warning">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <StatusIcon className="h-8 w-8 text-warning" />
                        <div>
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Current stock: {item.quantity_on_hand} / Threshold:{" "}
                            {item.low_stock_threshold}
                          </p>
                          <p className="text-sm text-warning">
                            {item.quantity_on_hand === 0
                              ? "OUT OF STOCK"
                              : "LOW STOCK ALERT"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
                            setShowAdjustDialog(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Stock
                        </Button>
                        <Button variant="outline" size="sm">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Auto Reorder
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {lowStockItems.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">All Stock Levels Normal</h3>
                  <p className="text-muted-foreground">
                    No low stock alerts at this time
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Product name"
                />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={productForm.sku}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, sku: e.target.value }))
                  }
                  placeholder="Product SKU"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Cost ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productForm.cost}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      cost: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <LabelWithTooltip
                  htmlFor="minimumPrice"
                  tooltip="Sales Person Minimum - Sets the minimum price employees can sell this product for"
                  required
                >
                  SPM ($)
                </LabelWithTooltip>
                <Input
                  id="minimumPrice"
                  type="number"
                  step="0.01"
                  value={productForm.minimumPrice}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      minimumPrice: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Initial Quantity</Label>
                <Input
                  type="number"
                  value={productForm.initial_quantity}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      initial_quantity: e.target.value,
                    }))
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Low Stock Threshold</Label>
                <Input
                  type="number"
                  value={productForm.low_stock_threshold}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      low_stock_threshold: e.target.value,
                    }))
                  }
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Stock Level</Label>
                <Input
                  type="number"
                  value={productForm.max_stock_level}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      max_stock_level: e.target.value,
                    }))
                  }
                  placeholder="100"
                />
              </div>
            </div>

            <ImageUpload
              value={productForm.image_url}
              onChange={(url) =>
                setProductForm((prev) => ({ ...prev, image_url: url || "" }))
              }
              bucket="product-images"
              path="products/"
            />

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={productForm.description}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Product description"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddProduct} loading={creatingProduct}>
                Add Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Adjust Stock - {selectedItem?.product?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm">
                Current Stock:{" "}
                <span className="font-medium">
                  {selectedItem?.quantity_on_hand}
                </span>
              </p>
              <p className="text-sm">
                Low Stock Threshold:{" "}
                <span className="font-medium">
                  {selectedItem?.low_stock_threshold}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Adjustment Type</Label>
                <Select
                  value={adjustmentForm.adjustment_type}
                  onValueChange={(value) =>
                    setAdjustmentForm((prev) => ({
                      ...prev,
                      adjustment_type: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {movementTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity Change</Label>
                <Input
                  type="number"
                  value={adjustmentForm.quantity_change}
                  onChange={(e) =>
                    setAdjustmentForm((prev) => ({
                      ...prev,
                      quantity_change: e.target.value,
                    }))
                  }
                  placeholder="Enter +/- amount"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={adjustmentForm.notes}
                onChange={(e) =>
                  setAdjustmentForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Reason for adjustment"
                rows={3}
              />
            </div>

            {adjustmentForm.quantity_change && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  New Stock Level:{" "}
                  <span className="font-medium">
                    {selectedItem?.quantity_on_hand +
                      parseInt(adjustmentForm.quantity_change || "0")}
                  </span>
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowAdjustDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleStockAdjustment}>Update Stock</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

type InventoryItemProps = {
  item: Inventory;
  getStockStatus: (item: Inventory) => any;
  handleAdjust: () => void;
  refetch: () => void;
};

function InventoryItem({
  item,
  getStockStatus,
  handleAdjust,
  refetch,
}: InventoryItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteProduct, { loading: deleting }] = useMutation<
    Mutation,
    MutationDeleteProductArgs
  >(DELETE_PRODUCT);

  const stockStatus = getStockStatus(item);
  const StatusIcon = stockStatus.icon;

  return (
    <>
      <Card key={item.id} className="hover:shadow-card transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                {item.product.image_url ? (
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="h-full w-full object-cover rounded-lg"
                  />
                ) : (
                  <Package2 className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{item.product.name}</h3>
                  <Badge
                    variant={stockStatus.color as any}
                    className="flex items-center space-x-1"
                  >
                    <StatusIcon className="h-3 w-3" />
                    <span>{stockStatus.status}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  SKU: {item.product.sku}
                </p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                  <span>Stock: {item.quantity_on_hand}</span>
                  <span>Threshold: {item.low_stock_threshold}</span>
                  <span>Price: ${item.product.price}</span>
                  {item.product.cost && <span>Cost: ${item.product.cost}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleAdjust}>
                <Edit className="h-4 w-4 mr-2" />
                Adjust
              </Button>
              <Button variant="outline" size="sm">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Reorder
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                loading={deleting}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                Are you sure you want to delete this product?
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                This action cannot be undone. All inventory records for this
                product will also be deleted.
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">{item.product.name}</h4>
              <p className="text-sm text-muted-foreground">
                SKU: {item.product.sku}
              </p>
              <p className="text-sm text-muted-foreground">
                Current Stock: {item.quantity_on_hand}
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteProduct({ variables: { id: item.product.id } }).then(
                    () => {
                      setShowDeleteDialog(false);
                      refetch();
                    },
                  );
                }}
              >
                Delete Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
