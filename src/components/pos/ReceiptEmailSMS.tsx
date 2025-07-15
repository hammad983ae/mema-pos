import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CartItem } from "@/pages/POS";
import { supabase } from "@/integrations/supabase/client";
import { Mail, MessageSquare, Receipt, Send, Check, Loader2 } from "lucide-react";

interface ReceiptEmailSMSProps {
  orderId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  tipAmount: number;
  discountAmount: number;
  total: number;
  storeName: string;
  customerEmail?: string;
  customerPhone?: string;
  onSent?: (method: 'email' | 'sms') => void;
}

export const ReceiptEmailSMS = ({
  orderId,
  items,
  subtotal,
  tax,
  tipAmount,
  discountAmount,
  total,
  storeName,
  customerEmail: initialEmail = "",
  customerPhone: initialPhone = "",
  onSent
}: ReceiptEmailSMSProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [sendEmail, setSendEmail] = useState(!!initialEmail);
  const [sendSMS, setSendSMS] = useState(!!initialPhone);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<{email: boolean, sms: boolean}>({
    email: false,
    sms: false
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatPhone = (phoneNumber: string) => {
    // Remove non-numeric characters
    const numbers = phoneNumber.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (numbers.length === 10) {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    } else if (numbers.length === 11 && numbers.startsWith('1')) {
      return `+1 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7)}`;
    }
    return phoneNumber;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length === 10 || (numbers.length === 11 && numbers.startsWith('1'));
  };

  const generateReceiptContent = () => {
    const now = new Date();
    return {
      orderId,
      storeName,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })),
      subtotal,
      tax,
      tipAmount,
      discountAmount,
      total
    };
  };

  const sendReceipt = async () => {
    if (!sendEmail && !sendSMS) {
      toast({
        title: "Error",
        description: "Please select at least one delivery method",
        variant: "destructive",
      });
      return;
    }

    if (sendEmail && !validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (sendSMS && !validatePhone(phone)) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const receiptData = generateReceiptContent();

      // Send email receipt
      if (sendEmail && email) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-email', {
            body: {
              type: 'receipt',
              to: email,
              receiptData: generateReceiptContent()
            }
          });

          if (emailError) throw emailError;

          setSent(prev => ({ ...prev, email: true }));
          onSent?.('email');
          
          toast({
            title: "Email Sent",
            description: `Receipt sent to ${email}`,
          });
        } catch (error: any) {
          toast({
            title: "Email Failed",
            description: error.message || "Failed to send email receipt",
            variant: "destructive"
          });
        }
      }

      // Send SMS receipt
      if (sendSMS && phone) {
        try {
          const { error: smsError } = await supabase.functions.invoke('send-sms', {
            body: {
              type: 'receipt',
              to: phone,
              receiptData: {
                orderNumber: receiptData?.orderId || 'N/A',
                customerName: 'Customer',
                total: receiptData?.total || 0,
                storeName: receiptData?.storeName || 'Store',
                transactionDate: new Date().toISOString()
              }
            }
          });

          if (smsError) throw smsError;

          setSent(prev => ({ ...prev, sms: true }));
          onSent?.('sms');
          
          toast({
            title: "SMS Sent",
            description: `Receipt sent to ${formatPhone(phone)}`,
          });
        } catch (error: any) {
          toast({
            title: "SMS Failed", 
            description: error.message || "Failed to send SMS receipt",
            variant: "destructive"
          });
        }
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Send Receipt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order Summary */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Order #{orderId}</div>
          <div className="font-semibold">{items.length} items • {formatPrice(total)}</div>
        </div>

        {/* Email Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="send-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Receipt
            </Label>
            <div className="flex items-center gap-2">
              {sent.email && <Check className="h-4 w-4 text-green-600" />}
              <Switch
                id="send-email"
                checked={sendEmail}
                onCheckedChange={setSendEmail}
                disabled={sent.email}
              />
            </div>
          </div>
          
          {sendEmail && !sent.email && (
            <Input
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-base"
            />
          )}

          {sent.email && (
            <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
              ✓ Receipt sent to {email}
            </div>
          )}
        </div>

        {/* SMS Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="send-sms" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS Receipt
            </Label>
            <div className="flex items-center gap-2">
              {sent.sms && <Check className="h-4 w-4 text-green-600" />}
              <Switch
                id="send-sms"
                checked={sendSMS}
                onCheckedChange={setSendSMS}
                disabled={sent.sms}
              />
            </div>
          </div>
          
          {sendSMS && !sent.sms && (
            <Input
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-base"
            />
          )}

          {sent.sms && (
            <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
              ✓ Receipt sent to {formatPhone(phone)}
            </div>
          )}
        </div>

        <Separator />

        {/* Send Button */}
        <Button
          onClick={sendReceipt}
          disabled={loading || (sent.email && sent.sms) || (!sendEmail && !sendSMS)}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Receipt
            </>
          )}
        </Button>

        {/* Status */}
        {(sent.email || sent.sms) && (
          <div className="text-center">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Receipt Delivered
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};