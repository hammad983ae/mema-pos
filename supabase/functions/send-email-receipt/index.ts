import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReceiptEmailRequest {
  customerEmail: string;
  orderId: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  tipAmount?: number;
  discountAmount?: number;
  total: number;
  storeName: string;
  storeAddress?: string;
  paymentMethod: string;
  date: string;
  time: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    const resend = new Resend(resendApiKey);
    const {
      customerEmail,
      orderId,
      orderNumber,
      items,
      subtotal,
      tax,
      tipAmount = 0,
      discountAmount = 0,
      total,
      storeName,
      storeAddress = '',
      paymentMethod,
      date,
      time
    }: ReceiptEmailRequest = await req.json();

    console.log('Processing email receipt for order:', orderNumber);

    // Generate receipt HTML
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt - ${orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .store-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .store-info { font-size: 14px; color: #666; }
            .receipt-info { margin-bottom: 20px; }
            .receipt-info div { margin-bottom: 5px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
            .items-table th { background-color: #f5f5f5; font-weight: bold; }
            .items-table .qty { text-align: center; width: 60px; }
            .items-table .price { text-align: right; width: 80px; }
            .totals { border-top: 2px solid #333; padding-top: 10px; }
            .totals div { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total-line { font-weight: bold; font-size: 18px; border-top: 1px solid #333; padding-top: 10px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            .thank-you { text-align: center; margin: 20px 0; font-size: 18px; color: #2563eb; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">${storeName}</div>
            ${storeAddress ? `<div class="store-info">${storeAddress}</div>` : ''}
          </div>

          <div class="receipt-info">
            <div><strong>Receipt #:</strong> ${orderNumber}</div>
            <div><strong>Date:</strong> ${date}</div>
            <div><strong>Time:</strong> ${time}</div>
            <div><strong>Payment Method:</strong> ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}</div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th class="qty">Qty</th>
                <th class="price">Price</th>
                <th class="price">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td class="qty">${item.quantity}</td>
                  <td class="price">$${item.price.toFixed(2)}</td>
                  <td class="price">$${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div>
              <span>Subtotal:</span>
              <span>$${subtotal.toFixed(2)}</span>
            </div>
            ${discountAmount > 0 ? `
              <div style="color: #dc2626;">
                <span>Discount:</span>
                <span>-$${discountAmount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div>
              <span>Tax:</span>
              <span>$${tax.toFixed(2)}</span>
            </div>
            ${tipAmount > 0 ? `
              <div>
                <span>Tip:</span>
                <span>$${tipAmount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="total-line">
              <span>Total:</span>
              <span>$${total.toFixed(2)}</span>
            </div>
          </div>

          <div class="thank-you">
            Thank you for your business!
          </div>

          <div class="footer">
            <p>This is your digital receipt. Please keep for your records.</p>
            <p>If you have any questions about this transaction, please contact ${storeName}.</p>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: `${storeName} <receipts@${Deno.env.get('RESEND_DOMAIN') || 'resend.dev'}>`,
      to: [customerEmail],
      subject: `Receipt for Order ${orderNumber} - ${storeName}`,
      html: receiptHtml,
      text: `
        Receipt from ${storeName}
        
        Order #: ${orderNumber}
        Date: ${date} ${time}
        Payment Method: ${paymentMethod}
        
        Items:
        ${items.map(item => `- ${item.name} (${item.quantity}x) - $${item.total.toFixed(2)}`).join('\n')}
        
        Subtotal: $${subtotal.toFixed(2)}
        ${discountAmount > 0 ? `Discount: -$${discountAmount.toFixed(2)}\n` : ''}Tax: $${tax.toFixed(2)}
        ${tipAmount > 0 ? `Tip: $${tipAmount.toFixed(2)}\n` : ''}Total: $${total.toFixed(2)}
        
        Thank you for your business!
      `
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      emailId: emailResponse.data?.id,
      message: 'Receipt email sent successfully' 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error sending email receipt:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to send email receipt'
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);