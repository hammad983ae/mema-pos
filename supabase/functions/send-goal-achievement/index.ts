import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GoalAchievementRequest {
  userId: string;
  goalId: string;
  employeeName: string;
  employeeEmail: string;
  goalType: string;
  targetAmount: number;
  achievedAmount: number;
  achievedDate: string;
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
      userId,
      goalId,
      employeeName, 
      employeeEmail, 
      goalType,
      targetAmount,
      achievedAmount,
      achievedDate
    }: GoalAchievementRequest = await req.json();

    // Get user's business context
    const { data: membership } = await supabase
      .from('user_business_memberships')
      .select(`
        business_id,
        businesses:business_id(name)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (!membership) {
      throw new Error('User business membership not found');
    }

    // Calculate achievement percentage
    const achievementPercentage = Math.round((achievedAmount / targetAmount) * 100);

    // Create congratulatory email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 30px 0;">
          <h1 style="color: #10b981; font-size: 36px; margin: 0;">🎉 Congratulations!</h1>
          <h2 style="color: #1e293b; margin: 10px 0;">Goal Achieved!</h2>
        </div>
        
        <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; font-size: 24px;">
            ${goalType.charAt(0).toUpperCase() + goalType.slice(1)} Goal Completed
          </h3>
          <div style="font-size: 48px; font-weight: bold; margin: 20px 0;">
            ${achievementPercentage}%
          </div>
          <p style="margin: 0; font-size: 18px;">
            You achieved $${achievedAmount.toFixed(2)} of your $${targetAmount.toFixed(2)} target!
          </p>
        </div>

        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e293b;">Achievement Details</h3>
          <p><strong>Employee:</strong> ${employeeName}</p>
          <p><strong>Goal Type:</strong> ${goalType.charAt(0).toUpperCase() + goalType.slice(1)}</p>
          <p><strong>Target:</strong> $${targetAmount.toFixed(2)}</p>
          <p><strong>Achieved:</strong> $${achievedAmount.toFixed(2)}</p>
          <p><strong>Date:</strong> ${new Date(achievedDate).toLocaleDateString()}</p>
          ${achievementPercentage > 100 ? `<p style="color: #10b981; font-weight: bold;">🚀 Exceeded target by ${achievementPercentage - 100}%!</p>` : ''}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://53251c6e-98c7-4d7b-8603-4ef6e078a709.lovableproject.com/employee" 
             style="background: #4f46e5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            View Your Dashboard
          </a>
        </div>

        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #92400e; font-weight: bold;">
            🏆 Keep up the excellent work! Your dedication and hard work are truly paying off.
          </p>
        </div>

        <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
          Sent by Fielix - Your Sales Performance Partner
        </p>
      </div>
    `;

    // Send congratulations email to employee
    const emailResponse = await resend.emails.send({
      from: "Fielix <achievements@fielix.com>",
      to: [employeeEmail],
      subject: `🎉 Goal Achieved! You've completed your ${goalType} sales target`,
      html: emailHtml,
    });

    // Also notify managers
    const { data: managers } = await supabase
      .from('user_business_memberships')
      .select(`
        profiles:user_id(email, full_name)
      `)
      .eq('business_id', membership.business_id)
      .in('role', ['business_owner', 'manager'])
      .eq('is_active', true);

    if (managers && managers.length > 0) {
      const managerEmails = managers
        .map(m => m.profiles?.email)
        .filter(email => email) as string[];

      const managerEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Employee Goal Achievement</h2>
          
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #10b981;">🎉 ${employeeName} has achieved their ${goalType} goal!</h3>
            <p><strong>Target:</strong> $${targetAmount.toFixed(2)}</p>
            <p><strong>Achieved:</strong> $${achievedAmount.toFixed(2)} (${achievementPercentage}%)</p>
            <p><strong>Date:</strong> ${new Date(achievedDate).toLocaleDateString()}</p>
          </div>

          <div style="margin: 30px 0;">
            <a href="https://53251c6e-98c7-4d7b-8603-4ef6e078a709.lovableproject.com/manager/team" 
               style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Team Performance
            </a>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: "Fielix <achievements@fielix.com>",
        to: managerEmails,
        subject: `Team Achievement: ${employeeName} completed ${goalType} goal`,
        html: managerEmailHtml,
      });
    }

    console.log("Goal achievement notification sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-goal-achievement function:", error);
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