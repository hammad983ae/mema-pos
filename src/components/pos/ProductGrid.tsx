import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Package } from "lucide-react";
import { Product } from "@/pages/POS";
import { useDebounce } from "@/hooks/useDebounce.ts";
import { ProductCard } from "./ProductCard";
import { PriceSelectionDialog } from "./PriceSelectionDialog";
import { useQuery, useReactiveVar } from "@apollo/client";
import {
  GET_PRODUCTS,
  PosSession,
  Query,
  QueryGetProductsByBusinessArgs,
} from "@/graphql";

interface ProductGridProps {
  searchQuery: string;
  activeCategory: string;
  onAddToCart: (product: Product, customPrice?: number) => void;
}

export const ProductGrid = ({
  searchQuery,
  activeCategory,
  onAddToCart,
}: ProductGridProps) => {
  const { toast } = useToast();
  const session = useReactiveVar(PosSession);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState<number>(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 500);

  const { data: productsData, loading: loadingProducts } = useQuery<
    Query,
    QueryGetProductsByBusinessArgs
  >(GET_PRODUCTS, {
    variables: {
      pagination: { page, take: 100 },
      filters: {
        search: debouncedSearch,
        categoryId: activeCategory === "all" ? null : activeCategory,
      },
      storeId: session.store.id,
    },
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (productsData?.getProductsByBusiness) {
      const transformedProducts: Product[] =
        productsData?.getProductsByBusiness?.data?.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          minimum_price: product.minimum_price,
          category:
            product.category?.name?.toLowerCase().replace(/\s+/g, "") ||
            "other",
          description: product.description,
          inStock: (product.inventoryCount ?? 0) > 0,
          stock: product.inventoryCount ?? 0,
          sku: product.sku,
          image: product.image_url || undefined,
        })) || [];

      setProducts(transformedProducts);
    }
  }, [productsData]);

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

  if (loadingProducts) {
    return (
      <div className="p-6 bg-muted/20">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
      {products.length === 0 ? (
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
        <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
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
