import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompleteProfileRequest {
  username: string;
  posPin: string;
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

    const { username, posPin }: CompleteProfileRequest = await req.json();

    if (!username?.trim()) {
      throw new Error("Username is required");
    }

    if (!posPin?.trim() || !/^\d{4}$/.test(posPin)) {
      throw new Error("Valid 4-digit PIN is required");
    }

    console.log(`Completing profile for user: ${user.id}`);

    // Check if username is available
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (checkError) {
      console.error("Error checking username:", checkError);
      throw new Error(`Failed to check username: ${checkError.message}`);
    }

    if (existingUser) {
      throw new Error("Username is already taken");
    }

    // Update the user's profile with username and PIN
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username: username.toLowerCase(),
        pos_pin: posPin
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    console.log(`Profile completed successfully for user: ${user.id}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Profile completed successfully"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in complete-profile function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to complete profile"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);