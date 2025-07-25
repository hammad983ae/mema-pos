import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CartItem } from "@/pages/POS";
import { RefundModal } from "./RefundModal";
import { TransactionHistoryModal } from "./TransactionHistoryModal";
import { CustomerSelector } from "./CustomerSelector";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Minus,
  Plus,
  Trash2,
  X,
  CreditCard,
  Percent,
  User,
  RefreshCw,
  History,
  Truck,
} from "lucide-react";
import { AppliedDiscount } from "@/types/discount";

interface Customer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address_line_1: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  loyalty_points: number | null;
}

interface CartSidebarProps {
  items: CartItem[];
  onUpdateItem: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onUpdateShipping?: (id: string, shipping_required: boolean) => void;
  totalPrice: number;
  onClose?: () => void;
  isMobile?: boolean;
  businessId: string;
  selectedCustomer?: Customer | null;
  onSelectCustomer?: (customer: Customer | null) => void;
}

export const CartSidebar = ({
  items,
  onUpdateItem,
  onRemoveItem,
  onClearCart,
  onUpdateShipping,
  totalPrice,
  onClose,
  isMobile = false,
  businessId,
  selectedCustomer,
  onSelectCustomer,
}: CartSidebarProps) => {
  const navigate = useNavigate();
  const [tipPercentage, setTipPercentage] = useState(0);
  const [appliedDiscounts, setAppliedDiscounts] = useState<AppliedDiscount[]>(
    [],
  );
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const tipAmount = totalPrice * (tipPercentage / 100);
  const totalDiscountAmount = appliedDiscounts.reduce(
    (sum, ad) => sum + ad.discountAmount,
    0,
  );
  const finalTotal = totalPrice + tipAmount - totalDiscountAmount;
  const tax = finalTotal * 0.08875; // Sample NYC tax rate
  const grandTotal = finalTotal + tax;

  const handleTipSelect = (percentage: number) => {
    setTipPercentage(tipPercentage === percentage ? 0 : percentage);
  };

  const handleDiscountApplied = (discount: AppliedDiscount) => {
    setAppliedDiscounts((prev) => [...prev, discount]);
  };

  const handleDiscountRemoved = (discountId: string) => {
    setAppliedDiscounts((prev) =>
      prev.filter((ad) => ad.discount.id !== discountId),
    );
  };

  return (
    <div
      className={`flex flex-col h-full bg-background ${isMobile ? "animate-slide-up" : ""}`}
    >
      {/* Header */}
      <div className="p-4 border-b bg-pos-surface">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Shopping Cart</h2>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {items.length} {items.length === 1 ? "item" : "items"}
            </Badge>
            {isMobile && onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="bg-muted rounded-full p-4 mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Cart is empty
            </h3>
            <p className="text-sm text-muted-foreground">
              Add products to start a transaction
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="p-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-pos-accent rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 bg-primary rounded" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {item.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      ${item.price.toFixed(2)} each
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onUpdateItem(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>

                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onUpdateItem(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Shipping Toggle */}
                {onUpdateShipping && (
                  <div className="mt-3 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <Label
                          htmlFor={`shipping-${item.id}`}
                          className="text-sm"
                        >
                          Ship this item
                        </Label>
                      </div>
                      <Switch
                        id={`shipping-${item.id}`}
                        checked={item.shipping_required || false}
                        onCheckedChange={(checked) =>
                          onUpdateShipping(item.id, checked)
                        }
                      />
                    </div>
                    {item.shipping_required && !selectedCustomer && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                        <User className="h-3 w-3" />
                        <span>Select customer for shipping</span>
                      </div>
                    )}
                    {item.shipping_required &&
                      selectedCustomer &&
                      !selectedCustomer.address_line_1 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                          <User className="h-3 w-3" />
                          <span>Customer needs shipping address</span>
                        </div>
                      )}
                    {item.shipping_required &&
                      selectedCustomer &&
                      selectedCustomer.address_line_1 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          This item will be shipped to the customer
                        </p>
                      )}
                  </div>
                )}

                <div className="mt-2 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Subtotal:
                  </span>
                  <span className="font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </Card>
            ))}

            {items.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearCart}
                className="w-full mt-4"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Cart Summary & Checkout */}
      {items.length > 0 && (
        <div className="border-t bg-pos-surface p-4 space-y-4">
          {/* Customer Selection */}
          {onSelectCustomer && (
            <CustomerSelector
              selectedCustomer={selectedCustomer}
              onSelectCustomer={onSelectCustomer}
              businessId={businessId}
            />
          )}

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>

            {tipAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span>Tip ({tipPercentage}%)</span>
                <span>${tipAmount.toFixed(2)}</span>
              </div>
            )}

            {totalDiscountAmount > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>Total Discounts</span>
                <span>-${totalDiscountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>

            <Separator />

            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout Actions */}
          <div className="space-y-2">
            <Button
              className="w-full h-12 text-base"
              size="lg"
              onClick={() => {
                if (items.length === 0) return;

                // Store cart data for checkout flow
                const cartData = {
                  items: items,
                  total: grandTotal,
                  subtotal: totalPrice,
                  tax: tax,
                  tip: tipAmount,
                  discount: totalDiscountAmount,
                };
                localStorage.setItem("pos_cart", JSON.stringify(cartData));

                // Navigate to multi-step checkout
                navigate("/checkout/customer");
              }}
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Proceed to Checkout
            </Button>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRefundModalOpen(true)}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refund
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsHistoryModalOpen(true)}
                  >
                    <History className="h-4 w-4 mr-1" />
                    History
                  </Button>
                </div>
                {/* Discreet total spare amount */}
                {(() => {
                  const totalSpare = items.reduce((sum, item) => {
                    if (item.minimum_price && item.minimum_price > 0) {
                      return (
                        sum + (item.price - item.minimum_price) * item.quantity
                      );
                    }
                    return sum;
                  }, 0);

                  return totalSpare > 0 ? (
                    <span className="text-[9px] text-muted-foreground/30 font-mono ml-2">
                      #{Math.floor(totalSpare)}
                    </span>
                  ) : null;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      <RefundModal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        onRefundComplete={() => {
          // Could refresh data or show notification
        }}
      />

      {/* Transaction History Modal */}
      <TransactionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  );
};
