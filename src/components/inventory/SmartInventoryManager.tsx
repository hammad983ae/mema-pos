import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  Clipboard,
  Edit,
  Package2,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShoppingCart,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery } from "@apollo/client";
import {
  DELETE_PRODUCT,
  GET_INVENTORY,
  GET_INVENTORY_MOVEMENTS,
  GET_LOW_STOCK_INVENTORY,
  Inventory,
  InventoryStockStatus,
  Mutation,
  MutationDeleteProductArgs,
  Query,
  QueryGetInventoryByBusinessArgs,
  QueryGetLowStockInventoryByBusinessArgs,
  QueryGetMovementsByBusinessArgs,
} from "@/graphql";
import { useDebounce } from "@/hooks/useDebounce.ts";
import Pagination from "@/components/ui/pagination.tsx";
import { AddProductForm } from "@/components/inventory/AddProductForm.tsx";
import { DeleteProductDialog } from "@/components/inventory/DeleteProductDialog.tsx";
import { AdjustStockDialog } from "@/components/inventory/AdjustStockDialog.tsx";

type Props = {
  refetchStats: () => void;
  alertCount: number;
};

const stockFilters = [
  { label: "All Items", value: "all" },
  { label: "Low Stock", value: InventoryStockStatus.LowStock },
  { label: "Out of Stock", value: InventoryStockStatus.OutOfStock },
  { label: "In Stock", value: InventoryStockStatus.InStock },
  { label: "Overstocked", value: InventoryStockStatus.Overstocked },
];

export const SmartInventoryManager = ({ refetchStats, alertCount }: Props) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState<number>(1);
  const [stockFilter, setStockFilter] = useState<"all" | InventoryStockStatus>(
    "all",
  );
  const debouncedSearch = useDebounce(searchQuery, 500);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const { data, refetch: refetchInventory } = useQuery<
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
  const { data: lowStockData, refetch: refetchLowStock } = useQuery<
    Query,
    QueryGetLowStockInventoryByBusinessArgs
  >(GET_LOW_STOCK_INVENTORY, {
    fetchPolicy: "network-only",
    variables: {
      pagination: { take: 10, page },
      filters: {
        search: debouncedSearch,
      },
    },
  });
  const { data: movementsData, refetch: refetchMovements } = useQuery<
    Query,
    QueryGetMovementsByBusinessArgs
  >(GET_INVENTORY_MOVEMENTS, {
    fetchPolicy: "network-only",
    variables: { pagination: { take: 10, page } },
  });

  const refetch = () => {
    refetchStats();
    refetchInventory();
    refetchMovements();
    refetchLowStock();
  };

  useEffect(() => {
    // Set up real-time subscription for low stock alerts
    const inventorySubscription = supabase
      .channel("inventory-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory" },
        () => {
          // loadInventoryData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inventorySubscription);
    };
  }, []);

  const getStockStatus = (item: Inventory) => {
    if (item.is_out_of_stock) {
      return {
        status: "Out of Stock",
        color: "destructive",
        icon: AlertTriangle,
      };
    } else if (item.is_low_stock) {
      return { status: "Low Stock", color: "warning", icon: AlertTriangle };
    } else if (item.is_overstocked) {
      return { status: "Overstocked", color: "secondary", icon: TrendingUp };
    } else {
      return { status: "In Stock", color: "default", icon: Package2 };
    }
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
          {alertCount > 0 && (
            <Alert className="w-auto">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {alertCount} item(s) need attention
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
            refetchInventory();
            refetchStats();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs
        defaultValue="inventory"
        className="space-y-6"
        onValueChange={() => {
          setPage(1);
        }}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Current Stock</TabsTrigger>
          <TabsTrigger value="movements">Recent Movements</TabsTrigger>
          <TabsTrigger value="alerts">
            Smart Alerts
            {alertCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alertCount}
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
                handleEdit={() => {
                  setSelectedItem(item);
                  setIsAddDialogOpen(true);
                }}
                handleAdjust={() => {
                  setSelectedItem(item);
                  setShowAdjustDialog(true);
                }}
                refetch={refetch}
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
            {movementsData?.getMovementsByBusiness?.data.map((movement) => (
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
                        <h4 className="font-medium">{movement.product.name}</h4>
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

            <Pagination
              count={movementsData?.getMovementsByBusiness?.count}
              page={page}
              setPage={setPage}
            />
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4">
            {lowStockData?.getLowStockInventoryByBusiness?.data.map((item) => {
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

            <Pagination
              count={lowStockData?.getLowStockInventoryByBusiness?.count}
              page={page}
              setPage={setPage}
            />

            {alertCount === 0 && (
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

      {isAddDialogOpen && (
        <AddProductForm
          item={selectedItem}
          refetch={refetch}
          handleClose={() => {
            setSelectedItem(null);
            setIsAddDialogOpen(false);
          }}
        />
      )}

      {showAdjustDialog && (
        <AdjustStockDialog
          item={selectedItem}
          handleClose={() => setShowAdjustDialog(false)}
          onSuccess={() => {
            setSelectedItem(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};

type InventoryItemProps = {
  item: Inventory;
  getStockStatus: (item: Inventory) => any;
  handleAdjust: () => void;
  handleEdit: () => void;
  refetch: () => void;
};

function InventoryItem({
  item,
  getStockStatus,
  handleAdjust,
  handleEdit,
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
                <p className="text-sm text-muted-foreground mt-1">
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
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={handleAdjust}>
                <Settings2 className="h-4 w-4 mr-2" />
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

      {showDeleteDialog && (
        <DeleteProductDialog
          item={item}
          handleDelete={() => {
            deleteProduct({ variables: { id: item.product.id } }).then(() => {
              setShowDeleteDialog(false);
              refetch();
            });
          }}
          handleClose={() => setShowDeleteDialog(false)}
        />
      )}
    </>
  );
}
