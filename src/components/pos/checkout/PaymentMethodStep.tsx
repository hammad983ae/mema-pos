import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Banknote,
  Check,
  CreditCard,
  DollarSign,
  Plus,
  Trash2,
} from "lucide-react";
import { showError } from "@/hooks/useToastMessages.tsx";
import { CardType, PaymentType } from "@/graphql";

export interface PaymentMethod {
  id: string;
  type: PaymentType;
  amount: number;
  card_type?: CardType;
  last_four_digits?: string;
  check_number?: string;
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
  const [currentMethod, setCurrentMethod] = useState<Partial<PaymentMethod>>({
    type: PaymentType.Card,
    amount: 0,
  });
  const totalAllocated = useMemo(
    () => paymentMethods.reduce((sum, method) => sum + method.amount, 0),
    [paymentMethods],
  );
  const remainingAmount = useMemo(
    () => grandTotal - totalAllocated,
    [grandTotal, totalAllocated],
  );

  useEffect(() => {
    if (currentMethod.amount === 0 && !!remainingAmount) {
      setCurrentMethod((prev) => ({
        ...prev,
        amount: remainingAmount,
      }));
    }
  }, [remainingAmount]);

  // Save payment methods to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("checkout_payment", JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  console.log("curr", currentMethod);
  const addPaymentMethod = () => {
    if (
      !currentMethod.type ||
      !currentMethod.amount ||
      currentMethod.amount <= 0
    ) {
      showError(
        "Invalid Payment",
        "Please select a payment type and enter a valid amount.",
      );
      return;
    }

    if (currentMethod.amount > remainingAmount) {
      showError(
        "Amount Too High",
        `Maximum amount allowed: $${remainingAmount.toFixed(2)}`,
      );
      return;
    }

    if (
      currentMethod.type === PaymentType.Card &&
      (!currentMethod.card_type || !currentMethod.last_four_digits)
    ) {
      showError(
        "Missing Card Details",
        "Please select card type and enter last 4 digits.",
      );
      return;
    }

    if (
      currentMethod.type === PaymentType.Check &&
      !currentMethod.check_number
    ) {
      showError("Missing Check Number", "Please enter the check number.");
      return;
    }

    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: currentMethod.type as PaymentType,
      amount: currentMethod.amount,
      ...(currentMethod.type === PaymentType.Card && {
        card_type: currentMethod.card_type,
        last_four_digits: currentMethod.last_four_digits,
      }),
      ...(currentMethod.type === PaymentType.Check && {
        check_number: currentMethod.check_number,
      }),
    };

    onPaymentMethodsChange([...paymentMethods, newMethod]);

    // Save to localStorage for persistence
    localStorage.setItem(
      "checkout_payment",
      JSON.stringify([...paymentMethods, newMethod]),
    );

    // Reset form
    setCurrentMethod({
      type: PaymentType.Card,
      amount: remainingAmount > 0 ? Math.round(remainingAmount * 100) / 100 : 0,
    });
  };

  const removePaymentMethod = (id: string) => {
    const updatedMethods = paymentMethods.filter((method) => method.id !== id);
    onPaymentMethodsChange(updatedMethods);
    // Save to localStorage for persistence
    localStorage.setItem("checkout_payment", JSON.stringify(updatedMethods));
  };

  const canProceed = Math.abs(remainingAmount) < 0.01; // Allow for small floating point differences

  const getPaymentIcon = (type: PaymentType) => {
    switch (type) {
      case PaymentType.Card:
        return <CreditCard className="h-4 w-4" />;
      case PaymentType.Cash:
        return <Banknote className="h-4 w-4" />;
      case PaymentType.Check:
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
          Total: ${grandTotal.toFixed(2)} | Allocated: $
          {totalAllocated.toFixed(2)} | Remaining: ${remainingAmount.toFixed(2)}
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
              <div
                key={method.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getPaymentIcon(method.type)}
                  <div>
                    <p className="font-medium">
                      {method.type === PaymentType.Card &&
                        `${formatCardType(method.card_type)} ****${method.last_four_digits}`}
                      {method.type === PaymentType.Cash && "Cash Payment"}
                      {method.type === PaymentType.Check &&
                        `Check #${method.check_number}`}
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
                  onValueChange={(value: PaymentType) => {
                    setCurrentMethod({
                      ...currentMethod,
                      type: value,
                      // Auto-fill the remaining amount rounded to cents when payment type is selected
                      amount:
                        remainingAmount > 0
                          ? Math.round(remainingAmount * 100) / 100
                          : currentMethod.amount,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PaymentType.Card}>
                      Credit/Debit Card
                    </SelectItem>
                    <SelectItem value={PaymentType.Cash}>Cash</SelectItem>
                    <SelectItem value={PaymentType.Check}>Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={
                    Math.round(remainingAmount * 100) / 100 ||
                    currentMethod.amount ||
                    ""
                  }
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

            {currentMethod.type === PaymentType.Card && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Card Type</Label>
                  <Select
                    value={currentMethod.card_type}
                    onValueChange={(value: CardType) =>
                      setCurrentMethod({ ...currentMethod, card_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select card type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CardType.Visa}>Visa</SelectItem>
                      <SelectItem value={CardType.Mastercard}>
                        Mastercard
                      </SelectItem>
                      <SelectItem value={CardType.Amex}>
                        American Express
                      </SelectItem>
                      <SelectItem value={CardType.Discover}>
                        Discover
                      </SelectItem>
                      <SelectItem value={CardType.Debit}>Debit Card</SelectItem>
                      <SelectItem value={CardType.Other}>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Last 4 Digits</Label>
                  <Input
                    type="text"
                    placeholder="1234"
                    maxLength={4}
                    value={currentMethod.last_four_digits || ""}
                    onChange={(e) =>
                      setCurrentMethod({
                        ...currentMethod,
                        last_four_digits: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                </div>
              </div>
            )}

            {currentMethod.type === PaymentType.Check && (
              <div>
                <Label>Check Number</Label>
                <Input
                  type="text"
                  placeholder="Enter check number"
                  value={currentMethod.check_number || ""}
                  onChange={(e) =>
                    setCurrentMethod({
                      ...currentMethod,
                      check_number: e.target.value,
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

        <Button onClick={onNext} disabled={!canProceed} className="min-w-32">
          {canProceed
            ? "Next: Employees"
            : `$${remainingAmount.toFixed(2)} Remaining`}
        </Button>
      </div>
    </div>
  );
};
