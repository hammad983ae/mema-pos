import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminResetPasswordRequest {
  targetUserId: string;
  newPassword: string;
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

    // Get the authenticated admin user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid authentication token");
    }

    // Check if user is business owner or manager
    const { data: membership, error: membershipError } = await supabase
      .from('user_business_memberships')
      .select('role, business_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (membershipError) {
      console.error("Error checking membership:", membershipError);
      throw new Error("Failed to verify permissions");
    }

    if (!membership || !(['business_owner', 'manager'].includes(membership.role))) {
      throw new Error("Insufficient permissions. Only business owners and managers can reset passwords.");
    }

    const { targetUserId, newPassword }: AdminResetPasswordRequest = await req.json();

    if (!targetUserId || !newPassword) {
      throw new Error("Target user ID and new password are required");
    }

    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Verify target user is in the same business
    const { data: targetMembership, error: targetError } = await supabase
      .from('user_business_memberships')
      .select('business_id')
      .eq('user_id', targetUserId)
      .eq('business_id', membership.business_id)
      .eq('is_active', true)
      .maybeSingle();

    if (targetError || !targetMembership) {
      throw new Error("Target user not found in your business");
    }

    console.log(`Admin ${user.id} resetting password for user ${targetUserId}`);

    // Reset the user's password using service role
    const { error: resetError } = await supabase.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    );

    if (resetError) {
      console.error("Error resetting password:", resetError);
      throw new Error(`Failed to reset password: ${resetError.message}`);
    }

    console.log(`Password reset successful for user: ${targetUserId}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Password reset successfully"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in admin-reset-password function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to reset password"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);