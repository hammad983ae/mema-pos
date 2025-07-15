import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  token_hash: string;
  token: string;
  email_action_type: string;
  redirect_to: string;
  site_url: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, token_hash, token, email_action_type, redirect_to, site_url }: EmailRequest = await req.json();
    
    let subject = "";
    let html = "";
    
    if (email_action_type === "signup") {
      subject = "Welcome to Mema POS - Verify Your Account";
      const onboardingRedirectUrl = `https://53251c6e-98c7-4d7b-8603-4ef6e078a709.lovableproject.com/onboarding`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f6f9fc;">
          <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, hsl(86, 20%, 42%) 0%, hsl(86, 30%, 55%) 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">Welcome to Mema POS! 🎉</h1>
            </div>
            
            <div style="padding: 40px 32px;">
              <h2 style="color: hsl(220, 15%, 12%); margin-top: 0; font-size: 24px;">Verify Your Business Account</h2>
              <p style="color: hsl(220, 10%, 45%); margin-bottom: 24px; font-size: 16px; line-height: 1.6;">
                Thanks for signing up for Mema POS! We're excited to have you on board. To get started, please verify your email address by clicking the button below:
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(onboardingRedirectUrl)}" 
                   style="background: hsl(86, 20%, 42%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 12px hsl(86, 20%, 42%, 0.2);">
                  Verify Email & Continue to Setup
                </a>
              </div>
              
              <p style="color: hsl(220, 10%, 45%); font-size: 14px; margin-bottom: 24px;">
                Or copy and paste this verification code if the button doesn't work:
              </p>
              
              <div style="background: hsl(32, 15%, 96%); padding: 16px; border-radius: 8px; border: 1px solid hsl(32, 20%, 90%); margin: 16px 0; text-align: center;">
                <code style="color: hsl(220, 15%, 12%); font-size: 14px; font-family: Consolas, monospace;">${token}</code>
              </div>
              
              <div style="background: hsl(86, 25%, 88%); padding: 20px; border-radius: 8px; border-left: 4px solid hsl(86, 20%, 42%); margin: 24px 0;">
                <p style="color: hsl(220, 15%, 15%); font-size: 14px; margin: 0; font-weight: 600;">
                  <strong>Next Steps:</strong> After verification, you'll be taken to set up your business profile and can start inviting team members with their own usernames and PINs for POS access.
                </p>
              </div>
            </div>
            
            <div style="background: hsl(32, 20%, 94%); padding: 24px 32px; border-top: 1px solid hsl(32, 20%, 90%); text-align: center;">
              <p style="color: hsl(220, 10%, 45%); font-size: 12px; margin: 0;">
                If you didn't create a Mema POS account, you can safely ignore this email.
              </p>
              <p style="color: hsl(220, 10%, 45%); font-size: 12px; margin: 8px 0 0 0;">
                This link will expire in 24 hours for security reasons.
              </p>
              <p style="color: hsl(220, 10%, 45%); font-size: 12px; margin: 8px 0 0 0;">
                © 2024 Mema POS. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `;
    } else if (email_action_type === "recovery") {
      subject = "Reset Your Mema POS Password";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f6f9fc;">
          <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, hsl(0, 70%, 50%) 0%, hsl(0, 62%, 45%) 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">Reset Your Password</h1>
            </div>
            
            <div style="padding: 40px 32px;">
              <p style="color: hsl(220, 10%, 45%); margin-bottom: 24px; font-size: 16px; line-height: 1.6;">
                We received a request to reset your Mema POS account password. Click the button below to create a new password.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}" 
                   style="background: hsl(0, 70%, 50%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 12px hsl(0, 70%, 50%, 0.2);">
                  Reset Password
                </a>
              </div>
              
              <p style="color: hsl(220, 10%, 45%); font-size: 14px; margin-bottom: 24px;">
                Or copy and paste this verification code if the button doesn't work:
              </p>
              
              <div style="background: hsl(32, 15%, 96%); padding: 16px; border-radius: 8px; border: 1px solid hsl(32, 20%, 90%); margin: 16px 0; text-align: center;">
                <code style="color: hsl(220, 15%, 12%); font-size: 14px; font-family: Consolas, monospace;">${token}</code>
              </div>
            </div>
            
            <div style="background: hsl(32, 20%, 94%); padding: 24px 32px; border-top: 1px solid hsl(32, 20%, 90%); text-align: center;">
              <p style="color: hsl(220, 10%, 45%); font-size: 12px; margin: 0;">
                If you didn't request this password reset, you can safely ignore this email.
              </p>
              <p style="color: hsl(220, 10%, 45%); font-size: 12px; margin: 8px 0 0 0;">
                This link will expire in 1 hour for security reasons.
              </p>
              <p style="color: hsl(220, 10%, 45%); font-size: 12px; margin: 8px 0 0 0;">
                © 2024 Mema POS. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `;
    }

    // Use custom domain if configured, otherwise fall back to default
    const customDomain = Deno.env.get("CUSTOM_EMAIL_DOMAIN");
    const fromEmail = customDomain ? `noreply@${customDomain}` : "noreply@resend.dev";
    
    const emailResponse = await resend.emails.send({
      from: `Mema POS <${fromEmail}>`,
      to: [to],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);