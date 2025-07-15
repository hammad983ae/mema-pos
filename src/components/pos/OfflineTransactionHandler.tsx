import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CartItem } from '@/pages/POS';
import { offlineStorage, OfflineTransaction } from '@/services/offlineStorage';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff, Receipt, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface OfflineTransactionHandlerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  tax: number;
  tip: number;
  discount: number;
  total: number;
  onTransactionComplete: () => void;
  storeId: string;
  userId: string;
  businessId: string;
  customerId?: string;
}

export const OfflineTransactionHandler = ({
  isOpen,
  onClose,
  items,
  subtotal,
  tax,
  tip,
  discount,
  total,
  onTransactionComplete,
  storeId,
  userId,
  businessId,
  customerId
}: OfflineTransactionHandlerProps) => {
  const { isOnline } = useNetworkStatus();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const handleOfflineTransaction = async () => {
    setIsProcessing(true);
    
    try {
      await offlineStorage.init();
      
      const transactionId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      
      const transaction: Omit<OfflineTransaction, 'integrity_hash'> = {
        id: transactionId,
        timestamp,
        items,
        subtotal,
        tax,
        tip,
        discount,
        total,
        paymentMethod,
        customerId,
        storeId,
        userId,
        businessId,
        synced: false
      };

      // Generate integrity hash
      const integrity_hash = offlineStorage.generateIntegrityHash(transaction);
      const finalTransaction: OfflineTransaction = {
        ...transaction,
        integrity_hash
      };

      // Store transaction locally
      await offlineStorage.storeTransaction(finalTransaction);

      // Generate and store offline receipt
      const receiptContent = generateOfflineReceipt(finalTransaction);
      await offlineStorage.storeReceipt({
        id: `receipt_${transactionId}`,
        transactionId,
        content: receiptContent,
        timestamp
      });

      toast.success('Transaction saved offline successfully');
      onTransactionComplete();
      onClose();

    } catch (error) {
      console.error('Failed to save offline transaction:', error);
      toast.error('Failed to save transaction offline');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateOfflineReceipt = (transaction: OfflineTransaction): string => {
    const timestamp = new Date(transaction.timestamp).toLocaleString();
    
    let receipt = `
OFFLINE RECEIPT
===============
Date: ${timestamp}
Transaction ID: ${transaction.id}
${transaction.customerId ? `Customer ID: ${transaction.customerId}` : ''}

ITEMS:
------`;

    transaction.items.forEach(item => {
      receipt += `\n${item.name}`;
      receipt += `\n  Qty: ${item.quantity} x $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}`;
    });

    receipt += `\n\nSUMMARY:
--------
Subtotal: $${transaction.subtotal.toFixed(2)}`;
    
    if (transaction.discount > 0) {
      receipt += `\nDiscount: -$${transaction.discount.toFixed(2)}`;
    }
    
    if (transaction.tip > 0) {
      receipt += `\nTip: $${transaction.tip.toFixed(2)}`;
    }
    
    receipt += `\nTax: $${transaction.tax.toFixed(2)}`;
    receipt += `\nTOTAL: $${transaction.total.toFixed(2)}`;
    receipt += `\nPayment: ${transaction.paymentMethod.toUpperCase()}`;
    receipt += `\n\n* Transaction processed offline *`;
    receipt += `\n* Will sync when online *`;
    
    return receipt;
  };

  const printOfflineReceipt = () => {
    // Create a simple print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const receiptContent = generateOfflineReceipt({
        id: 'temp',
        timestamp: new Date().toISOString(),
        items,
        subtotal,
        tax,
        tip,
        discount,
        total,
        paymentMethod,
        customerId,
        storeId,
        userId,
        businessId,
        synced: false,
        integrity_hash: 'temp'
      });

      printWindow.document.write(`
        <html>
          <head>
            <title>Offline Receipt</title>
            <style>
              body { font-family: monospace; white-space: pre; margin: 20px; }
            </style>
          </head>
          <body>${receiptContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WifiOff className="h-5 w-5 text-destructive" />
            Offline Transaction Mode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isOnline && (
            <Alert>
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                You're currently offline. This transaction will be stored locally and synced when connection is restored.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h4 className="font-medium">Transaction Summary</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Items:</span>
                <span>{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount:</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              {tip > 0 && (
                <div className="flex justify-between">
                  <span>Tip:</span>
                  <span>${tip.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {['cash', 'card'].map((method) => (
                <Button
                  key={method}
                  variant={paymentMethod === method ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaymentMethod(method)}
                  className="capitalize"
                >
                  {method}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={printOfflineReceipt}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Receipt className="h-4 w-4 mr-2" />
              Preview Receipt
            </Button>
            <Button
              onClick={handleOfflineTransaction}
              disabled={isProcessing}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Complete Sale'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};