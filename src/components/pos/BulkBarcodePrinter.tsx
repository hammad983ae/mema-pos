import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Printer, Package, Download, Eye, Settings, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  category: string;
}

interface PrintSettings {
  labelSize: string;
  includePrice: boolean;
  includeName: boolean;
  includeSKU: boolean;
  copies: number;
  layout: string;
}

export const BulkBarcodePrinter = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    labelSize: "2x1",
    includePrice: true,
    includeName: true,
    includeSKU: true,
    copies: 1,
    layout: "grid"
  });
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          sku,
          barcode,
          price,
          product_categories(name)
        `)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      const transformedProducts: Product[] = data?.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        price: product.price,
        category: product.product_categories?.name || 'Other'
      })) || [];

      setProducts(transformedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchQuery))
  );

  const handleProductToggle = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const generateBarcode = (text: string) => {
    // Simple barcode generation for display purposes
    // In a real implementation, you'd use a proper barcode library
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="50" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="50" fill="white"/>
        <g fill="black">
          ${text.split('').map((char, i) => 
            `<rect x="${10 + i * 15}" y="5" width="${char.charCodeAt(0) % 3 + 1}" height="40"/>`
          ).join('')}
        </g>
        <text x="100" y="48" font-family="Arial" font-size="8" text-anchor="middle" fill="black">${text}</text>
      </svg>
    `)}`;
  };

  const generatePrintContent = () => {
    const selectedProductsList = products.filter(p => selectedProducts.has(p.id));
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode Labels</title>
          <style>
            @page { margin: 0.5in; }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0;
            }
            .labels-container {
              display: grid;
              grid-template-columns: repeat(${printSettings.layout === 'grid' ? '3' : '1'}, 1fr);
              gap: 0.25in;
            }
            .label {
              width: 2.625in;
              height: 1in;
              border: 1px solid #ddd;
              padding: 0.1in;
              box-sizing: border-box;
              page-break-inside: avoid;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .barcode-image {
              max-width: 100%;
              height: 0.4in;
            }
            .product-name {
              font-size: 8pt;
              font-weight: bold;
              text-align: center;
              margin: 2px 0;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 100%;
            }
            .product-sku {
              font-size: 7pt;
              color: #666;
              text-align: center;
              margin: 1px 0;
            }
            .product-price {
              font-size: 8pt;
              font-weight: bold;
              text-align: center;
              margin: 2px 0;
            }
          </style>
        </head>
        <body>
          <div class="labels-container">
            ${selectedProductsList.map(product => 
              Array.from({ length: printSettings.copies }, () => `
                <div class="label">
                  <img class="barcode-image" src="${generateBarcode(product.barcode || product.sku)}" alt="Barcode"/>
                  ${printSettings.includeName ? `<div class="product-name">${product.name}</div>` : ''}
                  ${printSettings.includeSKU ? `<div class="product-sku">SKU: ${product.sku}</div>` : ''}
                  ${printSettings.includePrice ? `<div class="product-price">$${product.price.toFixed(2)}</div>` : ''}
                </div>
              `).join('')
            ).join('')}
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    if (selectedProducts.size === 0) {
      toast({
        title: "No Products Selected",
        description: "Please select at least one product to print labels for.",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatePrintContent());
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }

    toast({
      title: "Print Job Sent",
      description: `Printing ${selectedProducts.size * printSettings.copies} labels`,
    });
  };

  const handleDownloadPDF = () => {
    const printContent = generatePrintContent();
    const blob = new Blob([printContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barcode-labels-${new Date().getTime()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: "Barcode labels file has been downloaded",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print Barcodes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bulk Barcode Printer
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
          {/* Product Selection */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedProducts.size === filteredProducts.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Badge variant="secondary">
                {selectedProducts.size} selected
              </Badge>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleProductToggle(product.id)}
                  >
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onChange={() => handleProductToggle(product.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        SKU: {product.sku} | ${product.price.toFixed(2)}
                      </div>
                      {product.barcode && (
                        <div className="text-xs text-muted-foreground">
                          Barcode: {product.barcode}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Print Settings */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Print Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Label Size</Label>
                  <Select
                    value={printSettings.labelSize}
                    onValueChange={(value) => setPrintSettings(prev => ({ ...prev, labelSize: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2x1">2" × 1" (Standard)</SelectItem>
                      <SelectItem value="4x2">4" × 2" (Large)</SelectItem>
                      <SelectItem value="1x0.5">1" × 0.5" (Small)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Layout</Label>
                  <Select
                    value={printSettings.layout}
                    onValueChange={(value) => setPrintSettings(prev => ({ ...prev, layout: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid (3 columns)</SelectItem>
                      <SelectItem value="list">List (1 column)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Copies per Product</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={printSettings.copies}
                    onChange={(e) => setPrintSettings(prev => ({ ...prev, copies: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm">Include on Label</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeName"
                        checked={printSettings.includeName}
                        onCheckedChange={(checked) => 
                          setPrintSettings(prev => ({ ...prev, includeName: checked as boolean }))
                        }
                      />
                      <Label htmlFor="includeName" className="text-sm">Product Name</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeSKU"
                        checked={printSettings.includeSKU}
                        onCheckedChange={(checked) => 
                          setPrintSettings(prev => ({ ...prev, includeSKU: checked as boolean }))
                        }
                      />
                      <Label htmlFor="includeSKU" className="text-sm">SKU</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includePrice"
                        checked={printSettings.includePrice}
                        onCheckedChange={(checked) => 
                          setPrintSettings(prev => ({ ...prev, includePrice: checked as boolean }))
                        }
                      />
                      <Label htmlFor="includePrice" className="text-sm">Price</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button 
                onClick={() => setPreviewMode(!previewMode)}
                variant="outline" 
                size="sm" 
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? 'Hide Preview' : 'Show Preview'}
              </Button>
              
              <Button onClick={handlePrint} className="w-full" disabled={selectedProducts.size === 0}>
                <Printer className="h-4 w-4 mr-2" />
                Print Labels ({selectedProducts.size * printSettings.copies})
              </Button>
              
              <Button 
                onClick={handleDownloadPDF} 
                variant="outline" 
                className="w-full"
                disabled={selectedProducts.size === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Download HTML
              </Button>

              <Button
                onClick={() => setSelectedProducts(new Set())}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Selection
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        {previewMode && selectedProducts.size > 0 && (
          <div className="mt-4 border-t pt-4">
            <h4 className="font-medium mb-3">Label Preview</h4>
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {Array.from(selectedProducts).slice(0, 6).map(productId => {
                  const product = products.find(p => p.id === productId);
                  if (!product) return null;
                  
                  return (
                    <div key={productId} className="bg-white border p-2 text-center text-xs">
                      <div className="w-full h-4 bg-gradient-to-r from-black via-transparent to-black mb-1"></div>
                      {printSettings.includeName && <div className="font-bold truncate">{product.name}</div>}
                      {printSettings.includeSKU && <div className="text-gray-600">{product.sku}</div>}
                      {printSettings.includePrice && <div className="font-bold">${product.price.toFixed(2)}</div>}
                    </div>
                  );
                })}
              </div>
              {selectedProducts.size > 6 && (
                <div className="text-xs text-muted-foreground mt-2 text-center">
                  Showing first 6 of {selectedProducts.size} selected products
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};