import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CartItem } from "@/pages/POS";
import { Monitor, ShoppingCart, DollarSign } from "lucide-react";

interface CustomerDisplayProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  tipAmount: number;
  discountAmount: number;
  total: number;
  storeName?: string;
  message?: string;
}

export const CustomerDisplay = ({
  items,
  subtotal,
  tax,
  tipAmount,
  discountAmount,
  total,
  storeName = "Mema Store",
  message = "Thank you for shopping with us!"
}: CustomerDisplayProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <Monitor className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold text-primary">
                  {storeName}
                </CardTitle>
                <p className="text-lg text-muted-foreground">Customer Display</p>
              </div>
            </div>
            <div className="text-lg font-mono text-foreground">
              {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
          </CardHeader>
        </Card>

        {/* Welcome Message */}
        <Card className="border-primary/20 shadow-lg">
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-semibold text-primary mb-2">
              {message}
            </h2>
            <p className="text-lg text-muted-foreground">
              Please review your order below
            </p>
          </CardContent>
        </Card>

        {/* Cart Items */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShoppingCart className="h-6 w-6 text-primary" />
              Your Order ({getTotalItems()} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-xl text-muted-foreground">Cart is empty</p>
                <p className="text-lg text-muted-foreground/70">Items will appear here as they are added</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-b-0">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                      <p className="text-base text-muted-foreground">
                        Qty: {item.quantity} × {formatPrice(item.price)}
                      </p>
                      {item.shipping_required && (
                        <Badge variant="outline" className="mt-1">
                          Shipping Required
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Summary */}
        {items.length > 0 && (
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <DollarSign className="h-6 w-6 text-primary" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-lg">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-lg text-green-600">
                    <span>Discount:</span>
                    <span className="font-semibold">-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-lg">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-semibold">{formatPrice(tax)}</span>
                </div>

                {tipAmount > 0 && (
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-muted-foreground">Tip:</span>
                    <span className="font-semibold">{formatPrice(tipAmount)}</span>
                  </div>
                )}

                <Separator className="my-3" />

                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary">Total:</span>
                  <span className="text-3xl font-bold text-primary">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <Card className="border-primary/20 shadow-lg">
          <CardContent className="text-center py-6">
            <p className="text-lg text-muted-foreground mb-2">
              Please wait while your cashier processes your order
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/70">
              <Monitor className="h-4 w-4" />
              <span>Powered by Mema POS</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};