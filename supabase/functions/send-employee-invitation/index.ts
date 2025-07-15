import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, fullName, invitationLink } = await req.json()

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    // Use custom domain if configured
    const customDomain = Deno.env.get("CUSTOM_EMAIL_DOMAIN");
    const fromEmail = customDomain ? `noreply@${customDomain}` : "noreply@fielix.com";
    
    const emailData = {
      from: `Fielix Team <${fromEmail}>`,
      to: [email],
      subject: 'Welcome to the Team! Complete Your Account Setup',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Fielix!</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${fullName},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              You've been invited to join our team! Your manager has created an account for you with temporary login credentials.
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Click the button below to complete your account setup and choose your own secure PIN:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold;
                        display: inline-block;">
                Complete Account Setup
              </a>
            </div>
            
            <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #2563eb; margin: 0 0 10px 0; font-size: 16px;">What's Next?</h3>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li>Click the setup link above</li>
                <li>Create your personal PIN (you can change the temporary one)</li>
                <li>Complete your profile information</li>
                <li>Start using the POS system and dashboard</li>
              </ul>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 10px;">
              If you have any questions, don't hesitate to reach out to your manager or our support team.
            </p>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              This invitation link will expire in 7 days. If you need a new invitation, please contact your manager.
            </p>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 14px;">
              © 2024 Fielix. All rights reserved.
            </p>
          </div>
        </div>
      `
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    const result = await response.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.id,
        message: 'Invitation email sent successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )

  } catch (error) {
    console.error('Error sending invitation email:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      },
    )
  }
})