import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeesStep } from "@/components/pos/checkout/EmployeesStep";

export default function CheckoutSalesTeam() {
  const navigate = useNavigate();

  // Load saved sales team data from localStorage
  const [selectedSalesPeople, setSelectedSalesPeople] = useState<string[]>(
    () => {
      const saved = localStorage.getItem("checkout_sales_team");
      return saved ? JSON.parse(saved) : [];
    },
  );

  // Get data from previous steps
  const cartData = JSON.parse(
    localStorage.getItem("pos_cart") || '{"items": [], "total": 0}',
  );
  const customerData = JSON.parse(
    localStorage.getItem("checkout_customer") || "null",
  );
  const paymentData = JSON.parse(
    localStorage.getItem("checkout_payment") || "[]",
  );

  useEffect(() => {
    // Redirect if missing previous step data
    // Note: customerData can be null for guest checkout, so we check if the key exists
    const customerExists = localStorage.getItem("checkout_customer") !== null;
    if (!customerExists) {
      console.log("Redirecting to customer - no customer data key");
      navigate("/checkout/customer");
      return;
    }
    if (!paymentData || paymentData.length === 0) {
      console.log("Redirecting to payment - no payment data");
      navigate("/checkout/payment");
      return;
    }
  }, [customerData, paymentData, navigate]);

  const handleContinue = () => {
    // Store sales team data for final step
    localStorage.setItem(
      "checkout_sales_team",
      JSON.stringify(selectedSalesPeople),
    );
    navigate("/checkout/complete");
  };

  const handleBack = () => {
    navigate("/checkout/payment");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-success text-white rounded-full flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <span className="text-muted-foreground">Customer</span>
            </div>
            <div className="flex-1 h-1 bg-success mx-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-success text-white rounded-full flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <span className="text-muted-foreground">Payment</span>
            </div>
            <div className="flex-1 h-1 bg-success mx-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <span className="font-medium">Employees</span>
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
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">
                  {customerData?.first_name || "Walk-in Customer"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Methods</p>
                <p className="font-medium">{paymentData.length} method(s)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-bold text-xl">
                  ${cartData.total?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales People Component */}
        <EmployeesStep
          selectedSalesPeople={selectedSalesPeople}
          onSalesPeopleChange={setSelectedSalesPeople}
          onNext={handleContinue}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}
