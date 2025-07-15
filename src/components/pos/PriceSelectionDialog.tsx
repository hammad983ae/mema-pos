import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/pages/POS";
import { AlertCircle, DollarSign, TrendingUp } from "lucide-react";

interface PriceSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onConfirm: (product: Product, customPrice: number) => void;
}

export const PriceSelectionDialog = ({
  isOpen,
  onClose,
  product,
  onConfirm,
}: PriceSelectionDialogProps) => {
  const [customPrice, setCustomPrice] = useState(product.price.toString());
  const [error, setError] = useState("");

  const handlePriceChange = (value: string) => {
    setCustomPrice(value);
    setError("");
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setError("Please enter a valid price");
      return;
    }
    
    if (numValue < (product.minimum_price || 0)) {
      setError(`Price too low`);
      return;
    }
  };

  const handleConfirm = () => {
    const numPrice = parseFloat(customPrice);
    
    if (isNaN(numPrice)) {
      setError("Please enter a valid price");
      return;
    }
    
    if (numPrice < (product.minimum_price || 0)) {
      setError(`Price too low`);
      return;
    }

    onConfirm(product, numPrice);
    onClose();
    setCustomPrice(product.price.toString());
    setError("");
  };

  const handleClose = () => {
    onClose();
    setCustomPrice(product.price.toString());
    setError("");
  };

  const suggestedPrices = [
    product.minimum_price || 0,
    product.price * 0.9,
    product.price,
    product.price * 1.1,
    product.price * 1.2,
  ].filter((price, index, arr) => arr.indexOf(price) === index && price >= (product.minimum_price || 0));

  const numPrice = parseFloat(customPrice);
  const isValidPrice = !isNaN(numPrice) && numPrice >= (product.minimum_price || 0);
  const profitMargin = isValidPrice ? numPrice - (product.minimum_price || 0) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Set Sale Price
          </DialogTitle>
          <DialogDescription>
            Set a custom price for <strong>{product.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Info - Clean and Simple */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Retail Price:</span>
              <span className="font-semibold">${product.price.toFixed(2)}</span>
            </div>
          </div>

          {/* Custom Price Input */}
          <div className="space-y-2">
            <Label htmlFor="custom-price">Sale Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="custom-price"
                type="number"
                step="0.01"
                min={product.minimum_price || 0}
                value={customPrice}
                onChange={(e) => handlePriceChange(e.target.value)}
                className={`pl-8 ${error ? "border-red-500" : ""}`}
                placeholder="0.00"
                autoFocus
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          {/* Quick Price Suggestions */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick Select</Label>
            <div className="flex flex-wrap gap-2">
              {suggestedPrices.map((price, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => handlePriceChange(price.toFixed(2))}
                >
                  ${price.toFixed(2)}
                  {price === product.price && (
                    <Badge variant="secondary" className="ml-1 h-4 text-[10px]">
                      RETAIL
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {/* Discreet SPM code next to cancel */}
              {product.minimum_price && product.minimum_price > 0 && (
                <span className="text-[9px] text-muted-foreground/30 font-mono">
                  #{Math.floor(product.minimum_price)}
                </span>
              )}
            </div>
            <Button 
              onClick={handleConfirm} 
              disabled={!isValidPrice || !!error}
              className="bg-primary hover:bg-primary/90"
            >
              Add - ${isValidPrice ? numPrice.toFixed(2) : "0.00"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};