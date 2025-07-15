import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CartItem } from "@/pages/POS";
import { SplitPaymentModal } from "./SplitPaymentModal";
import { ReceiptModal } from "./ReceiptModal";
import { PaymentGatewayManager } from "./PaymentGatewayManager";
import { ReceiptEmailSMS } from "./ReceiptEmailSMS";
import { OfflineTransactionHandler } from "./OfflineTransactionHandler";
import { ManagerApprovalDialog } from "./ManagerApprovalDialog";
import { EnhancedCustomerSearch } from "./transaction/EnhancedCustomerSearch";
import { PaymentMethodSelector } from "./transaction/PaymentMethodSelector";
import { OrderSummary } from "./transaction/OrderSummary";
import { TransactionProcessor } from "./transaction/TransactionProcessor";
import { ReceiptPreferenceSelector, ReceiptPreference } from "./transaction/ReceiptPreferenceSelector";
import { Receipt, CheckCircle } from "lucide-react";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  totalAmount: number;
  tipAmount: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  selectedCustomer?: any;
  onTransactionComplete: () => void;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  loyalty_points: number;
  address_line_1?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
}

export const TransactionModal = ({
  isOpen,
  onClose,
  items,
  totalAmount,
  tipAmount,
  discountAmount,
  taxAmount,
  grandTotal,
  selectedCustomer,
  onTransactionComplete
}: TransactionModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cashReceived, setCashReceived] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [notes, setNotes] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [isSplitPaymentOpen, setIsSplitPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [isManagerApprovalOpen, setIsManagerApprovalOpen] = useState(false);
  const [minimumSaleAmount, setMinimumSaleAmount] = useState(0);
  const [receiptPreference, setReceiptPreference] = useState<ReceiptPreference>('print');
  const [receiptEmail, setReceiptEmail] = useState("");

  // Load business settings and set customer on modal open
  useEffect(() => {
    if (isOpen) {
      loadBusinessSettings();
      setCustomer(selectedCustomer || null);
    }
  }, [isOpen, user, selectedCustomer]);

  const loadBusinessSettings = async () => {
    if (!user) return;

    try {
      const { data: userContext } = await supabase.rpc('get_user_business_context', {
        user_uuid: user.id
      });

      if (!userContext || userContext.length === 0) return;

      const businessId = userContext[0].business_id;

      // Load business settings
      const { data: business, error } = await supabase
        .from('businesses')
        .select('settings')
        .eq('id', businessId)
        .single();

      if (error) throw error;

      // Load POS specific settings
      const { data: posSettings } = await supabase
        .from('business_pos_settings')
        .select('*')
        .eq('business_id', businessId)
        .single();

      const settings = business?.settings as any || {};
      
      setBusinessSettings({
        ...settings,
        businessId,
        storeId: userContext[0].store_ids?.[0],
        minimumSaleAmount: posSettings?.minimum_sale_amount || 0,
        requireManagerApproval: posSettings?.require_manager_approval || false
      });

      setMinimumSaleAmount(posSettings?.minimum_sale_amount || 0);

    } catch (error) {
      // Error loading business settings - will use defaults
    }
  };

  const handleSplitPayment = async (payments: any[]) => {
    // Handle split payment logic here
    toast({
      title: "Split Payment",
      description: "Split payment processing is being implemented.",
    });
  };

  const handleTransactionComplete = async (orderNumber: string, receiptData: any) => {
    setOrderNumber(orderNumber);
    setReceiptData(receiptData);
    setIsComplete(true);

    // Handle email receipt if requested
    if ((receiptPreference === 'email' || receiptPreference === 'both') && receiptEmail) {
      try {
        const { error } = await supabase.functions.invoke('send-email-receipt', {
          body: {
            customerEmail: receiptEmail,
            orderId: receiptData.orderId || orderNumber,
            orderNumber: orderNumber,
            items: items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity
            })),
            subtotal: totalAmount,
            tax: taxAmount,
            tipAmount: tipAmount,
            discountAmount: discountAmount,
            total: grandTotal,
            storeName: receiptData.storeName || businessSettings?.storeName || 'Store',
            paymentMethod: paymentMethod,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
          }
        });

        if (error) {
          console.error('Failed to send email receipt:', error);
          toast({
            title: "Email Receipt Failed",
            description: "Transaction completed but email receipt failed to send",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Receipt Sent",
            description: `Email receipt sent to ${receiptEmail}`,
          });
        }
      } catch (error) {
        console.error('Error sending email receipt:', error);
      }
    }

    toast({
      title: "Transaction Complete",
      description: `Order ${orderNumber} processed successfully!`,
    });
  };

  const handleClose = () => {
    if (isComplete) {
      onTransactionComplete();
    }
    onClose();
    // Reset state
    setPaymentMethod("card");
    setCashReceived("");
    setCustomer(null);
    setNotes("");
    setIsComplete(false);
    setOrderNumber("");
    setReceiptData(null);
    setReceiptPreference('print');
    setReceiptEmail("");
  };

  const canProcessTransaction = () => {
    // Check for items requiring shipping
    const shippingItems = items.filter(item => item.shipping_required);
    if (shippingItems.length > 0 && !customer) {
      return false;
    }
    
    // Check if customer has shipping address when shipping items exist
    if (shippingItems.length > 0 && customer && !customer.address_line_1) {
      return false;
    }

    // Check email receipt validation
    if (receiptPreference === 'email' || receiptPreference === 'both') {
      if (!receiptEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiptEmail)) {
        return false;
      }
    }
    return true;
  };

  const cashChange = paymentMethod === "cash" && cashReceived 
    ? Math.max(0, parseFloat(cashReceived) - grandTotal)
    : 0;

  if (isComplete) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Transaction Complete
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Success Summary */}
            <div className="text-center">
              <div className="p-6 bg-green-50 rounded-lg">
                <Receipt className="h-12 w-12 mx-auto text-green-600 mb-2" />
                <h3 className="text-lg font-semibold">Order #{orderNumber}</h3>
                <p className="text-muted-foreground">Transaction processed successfully</p>
              </div>

              <div className="mt-4 space-y-2 text-left">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-semibold">${grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="capitalize">{paymentMethod}</span>
                </div>
                {paymentMethod === "cash" && cashChange > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Change Due:</span>
                    <span className="font-semibold">${cashChange.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Email/SMS Receipt */}
            <div className="flex gap-4">
              <div className="flex-1">
                <ReceiptEmailSMS
                  orderId={orderNumber || ""}
                  items={items}
                  subtotal={totalAmount}
                  tax={taxAmount}
                  tipAmount={tipAmount}
                  discountAmount={discountAmount}
                  total={grandTotal}
                  storeName={receiptData?.storeName || "Mema Store"}
                  customerEmail={customer?.email}
                  customerPhone={customer?.phone}
                  onSent={(method) => {
                    toast({
                      title: `Receipt Sent`,
                      description: `Receipt delivered via ${method === 'email' ? 'email' : 'SMS'}`,
                    });
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsReceiptOpen(true)}
              >
                <Receipt className="h-4 w-4 mr-2" />
                View Receipt
              </Button>
              <Button onClick={handleClose} className="flex-1">
                New Transaction
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Complete Transaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <OrderSummary
            items={items}
            totalAmount={totalAmount}
            tipAmount={tipAmount}
            discountAmount={discountAmount}
            taxAmount={taxAmount}
            grandTotal={grandTotal}
          />

          {/* Enhanced Customer Search */}
          <EnhancedCustomerSearch
            customer={customer}
            onCustomerFound={setCustomer}
            businessId={businessSettings?.businessId || ''}
            requiresShipping={items.some(item => item.shipping_required)}
          />

          {/* Payment Method */}
          <PaymentMethodSelector
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            cashReceived={cashReceived}
            onCashReceivedChange={setCashReceived}
            grandTotal={grandTotal}
            onSplitPayment={() => setIsSplitPaymentOpen(true)}
          />

          {/* Receipt Preference */}
          <ReceiptPreferenceSelector
            preference={receiptPreference}
            onPreferenceChange={setReceiptPreference}
            customerEmail={receiptEmail}
            onEmailChange={setReceiptEmail}
            disabled={isComplete}
          />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Order Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any special instructions or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Transaction Processor */}
          <TransactionProcessor
            items={items}
            grandTotal={grandTotal}
            paymentMethod={paymentMethod}
            cashReceived={cashReceived}
            customer={customer}
            notes={notes}
            businessSettings={businessSettings}
            minimumSaleAmount={minimumSaleAmount}
            receiptPreference={receiptPreference}
            receiptEmail={receiptEmail}
            onManagerApprovalRequired={() => setIsManagerApprovalOpen(true)}
            onOfflineTransaction={() => setIsOfflineModalOpen(true)}
            onTransactionComplete={handleTransactionComplete}
            disabled={!canProcessTransaction()}
          />
        </div>

        {/* Split Payment Modal */}
        <SplitPaymentModal
          isOpen={isSplitPaymentOpen}
          onClose={() => setIsSplitPaymentOpen(false)}
          totalAmount={grandTotal}
          onConfirm={handleSplitPayment}
          enabledPaymentMethods={['card', 'cash', 'digital_wallet', 'gift_card']}
          activeGateway=""
        />

        {/* Receipt Modal */}
        {receiptData && (
          <ReceiptModal
            isOpen={isReceiptOpen}
            onClose={() => setIsReceiptOpen(false)}
            receiptData={receiptData}
          />
        )}

        {/* Offline Transaction Handler */}
        <OfflineTransactionHandler
          isOpen={isOfflineModalOpen}
          onClose={() => setIsOfflineModalOpen(false)}
          items={items}
          subtotal={totalAmount}
          tax={taxAmount}
          tip={tipAmount}
          discount={discountAmount}
          total={grandTotal}
          onTransactionComplete={() => {
            setIsOfflineModalOpen(false);
            onTransactionComplete();
          }}
          storeId={businessSettings?.storeId || ''}
          userId={user?.id || ''}
          businessId={businessSettings?.businessId || ''}
          customerId={customer?.id}
        />

        {/* Manager Approval Dialog */}
        <ManagerApprovalDialog
          isOpen={isManagerApprovalOpen}
          onClose={() => setIsManagerApprovalOpen(false)}
          saleAmount={grandTotal}
          minimumAmount={minimumSaleAmount}
          onApproved={() => {
            setIsManagerApprovalOpen(false);
            // Continue with transaction after approval
            toast({
              title: "Approved",
              description: "Manager approval granted. Transaction can proceed.",
            });
          }}
          onDenied={() => {
            setIsManagerApprovalOpen(false);
            toast({
              title: "Sale Denied",
              description: "Manager approval was denied for this transaction.",
              variant: "destructive",
            });
          }}
          employeeName={user?.email || 'Unknown Employee'}
          items={items}
        />
      </DialogContent>
    </Dialog>
  );
};