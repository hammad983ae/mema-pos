import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdatePinRequest {
  currentPin?: string;
  newPin: string;
  targetUserId?: string; // For admin updates
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

    const { currentPin, newPin, targetUserId }: UpdatePinRequest = await req.json();

    // Enhanced PIN validation - allow 4-6 digits 
    if (!newPin || !/^\d{4,6}$/.test(newPin)) {
      throw new Error("PIN must be 4-6 digits");
    }

    // Determine if this is an admin update or user self-update
    const isAdminUpdate = targetUserId && targetUserId !== user.id;
    let userToUpdate = user.id;

    if (isAdminUpdate) {
      // Check if user is business owner or manager
      const { data: membership, error: membershipError } = await supabase
        .from('user_business_memberships')
        .select('role, business_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (membershipError || !membership || !(['business_owner', 'manager'].includes(membership.role))) {
        throw new Error("Insufficient permissions. Only business owners and managers can update other users' PINs.");
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

      userToUpdate = targetUserId;
    } else {
      // For self-updates, verify current PIN
      if (currentPin) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('pos_pin')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError || !profile) {
          throw new Error("Profile not found");
        }

        if (profile.pos_pin !== currentPin) {
          throw new Error("Current PIN is incorrect");
        }
      }
    }

    console.log(`Updating PIN for user: ${userToUpdate}`);

    // Check if new PIN is already in use by another user in the same business
    const { data: existingPin, error: checkError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('pos_pin', newPin)
      .neq('user_id', userToUpdate)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error("Error checking PIN uniqueness:", checkError);
      throw new Error("Failed to verify PIN uniqueness");
    }

    if (existingPin) {
      throw new Error("This PIN is already in use by another employee");
    }

    // Update the PIN
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ pos_pin: newPin })
      .eq('user_id', userToUpdate);

    if (updateError) {
      console.error("Error updating PIN:", updateError);
      throw new Error(`Failed to update PIN: ${updateError.message}`);
    }

    console.log(`PIN updated successfully for user: ${userToUpdate}`);

    return new Response(JSON.stringify({
      success: true,
      message: "PIN updated successfully"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in update-pos-pin function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to update PIN"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);