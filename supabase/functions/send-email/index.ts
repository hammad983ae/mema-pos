import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
  tags?: Array<{
    name: string;
    value: string;
  }>;
}

interface ReceiptEmailRequest extends EmailRequest {
  receiptData: {
    orderNumber: string;
    customerName: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      total: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
    storeName: string;
    storeAddress?: string;
    paymentMethod: string;
    transactionDate: string;
  };
}

const generateReceiptHTML = (receiptData: ReceiptEmailRequest['receiptData']) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Receipt - ${receiptData.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #333; }
        .store-info { margin: 10px 0; color: #666; }
        .receipt-info { margin: 20px 0; }
        .receipt-number { font-size: 18px; font-weight: bold; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        .items-table th { background-color: #f5f5f5; font-weight: bold; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .totals { margin-top: 20px; }
        .totals div { display: flex; justify-content: space-between; margin: 5px 0; }
        .final-total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 10px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Mema POS</div>
        <div class="store-info">
          <strong>${receiptData.storeName}</strong><br>
          ${receiptData.storeAddress || ''}
        </div>
      </div>

      <div class="receipt-info">
        <div class="receipt-number">Receipt #${receiptData.orderNumber}</div>
        <div>Date: ${new Date(receiptData.transactionDate).toLocaleString()}</div>
        <div>Customer: ${receiptData.customerName}</div>
        <div>Payment: ${receiptData.paymentMethod}</div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${receiptData.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>$${item.price.toFixed(2)}</td>
              <td>$${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div>
          <span>Subtotal:</span>
          <span>$${receiptData.subtotal.toFixed(2)}</span>
        </div>
        <div>
          <span>Tax:</span>
          <span>$${receiptData.tax.toFixed(2)}</span>
        </div>
        <div class="final-total">
          <span>Total:</span>
          <span>$${receiptData.total.toFixed(2)}</span>
        </div>
      </div>

      <div class="footer">
        <p>Thank you for your business!</p>
        <p><em>This is a digital receipt from ${receiptData.storeName}</em></p>
        <p style="font-size: 12px;">Powered by Mema POS</p>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const body = await req.json();
    const { type, ...emailData }: { type?: string } & (EmailRequest | ReceiptEmailRequest) = body;

    let emailContent: any = {
      from: emailData.from || "Mema <noreply@mema.com>",
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    };

    // Handle receipt emails
    if (type === 'receipt' && 'receiptData' in emailData) {
      const receiptEmail = emailData as ReceiptEmailRequest;
      emailContent.html = generateReceiptHTML(receiptEmail.receiptData);
      emailContent.subject = `Receipt #${receiptEmail.receiptData.orderNumber} - ${receiptEmail.receiptData.storeName}`;
    }

    // Add optional fields if provided
    if (emailData.cc) emailContent.cc = emailData.cc;
    if (emailData.bcc) emailContent.bcc = emailData.bcc;
    if (emailData.tags) emailContent.tags = emailData.tags;
    if (emailData.attachments) emailContent.attachments = emailData.attachments;

    console.log("Sending email:", { to: emailContent.to, subject: emailContent.subject });

    const emailResponse = await resend.emails.send(emailContent);

    if (emailResponse.error) {
      throw new Error(emailResponse.error.message);
    }

    console.log("Email sent successfully:", emailResponse.data?.id);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: emailResponse.data?.id,
        message: "Email sent successfully"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send email"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);