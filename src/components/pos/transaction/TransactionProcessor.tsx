import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CartItem } from "@/pages/POS";
import { ReceiptPreference } from "./ReceiptPreferenceSelector";
import { paymentProcessor, PaymentRequest } from "@/services/PaymentProcessor";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useRetry } from "@/hooks/useRetry";
import { CreditCard, WifiOff, CheckCircle } from "lucide-react";
import { ErrorAlert } from "@/components/ui/error-alert";
import { RetryButton } from "@/components/ui/retry-button";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  loyalty_points: number;
  total_spent?: number;
}

interface TransactionProcessorProps {
  items: CartItem[];
  grandTotal: number;
  paymentMethod: string;
  cashReceived: string;
  customer: Customer | null;
  notes: string;
  businessSettings: any;
  minimumSaleAmount: number;
  receiptPreference: ReceiptPreference;
  receiptEmail: string;
  onManagerApprovalRequired: () => void;
  onOfflineTransaction: () => void;
  onTransactionComplete: (orderNumber: string, receiptData: any) => void;
  disabled?: boolean;
}

export const TransactionProcessor = ({
  items,
  grandTotal,
  paymentMethod,
  cashReceived,
  customer,
  notes,
  businessSettings,
  minimumSaleAmount,
  receiptPreference,
  receiptEmail,
  onManagerApprovalRequired,
  onOfflineTransaction,
  onTransactionComplete,
  disabled = false
}: TransactionProcessorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const { withErrorHandling } = useErrorHandler();
  const { retry, isRetrying } = useRetry();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<{
    isProcessing: boolean;
    currentStep?: string;
    progress?: number;
  }>({ isProcessing: false });

  const canProcessPayment = () => {
    if (paymentMethod === "cash") {
      return parseFloat(cashReceived) >= grandTotal;
    }
    return true;
  };

  const processTransactionOperation = async () => {
    if (!user) {
      throw new Error("You must be logged in to process transactions.");
    }

    // Check if manager approval is required
    if (businessSettings?.requireManagerApproval && grandTotal < minimumSaleAmount) {
      onManagerApprovalRequired();
      return;
    }

    // Check if offline
    if (!isOnline) {
      onOfflineTransaction();
      return;
    }

    // Generate order number
    const orderNumber = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    setProcessingStatus({
      isProcessing: true,
      currentStep: "Preparing transaction...",
      progress: 10
    });

    // Process payment for card transactions
    if (paymentMethod === "card") {
      setProcessingStatus({
        isProcessing: true,
        currentStep: "Processing payment...",
        progress: 30
      });

      const paymentRequest: PaymentRequest = {
        amount: grandTotal,
        method: "card",
        customerData: customer ? {
          id: customer.id,
          email: customer.email,
          name: `${customer.first_name} ${customer.last_name}`
        } : undefined,
        metadata: {
          orderNumber: orderNumber
        }
      };

      const paymentResult = await paymentProcessor.processPayment(paymentRequest);
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.errorMessage || "Payment failed");
      }
    }

    setProcessingStatus({
      isProcessing: true,
      currentStep: "Creating order...",
      progress: 60
    });

    // Create order in database
    const orderData = {
      order_number: orderNumber,
      customer_id: customer?.id || null,
      total_amount: grandTotal,
      payment_method: paymentMethod,
      status: "completed",
      notes: notes || "",
      business_id: businessSettings?.businessId,
      store_id: businessSettings?.storeId,
      user_id: user.id
    };

    const { data: order, error } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (error) throw error;

    setProcessingStatus({
      isProcessing: true,
      currentStep: "Finalizing...",
      progress: 90
    });

    // Update customer loyalty points if applicable
    if (customer && businessSettings?.loyaltyPointsEnabled) {
      const pointsEarned = Math.floor(grandTotal * (businessSettings?.loyaltyPointsRate || 0.01));
      await supabase
        .from("customers")
        .update({ 
          loyalty_points: customer.loyalty_points + pointsEarned,
          total_spent: (customer.total_spent || 0) + grandTotal
        })
        .eq("id", customer.id);
    }

    setProcessingStatus({
      isProcessing: true,
      currentStep: "Complete!",
      progress: 100
    });

    // Prepare receipt data
    const receiptData = {
      orderNumber,
      items,
      totalAmount: grandTotal,
      paymentMethod,
      customer,
      timestamp: new Date().toISOString(),
      cashReceived: paymentMethod === "cash" ? parseFloat(cashReceived) : null,
      change: paymentMethod === "cash" ? parseFloat(cashReceived) - grandTotal : 0
    };

    setTimeout(() => {
      onTransactionComplete(orderNumber, receiptData);
      setIsProcessing(false);
      setProcessingError(null);
      setProcessingStatus({ isProcessing: false });
    }, 1000);
  };

  const processTransaction = async () => {
    setIsProcessing(true);
    setProcessingError(null);
    setProcessingStatus({
      isProcessing: true,
      currentStep: "Preparing transaction...",
      progress: 10
    });

    const wrappedOperation = withErrorHandling(
      processTransactionOperation,
      'transaction-processing',
      { maxRetries: 2, delay: 1000 }
    );

    try {
      await wrappedOperation();
    } catch (error: any) {
      setProcessingError(error.message || "Transaction failed. Please try again.");
      setIsProcessing(false);
      setProcessingStatus({ isProcessing: false });
    }
  };

  const retryTransaction = async () => {
    try {
      await retry(processTransactionOperation, { maxAttempts: 3 });
      setProcessingError(null);
    } catch (error: any) {
      setProcessingError(error.message || "Transaction failed after multiple attempts.");
    }
  };

  if (processingStatus.isProcessing) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          {processingStatus.progress === 100 ? (
            <CheckCircle className="h-8 w-8 text-green-500" />
          ) : (
            <CreditCard className="h-8 w-8 animate-pulse" />
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">{processingStatus.currentStep}</p>
          <Progress value={processingStatus.progress} className="w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isOnline && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <WifiOff className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">Offline mode - transaction will be queued</span>
        </div>
      )}

      {processingError && (
        <ErrorAlert
          message={processingError}
          onRetry={retryTransaction}
          onDismiss={() => setProcessingError(null)}
        />
      )}

      <Button
        onClick={processTransaction}
        disabled={!canProcessPayment() || isProcessing || isRetrying || disabled}
        className="w-full"
        size="lg"
      >
        {isRetrying ? "Retrying..." : isProcessing ? "Processing..." : 
         paymentMethod === "cash" ? "Complete Cash Sale" : "Process Payment"}
        {paymentMethod === "cash" && !isProcessing && !isRetrying && ` - $${grandTotal.toFixed(2)}`}
      </Button>

      {disabled && (receiptPreference === 'email' || receiptPreference === 'both') && !receiptEmail && (
        <p className="text-sm text-red-500 text-center">
          Email address is required for email receipts
        </p>
      )}

      {paymentMethod === "cash" && parseFloat(cashReceived) < grandTotal && (
        <p className="text-sm text-muted-foreground text-center">
          Insufficient cash amount
        </p>
      )}
    </div>
  );
};