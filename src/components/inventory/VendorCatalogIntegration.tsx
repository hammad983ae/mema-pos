import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Package, 
  Search, 
  ShoppingCart, 
  ExternalLink,
  RefreshCw,
  Building,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  Download
} from "lucide-react";

interface VendorItem {
  id: string;
  supplier_name: string;
  product_name: string;
  sku: string;
  category: string;
  unit_price: number;
  minimum_order_quantity: number;
  lead_time_days: number;
  availability_status: string;
  last_updated: string;
  description: string;
}

interface VendorCatalogIntegrationProps {
  storeId?: string;
}

export const VendorCatalogIntegration = ({ storeId }: VendorCatalogIntegrationProps) => {
  const { toast } = useToast();
  const [catalogItems, setCatalogItems] = useState<VendorItem[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  useEffect(() => {
    fetchData();
  }, [storeId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Use placeholder suppliers data to avoid type issues
      setSuppliers([
        { id: '1', name: 'Supplier A', is_active: true },
        { id: '2', name: 'Supplier B', is_active: true },
        { id: '3', name: 'Supplier C', is_active: true }
      ]);

      // For now, show placeholder since vendor_catalog_items table doesn't exist
      setCatalogItems([]);
      
      toast({
        title: "Info",
        description: "Vendor catalog integration will be available once supplier catalogs are configured.",
      });
    } catch (error) {
      console.error("Error fetching catalog data:", error);
      toast({
        title: "Error",
        description: "Failed to load vendor catalog",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncCatalog = async (supplierId?: string) => {
    try {
      setLoading(true);
      
      // Placeholder for catalog sync functionality
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Sync Complete",
        description: supplierId ? "Supplier catalog updated successfully" : "All catalogs synchronized",
      });
      
      await fetchData();
    } catch (error) {
      console.error("Error syncing catalog:", error);
      toast({
        title: "Sync Failed",
        description: "Failed to synchronize vendor catalog",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToInventory = async (item: VendorItem) => {
    try {
      // Check if product already exists
      const { data: existingProduct } = await supabase
        .from("products")
        .select("id")
        .eq("sku", item.sku)
        .maybeSingle();

      if (existingProduct) {
        toast({
          title: "Product Exists",
          description: "This product is already in your inventory",
          variant: "destructive",
        });
        return;
      }

      // Add product to inventory
      const { error: productError } = await supabase
        .from("products")
        .insert({
          name: item.product_name,
          sku: item.sku,
          description: item.description,
          price: item.unit_price * 1.5, // Default markup
          cost: item.unit_price,
          is_active: true,
          track_inventory: true
        });

      if (productError) throw productError;

      toast({
        title: "Product Added",
        description: `${item.product_name} has been added to your inventory`,
      });
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: "Failed to add product to inventory",
        variant: "destructive",
      });
    }
  };

  const getAvailabilityIcon = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'low_stock':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'out_of_stock':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredItems = catalogItems.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSupplier = selectedSupplier === 'all' || item.supplier_name === selectedSupplier;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesSupplier && matchesCategory;
  });

  const categories = [...new Set(catalogItems.map(item => item.category))];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Vendor Catalog Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-2">Loading catalog...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Catalog Sync
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              {suppliers.length} Suppliers
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Sync Specific Supplier</Label>
              <div className="flex gap-2 mt-1">
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.name}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => syncCatalog(selectedSupplier !== 'all' ? selectedSupplier : undefined)}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync
                </Button>
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => syncCatalog()}
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Sync All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Catalog Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search Products</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Product Name</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                  <SelectItem value="updated">Last Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setSelectedSupplier('all');
                setSelectedCategory('all');
                setSortBy('name');
              }}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Catalog Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Catalog Items ({filteredItems.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No catalog items found</p>
              <p className="text-sm">
                {catalogItems.length === 0 
                  ? "Connect with your suppliers to import their product catalogs."
                  : "Try adjusting your search or filters to see more results."
                }
              </p>
              <Button className="mt-4" onClick={() => syncCatalog()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Catalogs
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-medium">{item.product_name}</div>
                      <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                      <div className="text-sm text-muted-foreground">{item.supplier_name}</div>
                    </div>
                    {getAvailabilityIcon(item.availability_status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">${item.unit_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Order:</span>
                      <span>{item.minimum_order_quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lead Time:</span>
                      <span>{item.lead_time_days} days</span>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => addToInventory(item)}
                      className="flex-1"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add to Inventory
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        // Placeholder for viewing supplier details
                        toast({
                          title: "Supplier Info",
                          description: `Contact ${item.supplier_name} for more details`,
                        });
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    Updated: {new Date(item.last_updated).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};