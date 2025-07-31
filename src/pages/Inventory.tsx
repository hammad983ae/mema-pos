import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
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
  Download,
  Upload,
  Truck,
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useQuery } from "@apollo/client";
import { GET_INVENTORY_STATS, Query } from "@/graphql";

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState("all");
  const {
    data: statsData,
    loading,
    refetch: refetchStats,
  } = useQuery<Query>(GET_INVENTORY_STATS, {
    fetchPolicy: "network-only",
  });

  if (loading || !statsData) {
    return (
      <div className="min-h-screen bg-gradient-hero p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Products",
      value: statsData.getInventoryStats.productsCount.toLocaleString(),
      change: "+12",
      icon: Package,
      color: "text-primary",
    },
    {
      title: "Low Stock Items",
      value: statsData.getInventoryStats.lowStockItemsCount.toString(),
      change:
        statsData.getInventoryStats.lowStockItemsCount > 0
          ? `+${statsData.getInventoryStats.lowStockItemsCount}`
          : "0",
      icon: AlertTriangle,
      color: "text-warning",
    },
    {
      title: "Out of Stock",
      value: statsData.getInventoryStats.outOfStockCount.toString(),
      change:
        statsData.getInventoryStats.outOfStockCount > 0
          ? `${statsData.getInventoryStats.outOfStockCount}`
          : "0",
      icon: Package,
      color: "text-destructive",
    },
    {
      title: "Total Value",
      value: `$${statsData.getInventoryStats.totalValue.toLocaleString()}`,
      change: "+8.2%",
      icon: DollarSign,
      color: "text-success",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <BackButton to="/dashboard" label="Back to Dashboard" />
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Inventory Management
              </h1>
              <p className="text-muted-foreground">
                Track products, manage stock levels, and monitor inventory
                performance
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
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      <div className="flex items-center mt-1">
                        {stat.change.includes("+") ? (
                          <TrendingUp className="h-3 w-3 text-success mr-1" />
                        ) : stat.change.includes("-") ? (
                          <TrendingDown className="h-3 w-3 text-destructive mr-1" />
                        ) : null}
                        <p
                          className={`text-sm ${
                            stat.change.includes("+")
                              ? "text-success"
                              : stat.change.includes("-")
                                ? "text-destructive"
                                : "text-muted-foreground"
                          }`}
                        >
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
              {statsData?.getInventoryStats?.lowStockItemsCount +
                statsData?.getInventoryStats?.outOfStockCount >
                0 && (
                <Badge variant="destructive" className="ml-1">
                  {statsData?.getInventoryStats?.lowStockItemsCount +
                    statsData?.getInventoryStats?.outOfStockCount}
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
            <SmartInventoryManager
              refetchStats={refetchStats}
              alertCount={
                statsData?.getInventoryStats?.lowStockItemsCount +
                statsData?.getInventoryStats?.outOfStockCount
              }
            />
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
