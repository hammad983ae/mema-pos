import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CartItem } from "@/pages/POS";
import { Printer, Mail, Download } from "lucide-react";

interface ReceiptData {
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  tipAmount: number;
  discountAmount: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  cashReceived?: number;
  change?: number;
  timestamp: Date;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData;
}

export const ReceiptModal = ({
  isOpen,
  onClose,
  receiptData
}: ReceiptModalProps) => {

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${receiptData.orderNumber}</title>
              <style>
                body { font-family: 'Courier New', monospace; font-size: 12px; margin: 20px; }
                .receipt { max-width: 300px; margin: 0 auto; }
                .center { text-align: center; }
                .line { border-bottom: 1px dashed #000; margin: 5px 0; }
                .row { display: flex; justify-content: space-between; margin: 2px 0; }
                .bold { font-weight: bold; }
                .total { font-size: 14px; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="receipt">
                <div class="center bold">
                  <h2>SALON POS SYSTEM</h2>
                  <p>123 Beauty Lane<br>City, State 12345<br>(555) 123-4567</p>
                </div>
                <div class="line"></div>
                <div class="center">
                  <p>Order: ${receiptData.orderNumber}</p>
                  <p>${receiptData.timestamp.toLocaleDateString()} ${receiptData.timestamp.toLocaleTimeString()}</p>
                  ${receiptData.customerName ? `<p>Customer: ${receiptData.customerName}</p>` : ''}
                  ${receiptData.customerPhone ? `<p>Phone: ${receiptData.customerPhone}</p>` : ''}
                </div>
                <div class="line"></div>
                ${receiptData.items.map(item => `
                  <div class="row">
                    <span>${item.name}</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div style="margin-left: 10px; font-size: 10px;">
                    ${item.quantity} x $${item.price.toFixed(2)}
                  </div>
                `).join('')}
                <div class="line"></div>
                <div class="row">
                  <span>Subtotal:</span>
                  <span>$${receiptData.subtotal.toFixed(2)}</span>
                </div>
                ${receiptData.discountAmount > 0 ? `
                  <div class="row">
                    <span>Discount:</span>
                    <span>-$${receiptData.discountAmount.toFixed(2)}</span>
                  </div>
                ` : ''}
                ${receiptData.tipAmount > 0 ? `
                  <div class="row">
                    <span>Tip:</span>
                    <span>$${receiptData.tipAmount.toFixed(2)}</span>
                  </div>
                ` : ''}
                <div class="row">
                  <span>Tax:</span>
                  <span>$${receiptData.taxAmount.toFixed(2)}</span>
                </div>
                <div class="line"></div>
                <div class="row total">
                  <span>TOTAL:</span>
                  <span>$${receiptData.total.toFixed(2)}</span>
                </div>
                <div class="row">
                  <span>Payment:</span>
                  <span>${receiptData.paymentMethod.toUpperCase()}</span>
                </div>
                ${receiptData.cashReceived ? `
                  <div class="row">
                    <span>Cash Received:</span>
                    <span>$${receiptData.cashReceived.toFixed(2)}</span>
                  </div>
                ` : ''}
                ${receiptData.change ? `
                  <div class="row">
                    <span>Change:</span>
                    <span>$${receiptData.change.toFixed(2)}</span>
                  </div>
                ` : ''}
                <div class="line"></div>
                <div class="center">
                  <p>Thank you for your business!</p>
                  <p>Have a beautiful day!</p>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  const handleEmail = () => {
    // In a real app, this would integrate with an email service
    const subject = `Receipt for Order ${receiptData.orderNumber}`;
    const body = `Thank you for your purchase!\n\nOrder: ${receiptData.orderNumber}\nTotal: $${receiptData.total.toFixed(2)}\nDate: ${receiptData.timestamp.toLocaleDateString()}`;
    
    window.open(`mailto:${receiptData.customerPhone || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleDownload = () => {
    // Convert receipt to downloadable format
    const receiptText = `
SALON POS SYSTEM
123 Beauty Lane
City, State 12345
(555) 123-4567

================================

Order: ${receiptData.orderNumber}
Date: ${receiptData.timestamp.toLocaleDateString()} ${receiptData.timestamp.toLocaleTimeString()}
${receiptData.customerName ? `Customer: ${receiptData.customerName}` : ''}
${receiptData.customerPhone ? `Phone: ${receiptData.customerPhone}` : ''}

================================

${receiptData.items.map(item => 
  `${item.name}\n  ${item.quantity} x $${item.price.toFixed(2)} = $${(item.price * item.quantity).toFixed(2)}`
).join('\n')}

================================

Subtotal: $${receiptData.subtotal.toFixed(2)}
${receiptData.discountAmount > 0 ? `Discount: -$${receiptData.discountAmount.toFixed(2)}` : ''}
${receiptData.tipAmount > 0 ? `Tip: $${receiptData.tipAmount.toFixed(2)}` : ''}
Tax: $${receiptData.taxAmount.toFixed(2)}

TOTAL: $${receiptData.total.toFixed(2)}

Payment: ${receiptData.paymentMethod.toUpperCase()}
${receiptData.cashReceived ? `Cash Received: $${receiptData.cashReceived.toFixed(2)}` : ''}
${receiptData.change ? `Change: $${receiptData.change.toFixed(2)}` : ''}

Thank you for your business!
Have a beautiful day!
    `;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptData.orderNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt - {receiptData.orderNumber}</DialogTitle>
        </DialogHeader>

        <div id="receipt-content">
          <Card>
            <CardContent className="p-6 font-mono text-sm">
              {/* Header */}
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg">SALON POS SYSTEM</h3>
                <p className="text-xs text-muted-foreground">
                  123 Beauty Lane<br />
                  City, State 12345<br />
                  (555) 123-4567
                </p>
              </div>

              <Separator className="my-4" />

              {/* Order Info */}
              <div className="text-center mb-4">
                <p className="font-bold">Order: {receiptData.orderNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {receiptData.timestamp.toLocaleDateString()} {receiptData.timestamp.toLocaleTimeString()}
                </p>
                {receiptData.customerName && (
                  <p className="text-xs">Customer: {receiptData.customerName}</p>
                )}
                {receiptData.customerPhone && (
                  <p className="text-xs">Phone: {receiptData.customerPhone}</p>
                )}
              </div>

              <Separator className="my-4" />

              {/* Items */}
              <div className="space-y-2 mb-4">
                {receiptData.items.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between">
                      <span className="flex-1">{item.name}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground ml-2">
                      {item.quantity} x ${item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${receiptData.subtotal.toFixed(2)}</span>
                </div>
                
                {receiptData.discountAmount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount:</span>
                    <span>-${receiptData.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                {receiptData.tipAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tip:</span>
                    <span>${receiptData.tipAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${receiptData.taxAmount.toFixed(2)}</span>
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>TOTAL:</span>
                  <span>${receiptData.total.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Payment:</span>
                  <span className="uppercase">{receiptData.paymentMethod}</span>
                </div>
                
                {receiptData.cashReceived && (
                  <div className="flex justify-between">
                    <span>Cash Received:</span>
                    <span>${receiptData.cashReceived.toFixed(2)}</span>
                  </div>
                )}
                
                {receiptData.change && receiptData.change > 0 && (
                  <div className="flex justify-between">
                    <span>Change:</span>
                    <span>${receiptData.change.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Footer */}
              <div className="text-center text-xs">
                <p>Thank you for your business!</p>
                <p>Have a beautiful day!</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleEmail} className="flex-1">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          <Button variant="outline" onClick={handleDownload} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};