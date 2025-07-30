import { useState, useEffect, useMemo, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Package, Edit, AlertCircle, Eye } from "lucide-react";
import { Product } from "@/pages/POS";
import { useDebounce } from "@/hooks/useDebounce.ts";
import { ProductCard } from "./ProductCard";
import { PriceSelectionDialog } from "./PriceSelectionDialog";

interface ProductGridProps {
  searchQuery: string;
  activeCategory: string;
  onAddToCart: (product: Product, customPrice?: number) => void;
}

interface DatabaseProduct {
  id: string;
  name: string;
  price: number;
  minimum_price: number;
  description: string;
  category_id: string;
  sku: string;
  is_active: boolean;
  image_url: string | null;
  barcode: string | null;
  product_categories: {
    name: string;
  } | null;
}

export const ProductGrid = ({
  searchQuery,
  activeCategory,
  onAddToCart,
}: ProductGridProps) => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // Fetch products with categories (optimized query)
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(
          `
          id, name, price, minimum_price, description, category_id, 
          sku, is_active, image_url, barcode,
          product_categories(name)
        `,
        )
        .eq("is_active", true)
        .order("name")
        .limit(100);

      if (productsError) throw productsError;

      // Fetch inventory for products in batches
      const productIds = productsData?.map((p) => p.id) || [];
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory")
        .select("product_id, quantity_on_hand")
        .in("product_id", productIds);

      if (inventoryError) throw inventoryError;

      // Create inventory lookup
      const inventoryLookup =
        inventoryData?.reduce(
          (acc, item) => {
            acc[item.product_id] = item.quantity_on_hand;
            return acc;
          },
          {} as Record<string, number>,
        ) || {};

      setInventory(inventoryLookup);

      // Transform products
      const transformedProducts: Product[] =
        productsData?.map((dbProduct: DatabaseProduct) => ({
          id: dbProduct.id,
          name: dbProduct.name,
          price: dbProduct.price,
          minimum_price: dbProduct.minimum_price,
          category:
            dbProduct.product_categories?.name
              ?.toLowerCase()
              .replace(/\s+/g, "") || "other",
          description: dbProduct.description,
          inStock: (inventoryLookup[dbProduct.id] || 0) > 0,
          sku: dbProduct.sku,
          image: dbProduct.image_url || undefined,
        })) || [];

      setProducts(transformedProducts);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products. Using sample data.",
        variant: "destructive",
      });

      // Fallback to sample data with minimum prices for demo
      setProducts([
        {
          id: "1",
          name: "Gentle Hydrating Cleanser",
          price: 34.99,
          minimum_price: 15.0,
          category: "cleansers",
          description:
            "A gentle, sulfate-free cleanser perfect for sensitive skin",
          inStock: true,
          sku: "CLN001",
        },
        {
          id: "2",
          name: "Vitamin C Brightening Serum",
          price: 89.99,
          minimum_price: 35.0,
          category: "serums",
          description: "20% vitamin C serum for radiant, even skin tone",
          inStock: true,
          sku: "SER002",
        },
        {
          id: "3",
          name: "Hyaluronic Acid Moisturizer",
          price: 45.99,
          minimum_price: 20.0,
          category: "moisturizers",
          description: "Intensive hydration with hyaluronic acid",
          inStock: true,
          sku: "MOI003",
        },
        {
          id: "4",
          name: "Daily SPF 50 Sunscreen",
          price: 28.99,
          minimum_price: 12.0,
          category: "sunscreen",
          description: "Broad spectrum protection for daily use",
          inStock: true,
          sku: "SUN004",
        },
        {
          id: "5",
          name: "Luxury Anti-Aging Night Cream",
          price: 124.99,
          minimum_price: 65.0,
          category: "moisturizers",
          description: "Premium night cream with peptides and retinol",
          inStock: true,
          sku: "NAC005",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search for better performance
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        product.sku.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory =
        activeCategory === "all" || product.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, debouncedSearch, activeCategory]);

  const handleAddToCart = (product: Product) => {
    if (!product.inStock) {
      toast({
        title: "Out of Stock",
        description: `${product.name} is currently out of stock.`,
        variant: "destructive",
      });
      return;
    }

    // Open price selection dialog
    setSelectedProduct(product);
    setIsPriceDialogOpen(true);
  };

  const handlePriceConfirm = (product: Product, customPrice: number) => {
    onAddToCart(product, customPrice);
    toast({
      title: "Added to Cart",
      description: `${product.name} added to cart at $${customPrice.toFixed(2)}.`,
    });
  };

  if (loading) {
    return (
      <div className="p-6 bg-muted/20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-card border-border">
              <CardContent className="p-0">
                <div className="aspect-square bg-muted rounded-t-lg"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-5 bg-muted rounded w-2/3"></div>
                  <div className="h-9 bg-muted rounded-lg"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-muted/20">
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-8 flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-semibold mb-4 text-foreground">
            No Products Found
          </h3>
          <p className="text-muted-foreground text-lg">
            {searchQuery
              ? "Try adjusting your search terms"
              : "No products available in this category"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              inventory={inventory}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}

      {/* Price Selection Dialog */}
      {selectedProduct && (
        <PriceSelectionDialog
          isOpen={isPriceDialogOpen}
          onClose={() => {
            setIsPriceDialogOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          onConfirm={handlePriceConfirm}
        />
      )}
    </div>
  );
};
