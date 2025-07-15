import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JoinBusinessRequest {
  invitationCode: string;
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

    // Get the authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid authentication token");
    }

    const { invitationCode }: JoinBusinessRequest = await req.json();

    if (!invitationCode?.trim()) {
      throw new Error("Invitation code is required");
    }

    console.log(`User ${user.id} attempting to join business with code: ${invitationCode}`);

    // Check if user is already part of a business
    const { data: existingMembership, error: membershipCheckError } = await supabase
      .from('user_business_memberships')
      .select('business_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (membershipCheckError) {
      console.error("Error checking existing membership:", membershipCheckError);
      throw new Error(`Failed to check existing membership: ${membershipCheckError.message}`);
    }

    if (existingMembership) {
      throw new Error("You are already part of a business");
    }

    // Find the business with the invitation code
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, invitation_code')
      .eq('invitation_code', invitationCode.trim().toUpperCase())
      .maybeSingle();

    if (businessError) {
      console.error("Error finding business:", businessError);
      throw new Error(`Failed to find business: ${businessError.message}`);
    }

    if (!business) {
      throw new Error("Invalid invitation code");
    }

    console.log(`Found business: ${business.name} (${business.id})`);

    // Create employee membership
    const { error: membershipError } = await supabase
      .from('user_business_memberships')
      .insert({
        user_id: user.id,
        business_id: business.id,
        role: 'employee',
        is_active: true,
        hired_date: new Date().toISOString().split('T')[0]
      });

    if (membershipError) {
      console.error("Error creating membership:", membershipError);
      throw new Error(`Failed to join business: ${membershipError.message}`);
    }

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        position: 'Employee',
        hire_date: new Date().toISOString().split('T')[0]
      })
      .eq('user_id', user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      // Not critical - continue
    }

    console.log(`User ${user.id} successfully joined business ${business.id}`);

    return new Response(JSON.stringify({
      success: true,
      business: {
        id: business.id,
        name: business.name
      },
      message: `Successfully joined ${business.name}!`
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in join-business function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to join business"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);