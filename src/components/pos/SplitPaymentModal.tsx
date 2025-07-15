import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, CreditCard, DollarSign, Smartphone, Gift, Receipt, AlertCircle } from "lucide-react";

interface SplitPayment {
  id: string;
  method: string;
  amount: number;
  cardType?: string;
  referenceNumber?: string;
  isProcessed?: boolean;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  gateway?: string;
  errorMessage?: string;
}

interface SplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirm: (payments: SplitPayment[]) => void;
  enabledPaymentMethods?: string[];
  activeGateway?: string;
}

export const SplitPaymentModal = ({
  isOpen,
  onClose,
  totalAmount,
  onConfirm,
  enabledPaymentMethods = ['card', 'cash', 'digital_wallet', 'gift_card', 'check'],
  activeGateway = 'stripe_terminal'
}: SplitPaymentModalProps) => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<SplitPayment[]>([
    { id: "1", method: "card", amount: totalAmount, processingStatus: 'pending' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [allowPartialApproval, setAllowPartialApproval] = useState(true);
  const [requireSignature, setRequireSignature] = useState(false);
  const [minimumCashAmount] = useState(0.01);
  const [maximumCashAmount] = useState(1000.00);

  const paymentMethodOptions = [
    { value: 'card', label: 'Credit/Debit Card', icon: CreditCard, color: 'text-blue-600' },
    { value: 'cash', label: 'Cash', icon: DollarSign, color: 'text-green-600' },
    { value: 'digital_wallet', label: 'Digital Wallet', icon: Smartphone, color: 'text-purple-600' },
    { value: 'gift_card', label: 'Gift Card', icon: Gift, color: 'text-orange-600' },
    { value: 'check', label: 'Check', icon: Receipt, color: 'text-gray-600' }
  ].filter(option => enabledPaymentMethods.includes(option.value));

  const addPayment = () => {
    const remainingAmount = totalAmount - getTotalAllocated();
    if (remainingAmount > 0) {
      setPayments([...payments, {
        id: Date.now().toString(),
        method: "card",
        amount: remainingAmount,
        processingStatus: 'pending'
      }]);
    }
  };

  const removePayment = (id: string) => {
    if (payments.length > 1) {
      setPayments(payments.filter(p => p.id !== id));
    }
  };

  const updatePayment = (id: string, field: keyof SplitPayment, value: any) => {
    setPayments(payments.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const getTotalAllocated = () => {
    return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  const getRemainingAmount = () => {
    return totalAmount - getTotalAllocated();
  };

  const validateCashAmount = (amount: number) => {
    if (amount < minimumCashAmount) {
      return `Minimum cash amount is $${minimumCashAmount.toFixed(2)}`;
    }
    if (amount > maximumCashAmount) {
      return `Maximum cash amount is $${maximumCashAmount.toFixed(2)}`;
    }
    return null;
  };

  const processIndividualPayment = async (payment: SplitPayment): Promise<SplitPayment> => {
    // Simulate payment processing
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate
        
        resolve({
          ...payment,
          processingStatus: success ? 'completed' : 'failed',
          isProcessed: true,
          referenceNumber: success ? `REF${Date.now()}${Math.floor(Math.random() * 1000)}` : undefined,
          gateway: payment.method === 'card' ? activeGateway : undefined,
          errorMessage: success ? undefined : 'Payment declined - insufficient funds'
        });
      }, Math.random() * 2000 + 1000); // 1-3 second processing time
    });
  };

  const handleConfirm = async () => {
    const totalAllocated = getTotalAllocated();
    const difference = Math.abs(totalAmount - totalAllocated);
    
    if (difference > 0.01) {
      toast({
        title: "Payment Error",
        description: `Total payments must equal $${totalAmount.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    // Validate cash amounts
    for (const payment of payments) {
      if (payment.method === 'cash') {
        const cashError = validateCashAmount(payment.amount);
        if (cashError) {
          toast({
            title: "Cash Amount Error",
            description: cashError,
            variant: "destructive",
          });
          return;
        }
      }
    }

    setIsProcessing(true);

    try {
      // Process payments sequentially or in parallel based on setting
      const processedPayments: SplitPayment[] = [];
      
      for (const payment of payments) {
        setPayments(prev => prev.map(p => 
          p.id === payment.id 
            ? { ...p, processingStatus: 'processing' }
            : p
        ));

        const result = await processIndividualPayment(payment);
        processedPayments.push(result);

        setPayments(prev => prev.map(p => 
          p.id === payment.id ? result : p
        ));

        // If payment failed and partial approval is not allowed, stop processing
        if (result.processingStatus === 'failed' && !allowPartialApproval) {
          toast({
            title: "Payment Failed",
            description: `${payment.method.toUpperCase()} payment failed: ${result.errorMessage}`,
            variant: "destructive",
          });
          return;
        }
      }

      // Check if we have enough successful payments
      const successfulPayments = processedPayments.filter(p => p.processingStatus === 'completed');
      const successfulAmount = successfulPayments.reduce((sum, p) => sum + p.amount, 0);

      if (successfulAmount >= totalAmount * 0.95) { // Allow 5% tolerance for partial approvals
        onConfirm(processedPayments);
        toast({
          title: "Payment Successful",
          description: `Split payment processed successfully${successfulPayments.length < processedPayments.length ? ' (partial approval)' : ''}`,
        });
        onClose();
      } else {
        toast({
          title: "Insufficient Payment",
          description: `Only $${successfulAmount.toFixed(2)} of $${totalAmount.toFixed(2)} was successfully processed.`,
          variant: "destructive",
        });
      }

    } catch (error) {
      toast({
        title: "Processing Error",
        description: "An error occurred while processing payments.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Enhanced Split Payment
            {activeGateway && (
              <Badge variant="outline" className="ml-2 text-xs">
                {activeGateway.replace('_', ' ').toUpperCase()}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Total Amount */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount:</span>
                <span className="text-lg font-bold">${totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Processing Options */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-info" />
                <span className="font-medium text-sm">Processing Options</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="partial-approval" className="text-sm">Allow Partial Approvals</Label>
                <Switch
                  id="partial-approval"
                  checked={allowPartialApproval}
                  onCheckedChange={setAllowPartialApproval}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="require-signature" className="text-sm">Require Signature</Label>
                <Switch
                  id="require-signature"
                  checked={requireSignature}
                  onCheckedChange={setRequireSignature}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <div className="space-y-3">
            {payments.map((payment, index) => {
              const methodOption = paymentMethodOptions.find(opt => opt.value === payment.method);
              
              return (
                <Card key={payment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Payment {index + 1}</span>
                        {payment.processingStatus && payment.processingStatus !== 'pending' && (
                          <Badge 
                            variant={
                              payment.processingStatus === 'completed' ? 'default' :
                              payment.processingStatus === 'processing' ? 'secondary' :
                              'destructive'
                            }
                          >
                            {payment.processingStatus.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {payment.referenceNumber && (
                          <Badge variant="outline" className="text-xs">
                            REF: {payment.referenceNumber}
                          </Badge>
                        )}
                        {payments.length > 1 && !isProcessing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePayment(payment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>Payment Method</Label>
                        <Select
                          value={payment.method}
                          onValueChange={(value) => updatePayment(payment.id, "method", value)}
                          disabled={isProcessing}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethodOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <option.icon className={`h-4 w-4 ${option.color}`} />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={payment.amount || ""}
                          onChange={(e) => updatePayment(payment.id, "amount", parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          disabled={isProcessing}
                        />
                        {payment.method === 'cash' && payment.amount > 0 && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Min: ${minimumCashAmount.toFixed(2)} | Max: ${maximumCashAmount.toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Card Type Selection for Card Payments */}
                      {payment.method === 'card' && (
                        <div>
                          <Label>Card Type</Label>
                          <Select
                            value={payment.cardType || 'credit'}
                            onValueChange={(value) => updatePayment(payment.id, "cardType", value)}
                            disabled={isProcessing}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="credit">Credit Card</SelectItem>
                              <SelectItem value="debit">Debit Card</SelectItem>
                              <SelectItem value="prepaid">Prepaid Card</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Processing Status Indicator */}
                      {payment.processingStatus === 'processing' && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          Processing payment...
                        </div>
                      )}

                      {/* Error Message */}
                      {payment.errorMessage && (
                        <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                          {payment.errorMessage}
                        </div>
                      )}

                      {/* Gateway Information for Card Payments */}
                      {payment.method === 'card' && payment.gateway && (
                        <div className="text-xs text-muted-foreground">
                          Gateway: {payment.gateway.replace('_', ' ').toUpperCase()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Add Payment Button */}
          {getRemainingAmount() > 0.01 && (
            <Button
              variant="outline"
              onClick={addPayment}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          )}

          {/* Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Allocated:</span>
                  <span>${getTotalAllocated().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining:</span>
                  <span className={getRemainingAmount() > 0.01 ? "text-destructive" : "text-success"}>
                    ${getRemainingAmount().toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={Math.abs(getRemainingAmount()) > 0.01 || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                'Process Split Payment'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};