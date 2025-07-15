import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, CreditCard, Banknote, Check, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface PaymentMethod {
  id: string;
  type: "card" | "cash" | "check";
  amount: number;
  cardType?: "visa" | "mastercard" | "amex" | "discover" | "debit" | "other";
  lastFourDigits?: string;
  checkNumber?: string;
}

interface PaymentMethodStepProps {
  grandTotal: number;
  paymentMethods: PaymentMethod[];
  onPaymentMethodsChange: (methods: PaymentMethod[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const PaymentMethodStep = ({
  grandTotal,
  paymentMethods,
  onPaymentMethodsChange,
  onNext,
  onBack,
}: PaymentMethodStepProps) => {
  const { toast } = useToast();
  const [currentMethod, setCurrentMethod] = useState<Partial<PaymentMethod>>({
    type: "card",
    amount: 0,
  });

  // Save payment methods to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('checkout_payment', JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  const totalAllocated = paymentMethods.reduce((sum, method) => sum + method.amount, 0);
  const remainingAmount = grandTotal - totalAllocated;

  const addPaymentMethod = () => {
    if (!currentMethod.type || !currentMethod.amount || currentMethod.amount <= 0) {
      toast({
        title: "Invalid Payment",
        description: "Please select a payment type and enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    if (currentMethod.amount > remainingAmount) {
      toast({
        title: "Amount Too High",
        description: `Maximum amount allowed: $${remainingAmount.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    if (currentMethod.type === "card" && (!currentMethod.cardType || !currentMethod.lastFourDigits)) {
      toast({
        title: "Missing Card Details",
        description: "Please select card type and enter last 4 digits.",
        variant: "destructive",
      });
      return;
    }

    if (currentMethod.type === "check" && !currentMethod.checkNumber) {
      toast({
        title: "Missing Check Number",
        description: "Please enter the check number.",
        variant: "destructive",
      });
      return;
    }

    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: currentMethod.type as "card" | "cash" | "check",
      amount: currentMethod.amount,
      ...(currentMethod.type === "card" && {
        cardType: currentMethod.cardType,
        lastFourDigits: currentMethod.lastFourDigits,
      }),
      ...(currentMethod.type === "check" && {
        checkNumber: currentMethod.checkNumber,
      }),
    };

    onPaymentMethodsChange([...paymentMethods, newMethod]);
    
    // Save to localStorage for persistence
    localStorage.setItem('checkout_payment', JSON.stringify([...paymentMethods, newMethod]));
    
    // Reset form
    setCurrentMethod({
      type: "card",
      amount: remainingAmount > 0 ? Math.round(remainingAmount * 100) / 100 : 0,
    });
  };

  const removePaymentMethod = (id: string) => {
    const updatedMethods = paymentMethods.filter(method => method.id !== id);
    onPaymentMethodsChange(updatedMethods);
    // Save to localStorage for persistence
    localStorage.setItem('checkout_payment', JSON.stringify(updatedMethods));
  };

  const canProceed = Math.abs(remainingAmount) < 0.01; // Allow for small floating point differences

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case "card":
        return <CreditCard className="h-4 w-4" />;
      case "cash":
        return <Banknote className="h-4 w-4" />;
      case "check":
        return <Check className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const formatCardType = (cardType?: string) => {
    if (!cardType) return "";
    return cardType.charAt(0).toUpperCase() + cardType.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Payment Methods</h2>
        <p className="text-muted-foreground">
          Total: ${grandTotal.toFixed(2)} | 
          Allocated: ${totalAllocated.toFixed(2)} | 
          Remaining: ${remainingAmount.toFixed(2)}
        </p>
      </div>

      {/* Current Payment Methods */}
      {paymentMethods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selected Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getPaymentIcon(method.type)}
                  <div>
                    <p className="font-medium">
                      {method.type === "card" && `${formatCardType(method.cardType)} ****${method.lastFourDigits}`}
                      {method.type === "cash" && "Cash Payment"}
                      {method.type === "check" && `Check #${method.checkNumber}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${method.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePaymentMethod(method.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add New Payment Method */}
      {remainingAmount > 0.01 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Payment Type</Label>
                <Select
                  value={currentMethod.type}
                  onValueChange={(value: "card" | "cash" | "check") => {
                    setCurrentMethod({ 
                      ...currentMethod, 
                      type: value,
                      // Auto-fill the remaining amount rounded to cents when payment type is selected
                      amount: remainingAmount > 0 ? Math.round(remainingAmount * 100) / 100 : currentMethod.amount
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={currentMethod.amount || ""}
                  onChange={(e) =>
                    setCurrentMethod({
                      ...currentMethod,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  step="0.01"
                  max={remainingAmount}
                />
              </div>
            </div>

            {currentMethod.type === "card" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Card Type</Label>
                  <Select
                    value={currentMethod.cardType}
                    onValueChange={(value: "visa" | "mastercard" | "amex" | "discover" | "debit" | "other") =>
                      setCurrentMethod({ ...currentMethod, cardType: value })
                    }
                  >
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
                    value={currentMethod.lastFourDigits || ""}
                    onChange={(e) =>
                      setCurrentMethod({
                        ...currentMethod,
                        lastFourDigits: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                </div>
              </div>
            )}

            {currentMethod.type === "check" && (
              <div>
                <Label>Check Number</Label>
                <Input
                  type="text"
                  placeholder="Enter check number"
                  value={currentMethod.checkNumber || ""}
                  onChange={(e) =>
                    setCurrentMethod({
                      ...currentMethod,
                      checkNumber: e.target.value,
                    })
                  }
                />
              </div>
            )}

            <Button onClick={addPaymentMethod} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button variant="outline" onClick={onBack}>
          Back to Customer
        </Button>
        
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="min-w-32"
        >
          {canProceed ? "Next: Employees" : `$${remainingAmount.toFixed(2)} Remaining`}
        </Button>
      </div>
    </div>
  );
};