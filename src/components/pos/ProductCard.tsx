import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, AlertCircle, Eye } from "lucide-react";
import { Product } from "@/pages/POS";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard = memo(
  ({ product, onAddToCart }: ProductCardProps) => {
    return (
      <Card
        className={`group relative bg-white dark:bg-card border-0 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer ${
          !product.inStock
            ? "opacity-60"
            : "hover:-translate-y-2 hover:shadow-primary/10"
        }`}
        onClick={() => product.inStock && onAddToCart(product)}
      >
        <CardContent className="p-0 relative">
          {/* Premium Product Image Container */}
          <div className="relative aspect-[4/3] bg-gradient-to-br from-muted/20 to-muted/40 overflow-hidden">
            {product.image ? (
              <div className="relative w-full h-full group/image">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "hidden",
                    );
                  }}
                />
                <div className="hidden absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/60">
                  <Package className="h-16 w-16 text-muted-foreground/60" />
                </div>

                {/* Premium overlay effects */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <div className="bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-xl p-2 shadow-lg">
                    <Plus className="h-4 w-4 text-foreground" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/60">
                <Package className="h-16 w-16 text-muted-foreground/60" />
              </div>
            )}

            {/* Stock Status Overlay */}
            {!product.inStock && (
              <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                <Badge
                  variant="destructive"
                  className="px-4 py-2 text-sm font-semibold"
                >
                  Out of Stock
                </Badge>
              </div>
            )}

            {/* Inventory Count Badge */}
            {product.inStock && (
              <div className="absolute top-4 left-4">
                <Badge
                  variant="secondary"
                  className="bg-white/90 dark:bg-black/90 backdrop-blur-sm text-foreground border-0 shadow-sm"
                >
                  {product.stock} left
                </Badge>
              </div>
            )}
          </div>

          {/* Premium Product Info Section */}
          <div className="p-8 space-y-6">
            {/* Product Name & SKU */}
            <div className="space-y-3">
              <h3 className="font-bold text-xl leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <p className="text-base text-muted-foreground font-medium">
                  SKU: {product.sku}
                </p>
                {/* Subtle minimum price indicator */}
                {product.minimum_price && product.minimum_price > 0 && (
                  <p className="text-sm text-muted-foreground/60 font-mono bg-muted/50 px-3 py-1.5 rounded-lg">
                    ${Math.floor(product.minimum_price)}
                  </p>
                )}
              </div>
            </div>

            {/* Price Display */}
            <div className="space-y-2">
              <div className="text-3xl font-bold text-foreground">
                ${product.price.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                Retail Price
              </div>
            </div>

            {/* Clickable area hint */}
            <div className="text-center pt-2">
              <div
                className={`text-base font-medium transition-all duration-300 ${
                  product.inStock
                    ? "text-primary group-hover:text-primary-foreground opacity-70 group-hover:opacity-100"
                    : "text-muted-foreground"
                }`}
              >
                {product.inStock ? "Click to Add" : "Out of Stock"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
);

ProductCard.displayName = "ProductCard";
