import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard, Home, Receipt, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_RECEIPT,
  GET_OWNERS_AND_MANAGERS,
  Mutation,
  MutationCreateReceiptArgs,
  NotificationType,
  PaymentType,
  PosSession,
  Query,
} from "@/graphql";
import { showSuccess } from "@/hooks/useToastMessages.tsx";
import { PaymentMethod } from "@/components/pos/checkout/PaymentMethodStep.tsx";

export default function CheckoutComplete() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, business } = useAuth();
  const { createNotification, refetchNotifications } = useNotifications();
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [createReceipt, { loading }] = useMutation<
    Mutation,
    MutationCreateReceiptArgs
  >(CREATE_RECEIPT);
  const { data } = useQuery<Query>(GET_OWNERS_AND_MANAGERS);

  // Get all checkout data
  const cartData = useMemo(
    () =>
      JSON.parse(
        localStorage.getItem("pos_cart") || '{"items": [], "total": 0}',
      ),
    [],
  );
  const customerData = useMemo(
    () => JSON.parse(localStorage.getItem("checkout_customer") || "null"),
    [],
  );
  const paymentData = useMemo(
    () => JSON.parse(localStorage.getItem("checkout_payment") || "[]"),
    [],
  );
  const salesTeamData = useMemo(
    () =>
      JSON.parse(
        localStorage.getItem("checkout_sales_team") || '{"employees": []}',
      ),
    [],
  );

  useEffect(() => {
    if (!paymentData.length || !salesTeamData.length) {
      navigate("/checkout/customer");
      return;
    }

    // Simulate processing the sale
    if (!loading && !orderNumber) processOrder();
  }, [customerData, paymentData, salesTeamData, navigate]);

  const processOrder = () => {
    const session = PosSession();

    createReceipt({
      variables: {
        input: {
          payment_methods: paymentData.map(({ id, ...item }) => ({
            ...item,
            amount: item.amount.toString(),
          })),
          items: cartData.items.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price.toString(),
          })),
          employees: salesTeamData.map((item) => ({
            user_id: item.employeeId,
            split_share: item.amount.toString(),
          })),
          sub_total: cartData.subtotal.toString(),
          discount_total: cartData.discount.toString(),
          tax_total: cartData.tax.toString(),
          tip_total: cartData.tip.toString(),
          grand_total: cartData.total.toString(),
          storeId: session.store.id,
        },
      },
    })
      .then((res) => {
        const newOrderNumber = res.data.createReceipt.receipt_number;

        setOrderNumber(newOrderNumber);

        sendOrderCompletionNotifications(newOrderNumber);

        showSuccess("Order Completed!");
      })
      .catch(() => {
        navigate("/checkout/customer");
      });
  };

  const sendOrderCompletionNotifications = async (orderNumber: string) => {
    try {
      if (!user || !business || !data.getOwnersAndManagersOfBusiness) return;

      const customerName =
        customerData?.first_name && customerData?.last_name
          ? `${customerData.first_name} ${customerData.last_name}`
          : "Walk-in Customer";

      const notificationPromises = data.getOwnersAndManagersOfBusiness.map(
        (member) =>
          createNotification(
            NotificationType.OrderCompleted,
            "New Order Completed",
            `Order ${orderNumber} completed for ${customerName} - Total: $${cartData.total?.toFixed(2) || "0.00"}`,
            {
              orderNumber,
              customerName,
              total: cartData.total,
              employeeCount: salesTeamData.length,
              paymentMethodCount: paymentData.length,
            },
            member.id,
          ),
      );

      await Promise.all(notificationPromises);
      refetchNotifications();
    } catch (error) {
      console.error("Error sending order completion notifications:", error);
    }
  };

  const handleNewOrder = () => {
    // Clear checkout data
    localStorage.removeItem("pos_cart");
    localStorage.removeItem("checkout_customer");
    localStorage.removeItem("checkout_payment");
    localStorage.removeItem("checkout_sales_team");

    navigate("/pos");
  };

  const handlePrintReceipt = () => {
    // Implement receipt printing logic
    toast({
      title: "Printing Receipt",
      description: "Receipt is being prepared for printing.",
    });
  };

  const formatPaymentMethod = (method: PaymentMethod) => {
    if (method.type === PaymentType.Card) {
      return `${method.card_type?.toUpperCase()} ****${method.last_four_digits}`;
    } else if (method.type === PaymentType.Check) {
      return `Check #${method.check_number}`;
    } else {
      return method.type.charAt(0).toUpperCase() + method.type.slice(1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <h2 className="text-xl font-semibold">Processing Order...</h2>
              <p className="text-muted-foreground">
                Please wait while we complete your transaction
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <div className="w-8 h-8 bg-success text-white rounded-full flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <span className="text-muted-foreground">Employees</span>
            </div>
            <div className="flex-1 h-1 bg-success mx-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-success text-white rounded-full flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <span className="font-medium text-success">Complete</span>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-success mx-auto" />
              <h1 className="text-3xl font-bold text-success">
                Order Complete!
              </h1>
              <p className="text-xl">
                Ref: <span className="font-mono font-bold">{orderNumber}</span>
              </p>
              <p className="text-muted-foreground">
                Thank you for your business
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Customer & Total */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer & Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">
                    {customerData?.first_name && customerData?.last_name
                      ? `${customerData.first_name} ${customerData.last_name}`
                      : "Walk-in Customer"}
                  </p>
                  {customerData?.email && (
                    <p className="text-sm text-muted-foreground">
                      {customerData.email}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">
                    ${cartData.total?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {paymentData.map((method: PaymentMethod, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span>{formatPaymentMethod(method)}</span>
                    <span className="font-medium">
                      ${method.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Team */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {salesTeamData?.map((employee) => (
                <Badge variant="outline">
                  Sales Person ID: {employee.employeeId}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handlePrintReceipt} className="flex-1">
            <Receipt className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>

          <Button onClick={handleNewOrder} variant="outline" className="flex-1">
            <Home className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>
    </div>
  );
}
