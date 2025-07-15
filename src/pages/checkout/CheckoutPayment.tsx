import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { PaymentMethodStep, PaymentMethod } from "@/components/pos/checkout/PaymentMethodStep";

export default function CheckoutPayment() {
  const navigate = useNavigate();
  
  // Load saved payment methods from localStorage
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => {
    const saved = localStorage.getItem('checkout_payment');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Get data from previous steps
  const cartData = JSON.parse(localStorage.getItem('pos_cart') || '{"items": [], "total": 0}');
  const customerData = JSON.parse(localStorage.getItem('checkout_customer') || 'null');
  const grandTotal = cartData.total || 0;

  useEffect(() => {
    // Check if we have a valid checkout state (either customer data or guest checkout)
    const isGuestCheckout = localStorage.getItem('guest_checkout') === 'true';
    
    // Redirect if no customer data and not guest checkout
    if (!customerData && !isGuestCheckout) {
      navigate('/checkout/customer');
    }
  }, [customerData, navigate]);

  const handleContinue = () => {
    // Store payment methods for next step
    localStorage.setItem('checkout_payment', JSON.stringify(paymentMethods));
    navigate('/checkout/sales-team');
  };

  const handleBack = () => {
    navigate('/checkout/customer');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-success text-white rounded-full flex items-center justify-center text-sm font-semibold">✓</div>
              <span className="text-muted-foreground">Customer</span>
            </div>
            <div className="flex-1 h-1 bg-success mx-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">2</div>
              <span className="font-medium">Payment</span>
            </div>
            <div className="flex-1 h-1 bg-muted mx-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm">3</div>
              <span className="text-muted-foreground">Employees</span>
            </div>
            <div className="flex-1 h-1 bg-muted mx-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm">4</div>
              <span className="text-muted-foreground">Complete</span>
            </div>
          </div>
        </div>

        {/* Customer Info Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Customer & Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">
                  {customerData?.first_name || 'Walk-in Customer'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-bold text-xl">${grandTotal.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Component */}
        <PaymentMethodStep
          grandTotal={grandTotal}
          paymentMethods={paymentMethods}
          onPaymentMethodsChange={setPaymentMethods}
          onNext={handleContinue}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}