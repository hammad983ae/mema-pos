import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, DollarSign, Banknote, Check } from "lucide-react";

interface PaymentMethodSelectorProps {
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  cashReceived: string;
  onCashReceivedChange: (amount: string) => void;
  grandTotal: number;
  onSplitPayment: () => void;
  cardType?: string;
  onCardTypeChange?: (type: string) => void;
  lastFourDigits?: string;
  onLastFourDigitsChange?: (digits: string) => void;
}

export const PaymentMethodSelector = ({ 
  paymentMethod, 
  onPaymentMethodChange, 
  cashReceived, 
  onCashReceivedChange, 
  grandTotal,
  onSplitPayment,
  cardType,
  onCardTypeChange,
  lastFourDigits,
  onLastFourDigitsChange
}: PaymentMethodSelectorProps) => {
  const change = parseFloat(cashReceived || "0") - grandTotal;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Label>Payment Method</Label>
          <RadioGroup value={paymentMethod} onValueChange={onPaymentMethodChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Credit/Debit Card
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Cash
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="check" id="check" />
              <Label htmlFor="check" className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Check
              </Label>
            </div>
          </RadioGroup>

          {paymentMethod === "card" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Card Type</Label>
                  <Select value={cardType} onValueChange={onCardTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select card type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visa">Visa</SelectItem>
                      <SelectItem value="mastercard">Mastercard</SelectItem>
                      <SelectItem value="amex">American Express</SelectItem>
                      <SelectItem value="discover">Discover</SelectItem>
                      <SelectItem value="debit">Debit Card</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Last 4 Digits</Label>
                  <Input
                    type="text"
                    placeholder="1234"
                    maxLength={4}
                    value={lastFourDigits || ""}
                    onChange={(e) => onLastFourDigitsChange?.(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === "cash" && (
            <div className="space-y-2">
              <Label>Cash Received</Label>
              <Input
                type="number"
                placeholder="Enter amount received"
                value={cashReceived}
                onChange={(e) => onCashReceivedChange(e.target.value)}
                step="0.01"
              />
              {cashReceived && parseFloat(cashReceived) >= grandTotal && (
                <p className="text-sm text-muted-foreground">
                  Change: ${change.toFixed(2)}
                </p>
              )}
            </div>
          )}

          <Button 
            variant="outline" 
            onClick={onSplitPayment}
            className="w-full"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Split Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};