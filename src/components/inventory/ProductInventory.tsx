import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LabelWithTooltip } from "@/components/ui/label-with-tooltip";
import { Edit, Trash2, Eye, Package, AlertTriangle, HelpCircle, Plus } from "lucide-react";

interface ProductInventoryProps {
  searchQuery: string;
  selectedStore: string;
}

export const ProductInventory = ({ searchQuery, selectedStore }: ProductInventoryProps) => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    cost: "",
    minimumPrice: "",
    stock: "",
    lowStockThreshold: "",
    supplier: ""
  });

  const products = [
    {
      id: "1",
      name: "Vitamin C Serum",
      sku: "VCS-001",
      category: "Serums",
      price: 45.99,
      cost: 18.40,
      minimumPrice: 35.00,
      stock: 124,
      lowStockThreshold: 20,
      supplier: "GlowTech Labs",
      status: "in-stock"
    },
    {
      id: "2",
      name: "Hyaluronic Acid Moisturizer",
      sku: "HAM-002",
      category: "Moisturizers",
      price: 38.50,
      cost: 15.40,
      minimumPrice: 30.00,
      stock: 8,
      lowStockThreshold: 15,
      supplier: "AquaDerm Solutions",
      status: "low-stock"
    },
    {
      id: "3",
      name: "Retinol Night Cream",
      sku: "RNC-003",
      category: "Night Care",
      price: 62.00,
      cost: 24.80,
      minimumPrice: 50.00,
      stock: 0,
      lowStockThreshold: 10,
      supplier: "NightGlow Co.",
      status: "out-of-stock"
    },
    {
      id: "4",
      name: "Gentle Cleanser",
      sku: "GC-004",
      category: "Cleansers",
      price: 28.99,
      cost: 11.60,
      minimumPrice: 22.00,
      stock: 67,
      lowStockThreshold: 25,
      supplier: "PureSkin Inc.",
      status: "in-stock"
    },
    {
      id: "5",
      name: "Sunscreen SPF 50",
      sku: "SS-005",
      category: "Sun Protection",
      price: 34.95,
      cost: 13.98,
      minimumPrice: 25.00,
      stock: 15,
      lowStockThreshold: 20,
      supplier: "SunShield Corp",
      status: "low-stock"
    }
  ];

  const resetForm = () => {
    setProductForm({
      name: "",
      sku: "",
      category: "",
      price: "",
      cost: "",
      minimumPrice: "",
      stock: "",
      lowStockThreshold: "",
      supplier: ""
    });
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price.toString(),
      cost: product.cost.toString(),
      minimumPrice: product.minimumPrice.toString(),
      stock: product.stock.toString(),
      lowStockThreshold: product.lowStockThreshold.toString(),
      supplier: product.supplier
    });
    setShowAddProduct(true);
  };

  const handleSaveProduct = () => {
    // Here you would save to the database
    console.log("Saving product:", productForm);
    setShowAddProduct(false);
    setEditingProduct(null);
    resetForm();
  };

  const getStatusBadge = (status: string, stock: number) => {
    switch (status) {
      case "out-of-stock":
        return <Badge variant="destructive">Out of Stock</Badge>;
      case "low-stock":
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">Low Stock</Badge>;
      default:
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">In Stock</Badge>;
    }
  };

  const getStockIcon = (status: string) => {
    if (status === "out-of-stock" || status === "low-stock") {
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
    return <Package className="h-4 w-4 text-success" />;
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Product Inventory</span>
          </CardTitle>
          <div className="flex items-center space-x-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="serums">Serums</SelectItem>
                <SelectItem value="moisturizers">Moisturizers</SelectItem>
                <SelectItem value="cleansers">Cleansers</SelectItem>
                <SelectItem value="sun-protection">Sun Protection</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="stock">Stock Level</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-help">
                          <span>SPM</span>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Sales Person Minimum - Sets the minimum price employees can sell this product for</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      {getStockIcon(product.status)}
                      <span>{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell className="text-muted-foreground">${product.cost}</TableCell>
                  <TableCell className="text-primary font-medium">${product.minimumPrice}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className={product.stock <= product.lowStockThreshold ? "text-warning font-medium" : ""}>
                        {product.stock}
                      </span>
                      {product.stock <= product.lowStockThreshold && product.stock > 0 && (
                        <AlertTriangle className="h-3 w-3 text-warning" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(product.status, product.stock)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{product.supplier}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {filteredProducts.length} of {products.length} products
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              Bulk Edit Stock
            </Button>
            <Button variant="outline" size="sm">
              Generate Reorder Report
            </Button>
            <Dialog 
              open={showAddProduct} 
              onOpenChange={(open) => {
                setShowAddProduct(open);
                if (!open) {
                  setEditingProduct(null);
                  resetForm();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setShowAddProduct(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Product
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        {/* Product Form Dialog */}
        <Dialog 
          open={showAddProduct} 
          onOpenChange={(open) => {
            setShowAddProduct(open);
            if (!open) {
              setEditingProduct(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? "Update product information and pricing." : "Create a new product with pricing and inventory details."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter product name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    placeholder="Product SKU"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={productForm.category} onValueChange={(value) => setProductForm({ ...productForm, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="serums">Serums</SelectItem>
                      <SelectItem value="moisturizers">Moisturizers</SelectItem>
                      <SelectItem value="cleansers">Cleansers</SelectItem>
                      <SelectItem value="night-care">Night Care</SelectItem>
                      <SelectItem value="sun-protection">Sun Protection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    placeholder="Supplier name"
                    value={productForm.supplier}
                    onChange={(e) => setProductForm({ ...productForm, supplier: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Retail Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost Price</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={productForm.cost}
                    onChange={(e) => setProductForm({ ...productForm, cost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="minimumPrice" 
                    tooltip="Sales Person Minimum - Sets the minimum price employees can sell this product for"
                    required
                  >
                    SPM
                  </LabelWithTooltip>
                  <Input
                    id="minimumPrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={productForm.minimumPrice}
                    onChange={(e) => setProductForm({ ...productForm, minimumPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Current Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    placeholder="10"
                    value={productForm.lowStockThreshold}
                    onChange={(e) => setProductForm({ ...productForm, lowStockThreshold: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddProduct(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProduct}>
                {editingProduct ? "Update Product" : "Add Product"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};