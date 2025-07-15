import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EODNotificationRequest {
  reportId: string;
  employeeName: string;
  employeeEmail: string;
  storeName: string;
  reportDate: string;
  totalSales: number;
  totalTransactions: number;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { 
      reportId, 
      employeeName, 
      employeeEmail, 
      storeName, 
      reportDate, 
      totalSales, 
      totalTransactions, 
      notes 
    }: EODNotificationRequest = await req.json();

    // Get business context and managers
    const { data: report } = await supabase
      .from('end_of_day_reports')
      .select(`
        *,
        businesses:business_id(name, email),
        stores:store_id(name)
      `)
      .eq('id', reportId)
      .single();

    if (!report) {
      throw new Error('Report not found');
    }

    // Get managers and business owners for this business
    const { data: managers } = await supabase
      .from('user_business_memberships')
      .select(`
        user_id,
        role,
        profiles:user_id(email, full_name)
      `)
      .eq('business_id', report.business_id)
      .in('role', ['business_owner', 'manager'])
      .eq('is_active', true);

    if (!managers || managers.length === 0) {
      console.log('No managers found for notification');
      return new Response(JSON.stringify({ message: 'No managers to notify' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const managerEmails = managers
      .map(m => m.profiles?.email)
      .filter(email => email) as string[];

    // Create email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">End of Day Report Submitted</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e293b;">Report Details</h3>
          <p><strong>Employee:</strong> ${employeeName}</p>
          <p><strong>Store:</strong> ${storeName}</p>
          <p><strong>Date:</strong> ${new Date(reportDate).toLocaleDateString()}</p>
          <p><strong>Total Sales:</strong> $${totalSales.toFixed(2)}</p>
          <p><strong>Transactions:</strong> ${totalTransactions}</p>
        </div>

        ${notes ? `
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #92400e;">Notes from Employee:</h4>
            <p style="margin-bottom: 0;">${notes}</p>
          </div>
        ` : ''}

        <div style="margin: 30px 0;">
          <a href="https://53251c6e-98c7-4d7b-8603-4ef6e078a709.lovableproject.com/manager/reports" 
             style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Review Report
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This report requires your approval. Please review and approve or reject with feedback.
        </p>
      </div>
    `;

    // Send email to all managers
    const emailResponse = await resend.emails.send({
      from: "Fielix <reports@fielix.com>",
      to: managerEmails,
      subject: `EOD Report: ${employeeName} - ${storeName} (${new Date(reportDate).toLocaleDateString()})`,
      html: emailHtml,
    });

    console.log("EOD notification sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-eod-notification function:", error);
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