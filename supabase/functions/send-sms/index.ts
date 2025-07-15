import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  to: string;
  message: string;
  from?: string;
}

interface ReceiptSMSRequest extends SMSRequest {
  receiptData: {
    orderNumber: string;
    customerName: string;
    total: number;
    storeName: string;
    transactionDate: string;
  };
}

const generateReceiptSMS = (receiptData: ReceiptSMSRequest['receiptData']) => {
  return `${receiptData.storeName} - Receipt #${receiptData.orderNumber}

Thank you ${receiptData.customerName}!
Total: $${receiptData.total.toFixed(2)}
Date: ${new Date(receiptData.transactionDate).toLocaleDateString()}

Powered by Mema POS`;
};

const sendTwilioSMS = async (to: string, message: string, from?: string) => {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured");
  }

  const fromNumber = from || Deno.env.get("TWILIO_PHONE_NUMBER") || "+1234567890";
  
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const body = new URLSearchParams({
    To: to,
    From: fromNumber,
    Body: message,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Twilio API error: ${errorData.message || 'Unknown error'}`);
  }

  return await response.json();
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
    const { type, ...smsData }: { type?: string } & (SMSRequest | ReceiptSMSRequest) = body;

    let messageContent = smsData.message;

    // Handle receipt SMS
    if (type === 'receipt' && 'receiptData' in smsData) {
      const receiptSMS = smsData as ReceiptSMSRequest;
      messageContent = generateReceiptSMS(receiptSMS.receiptData);
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(smsData.to.replace(/[^\d+]/g, ''))) {
      throw new Error("Invalid phone number format");
    }

    // Ensure phone number starts with +
    const toNumber = smsData.to.startsWith('+') ? smsData.to : `+1${smsData.to.replace(/[^\d]/g, '')}`;

    console.log("Sending SMS:", { to: toNumber, messageLength: messageContent.length });

    const twilioResponse = await sendTwilioSMS(toNumber, messageContent, smsData.from);

    console.log("SMS sent successfully:", twilioResponse.sid);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: twilioResponse.sid,
        message: "SMS sent successfully",
        status: twilioResponse.status
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-sms function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send SMS"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);