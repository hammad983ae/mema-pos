import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Package,
  TrendingDown,
  TrendingUp,
  Package2,
  Plus,
  ShoppingCart,
  RefreshCw,
} from "lucide-react";
import {
  GET_LOW_STOCK_INVENTORY,
  Inventory,
  Query,
  QueryGetLowStockInventoryByBusinessArgs,
} from "@/graphql";
import { useQuery } from "@apollo/client";
import Pagination from "@/components/ui/pagination.tsx";
import { AdjustStockDialog } from "@/components/inventory/AdjustStockDialog.tsx";
import { ReorderDialog } from "@/components/inventory/ReorderDialog.tsx";

type Props = {
  lowCount: number;
  criticalCount: number;
};
export const StockAlerts = ({ lowCount, criticalCount }: Props) => {
  const alertCount = useMemo(
    () => lowCount + criticalCount,
    [lowCount, criticalCount],
  );

  const [page, setPage] = useState<number>(1);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [showReorderDialog, setShowReorderDialog] = useState(false);
  const {
    data: lowStockData,
    loading,
    refetch: refetchLowStock,
  } = useQuery<Query, QueryGetLowStockInventoryByBusinessArgs>(
    GET_LOW_STOCK_INVENTORY,
    {
      fetchPolicy: "network-only",
      variables: {
        pagination: { take: 10, page },
      },
    },
  );

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Critical Alerts
                </p>
                <p className="text-2xl font-bold text-destructive">
                  {criticalCount}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Low Stock
                </p>
                <p className="text-2xl font-bold text-warning">{lowCount}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Alerts
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {alertCount}
                </p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span>Active Stock Alerts</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchLowStock()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4">
            {lowStockData?.getLowStockInventoryByBusiness?.data.map((item) => {
              const stockStatus = getStockStatus(item);
              const StatusIcon = stockStatus.icon;

              return (
                <Card
                  key={item.id}
                  className={`border-l-4 border-l-${stockStatus.color}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <StatusIcon
                          className={`h-8 w-8 text-${stockStatus.color}`}
                        />
                        <div>
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Current stock: {item.quantity_on_hand} / Threshold:{" "}
                            {item.low_stock_threshold}
                          </p>
                          <p
                            className={`text-sm text-${stockStatus.color} uppercase`}
                          >
                            {stockStatus.status}
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
                            setShowReorderDialog(true);
                          }}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Reorder
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
        </CardContent>
      </Card>

      {showAdjustDialog && (
        <AdjustStockDialog
          item={selectedItem}
          handleClose={() => {
            setSelectedItem(null);
            setShowAdjustDialog(false);
          }}
        />
      )}

      {showReorderDialog && (
        <ReorderDialog
          item={selectedItem}
          handleClose={() => {
            setSelectedItem(null);
            setShowReorderDialog(false);
          }}
        />
      )}
    </div>
  );
};
