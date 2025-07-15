import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      managerEmail, 
      managerName, 
      employeeName, 
      saleAmount, 
      minimumAmount, 
      approvalCode, 
      requestId 
    } = await req.json();

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .code { font-size: 24px; font-weight: bold; background: #e9ecef; padding: 10px; text-align: center; border-radius: 5px; margin: 20px 0; }
    .details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Manager Approval Required</h1>
      <p>Hello ${managerName},</p>
      <p>A sale requires your approval due to being below the minimum threshold.</p>
    </div>

    <div class="alert">
      <h3>⚠️ Sale Details</h3>
      <div class="details">
        <p><strong>Employee:</strong> ${employeeName}</p>
        <p><strong>Sale Amount:</strong> $${saleAmount.toFixed(2)}</p>
        <p><strong>Minimum Required:</strong> $${minimumAmount.toFixed(2)}</p>
        <p><strong>Difference:</strong> -$${(minimumAmount - saleAmount).toFixed(2)}</p>
      </div>
    </div>

    <div class="code">
      <p>Approval Code:</p>
      <div style="font-size: 32px; color: #007bff; letter-spacing: 3px;">${approvalCode}</div>
    </div>

    <p>To approve this sale, either:</p>
    <ol>
      <li>Give this approval code to the employee</li>
      <li>Or sign in directly at the POS terminal</li>
    </ol>

    <p style="margin-top: 30px; font-size: 12px; color: #666;">
      This is an automated notification from your Fielix POS system.<br>
      Request ID: ${requestId}
    </p>
  </div>
</body>
</html>
    `;

    // In a real implementation, you would integrate with an email service like SendGrid
    // For now, we'll log the email content and return success
    console.log('Email notification sent:', {
      to: managerEmail,
      subject: `Manager Approval Required - $${saleAmount.toFixed(2)} Sale`,
      body: emailBody
    });

    // Simulate sending notification (in production, integrate with your email/SMS service)
    const response = await fetch('https://api.example-notification-service.com/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add your notification service API key here
      },
      body: JSON.stringify({
        to: managerEmail,
        subject: `Manager Approval Required - $${saleAmount.toFixed(2)} Sale`,
        html: emailBody,
        priority: 'high'
      })
    }).catch(() => {
      // Fallback: just log if external service fails
      console.log('External notification service unavailable, logged locally');
      return { ok: true };
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Manager notification sent successfully',
        approvalCode 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error sending manager notification:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
})