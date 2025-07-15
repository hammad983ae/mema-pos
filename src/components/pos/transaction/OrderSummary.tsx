import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CartItem } from "@/pages/POS";

interface OrderSummaryProps {
  items: CartItem[];
  totalAmount: number;
  tipAmount: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
}

export const OrderSummary = ({ 
  items, 
  totalAmount, 
  tipAmount, 
  discountAmount, 
  taxAmount, 
  grandTotal 
}: OrderSummaryProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Label>Order Summary</Label>
          
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <Separator />
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            
            {tipAmount > 0 && (
              <div className="flex justify-between">
                <span>Tip:</span>
                <span>${tipAmount.toFixed(2)}</span>
              </div>
            )}
            
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};