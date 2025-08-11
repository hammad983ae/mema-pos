import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { CustomerSelection } from "@/components/checkout/CustomerSelection";
import { useAuth } from "@/hooks/useAuth.tsx";

interface Customer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  loyalty_points: number | null;
  date_of_birth: string | null;
  notes: string | null;
}

export default function CheckoutCustomer() {
  const navigate = useNavigate();
  const { business } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  // Get cart data from localStorage or context
  const cartData = JSON.parse(
    localStorage.getItem("pos_cart") || '{"items": [], "total": 0}',
  );

  useEffect(() => {
    // Load previously selected customer if any
    const savedCustomer = localStorage.getItem("checkout_customer");
    if (savedCustomer && savedCustomer !== "null") {
      try {
        setSelectedCustomer(JSON.parse(savedCustomer));
      } catch (error) {
        console.error("Error parsing saved customer:", error);
      }
    }
  }, []);

  // Check if cart has shipping items - only items with shipping_required = true
  const hasShippingItems =
    cartData.items?.some((item: any) => item.shipping_required === true) ||
    false;

  // Debug logging
  // console.log("Has shipping items:", hasShippingItems);
  // console.log("Customer has address check:", {
  //   hasCustomer: !!selectedCustomer,
  //   hasAddress1: selectedCustomer?.address_line_1,
  //   hasCity: selectedCustomer?.city,
  //   hasState: selectedCustomer?.state_province,
  //   hasPostal: selectedCustomer?.postal_code,
  // });

  // Check if customer has address
  const customerHasAddress =
    selectedCustomer &&
    selectedCustomer.address_line_1 &&
    selectedCustomer.city &&
    selectedCustomer.state_province &&
    selectedCustomer.postal_code;

  // console.log("Customer has address:", customerHasAddress);
  // console.log("Selected customer:", selectedCustomer);

  // Determine if continue button should be disabled
  // For guest checkout (selectedCustomer is null), we should allow continuing if no shipping items
  // For registered customers, we need address if there are shipping items
  const canContinue =
    selectedCustomer === null
      ? !hasShippingItems
      : !hasShippingItems || customerHasAddress;

  // console.log("Can continue:", canContinue);

  const handleContinue = () => {
    // console.log("Continue button clicked!");
    // console.log("Can continue:", canContinue);
    // console.log("Selected customer:", selectedCustomer);

    if (!canContinue) {
      console.log("Cannot continue - button should be disabled");
      return;
    }

    // Store customer data for next step
    localStorage.setItem("checkout_customer", JSON.stringify(selectedCustomer));
    console.log("Navigating to /checkout/payment");
    navigate("/checkout/payment");
  };

  const handleBack = () => {
    navigate("/pos");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to POS
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <span className="font-medium">Customer</span>
            </div>
            <div className="flex-1 h-1 bg-muted mx-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm">
                2
              </div>
              <span className="text-muted-foreground">Payment</span>
            </div>
            <div className="flex-1 h-1 bg-muted mx-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm">
                3
              </div>
              <span className="text-muted-foreground">Employees</span>
            </div>
            <div className="flex-1 h-1 bg-muted mx-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm">
                4
              </div>
              <span className="text-muted-foreground">Complete</span>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>{cartData.items?.length || 0} items</span>
                <span>
                  Subtotal: ${cartData.subtotal?.toFixed(2) || "0.00"}
                </span>
              </div>

              {cartData.tip > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tip</span>
                  <span>${cartData.tip?.toFixed(2) || "0.00"}</span>
                </div>
              )}

              {cartData.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-${cartData.discount?.toFixed(2) || "0.00"}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${cartData.tax?.toFixed(2) || "0.00"}</span>
              </div>

              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold">
                    ${cartData.total?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CustomerSelection
              selectedCustomer={selectedCustomer}
              onSelectCustomer={(customer) => {
                console.log("Parent onSelectCustomer called with:", customer);
                setSelectedCustomer(customer);
                // Save to localStorage immediately when customer changes
                localStorage.setItem(
                  "checkout_customer",
                  JSON.stringify(customer),
                );
                console.log(
                  "State updated, selectedCustomer is now:",
                  customer,
                );
              }}
              businessId={business?.id}
            />

            {/* Address Warning for Shipping Items */}
            {hasShippingItems && !customerHasAddress && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Shipping address required
                </p>
                <p className="text-sm text-destructive/80 mt-1">
                  Your cart contains items that require shipping. Please add a
                  complete address to the selected customer.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                onClick={handleContinue}
                disabled={!canContinue}
                className={!canContinue ? "opacity-50 cursor-not-allowed" : ""}
              >
                Continue to Payment ({canContinue ? "enabled" : "disabled"})
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
