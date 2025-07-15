import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayrollEmailRequest {
  payroll_id: string;
  employee_id: string;
  payroll_data?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { payroll_id, employee_id, payroll_data }: PayrollEmailRequest = await req.json();

    // Get employee profile information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, payroll_email')
      .eq('user_id', employee_id)
      .single();

    if (profileError) throw profileError;

    if (!profile.payroll_email) {
      throw new Error('Employee does not have a payroll email configured');
    }

    // Get payroll data if not provided
    let payrollInfo = payroll_data;
    if (!payrollInfo && payroll_id) {
      const { data: payrollRecord, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('id', payroll_id)
        .single();

      if (error) throw error;
      payrollInfo = payrollRecord;
    }

    // Get business settings for email customization
    const { data: settings } = await supabase
      .from('payroll_settings')
      .select('*')
      .eq('business_id', payrollInfo.business_id)
      .single();

    const companyName = settings?.company_name || 'Your Company';
    const emailSubject = settings?.email_subject || 'Your Payroll Statement';
    const emailTemplate = settings?.email_template || 'Please find your payroll statement details below.';

    // Configure sender and reply-to with custom domain support
    const customDomain = Deno.env.get("CUSTOM_EMAIL_DOMAIN");
    const defaultEmail = customDomain ? `noreply@${customDomain}` : 'onboarding@resend.dev';
    
    const senderEmail = settings?.sender_email || defaultEmail;
    const senderName = settings?.sender_name || companyName;
    const replyToEmail = settings?.reply_to_email || settings?.sender_email;
    const replyToName = settings?.reply_to_name || settings?.sender_name;

    // Generate email content
    const emailContent = generatePayrollEmailHTML(payrollInfo, profile, settings);

    // Prepare email options
    const emailOptions: any = {
      from: `${senderName} <${senderEmail}>`,
      to: [profile.payroll_email],
      subject: emailSubject,
      html: emailContent,
    };

    // Add reply-to if configured
    if (replyToEmail && replyToEmail !== senderEmail) {
      emailOptions.reply_to = replyToName ? `${replyToName} <${replyToEmail}>` : replyToEmail;
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send(emailOptions);

    console.log('Payroll email sent successfully:', emailResponse);

    return new Response(JSON.stringify({
      success: true,
      message: 'Payroll email sent successfully',
      email_id: emailResponse.data?.id
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error sending payroll email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

function generatePayrollEmailHTML(payrollData: any, profile: any, settings: any): string {
  const companyName = settings?.company_name || 'Your Company';
  const customMessage = settings?.email_template || 'Please find your payroll statement details below.';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payroll Statement</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; margin-bottom: 20px; }
        .content { padding: 20px; }
        .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .summary-table th, .summary-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .summary-table th { background-color: #f2f2f2; }
        .highlight { background-color: #e8f5e8; font-weight: bold; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${companyName}</h1>
        <h2>Payroll Statement</h2>
      </div>
      
      <div class="content">
        <p>Dear ${profile.full_name},</p>
        
        <p>${customMessage}</p>
        
        <h3>Pay Period: ${payrollData.period_start} to ${payrollData.period_end}</h3>
        
        <table class="summary-table">
          <tr><th>Description</th><th>Amount</th></tr>
          <tr><td>Total Sales</td><td>$${Number(payrollData.total_sales).toLocaleString()}</td></tr>
          <tr><td>Commission Earned</td><td>$${Number(payrollData.total_commission).toLocaleString()}</td></tr>
          <tr><td>Base Pay</td><td>$${Number(payrollData.base_pay).toLocaleString()}</td></tr>
          <tr><td>Hours Worked</td><td>${Number(payrollData.total_hours).toFixed(1)} hours</td></tr>
          <tr><td>Gross Pay</td><td>$${Number(payrollData.gross_pay).toLocaleString()}</td></tr>
          <tr class="highlight"><td><strong>Net Pay</strong></td><td><strong>$${Number(payrollData.net_pay).toLocaleString()}</strong></td></tr>
        </table>
        
        ${generateDailyBreakdownEmailHTML(payrollData.daily_breakdown)}
        
        <p>If you have any questions about your payroll, please contact your manager or HR department.</p>
        
        <p>Thank you for your hard work!</p>
        
        <p>Best regards,<br>${companyName} Payroll Team</p>
      </div>
      
      <div class="footer">
        <p>This is an automated payroll statement. Please keep this for your records.</p>
      </div>
    </body>
    </html>
  `;
}

function generateDailyBreakdownEmailHTML(dailyBreakdown: any): string {
  if (!dailyBreakdown || dailyBreakdown.length === 0) return '';
  
  const breakdown = typeof dailyBreakdown === 'string' ? JSON.parse(dailyBreakdown) : dailyBreakdown;
  
  let html = `
    <h4>Daily Performance Breakdown</h4>
    <table class="summary-table">
      <tr><th>Date</th><th>Store</th><th>Sales</th><th>Commission</th><th>Hours</th></tr>
  `;
  
  breakdown.forEach((day: any) => {
    html += `
      <tr>
        <td>${new Date(day.date).toLocaleDateString()}</td>
        <td>${day.store}</td>
        <td>$${Number(day.sales).toLocaleString()}</td>
        <td>$${Number(day.commission).toLocaleString()}</td>
        <td>${Number(day.hours).toFixed(1)}h</td>
      </tr>
    `;
  });
  
  html += '</table>';
  return html;
}

serve(handler);