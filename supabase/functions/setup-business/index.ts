import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SetupBusinessRequest {
  businessName: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
  subscriptionPlan?: string;
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

    const { 
      businessName,
      businessEmail,
      businessPhone,
      businessAddress,
      subscriptionPlan = 'starter'
    }: SetupBusinessRequest = await req.json();

    if (!businessName?.trim()) {
      throw new Error("Business name is required");
    }

    console.log(`Setting up business for user: ${user.id}`);

    // Start a transaction-like operation
    try {
      // 1. Generate invitation code and create the business
      const { data: invitationCodeData, error: codeError } = await supabase.rpc('generate_invitation_code');
      
      if (codeError) {
        console.error("Error generating invitation code:", codeError);
        throw new Error(`Failed to generate invitation code: ${codeError.message}`);
      }

      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: businessName.trim(),
          email: businessEmail,
          phone: businessPhone,
          address: businessAddress,
          subscription_plan: subscriptionPlan,
          subscription_status: 'active',
          owner_user_id: user.id,
          invitation_code: invitationCodeData,
          settings: {}
        })
        .select()
        .single();

      if (businessError) {
        console.error("Error creating business:", businessError);
        throw new Error(`Failed to create business: ${businessError.message}`);
      }

      console.log(`Business created with ID: ${business.id}`);

      // 2. Business owner membership is automatically created by the database trigger
      console.log("Business owner membership will be created automatically by trigger");

      // 3. Create a default store for the business
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert({
          name: `${businessName} - Main Location`,
          business_id: business.id,
          address: businessAddress,
          email: businessEmail,
          phone: businessPhone,
          status: 'active',
          tax_rate: 0.08875, // Default tax rate
          timezone: 'America/New_York'
        })
        .select()
        .single();

      if (storeError) {
        console.error("Error creating store:", storeError);
        // Note: We don't cleanup here as the business and membership are still valid
        console.log("Business created but store creation failed - can be created later");
      } else {
        console.log(`Default store created with ID: ${store.id}`);
      }

      // 4. Update the user's profile with business context
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          position: 'Business Owner',
          hire_date: new Date().toISOString().split('T')[0]
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        // This is not critical - continue
      }

      console.log("Business setup completed successfully");

      return new Response(JSON.stringify({
        success: true,
        business: {
          id: business.id,
          name: business.name,
          email: business.email,
          subscription_plan: business.subscription_plan,
          invitation_code: business.invitation_code
        },
        store: store ? {
          id: store.id,
          name: store.name
        } : null,
        message: "Business setup completed successfully"
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });

    } catch (setupError: any) {
      console.error("Error during business setup:", setupError);
      throw setupError;
    }

  } catch (error: any) {
    console.error("Error in setup-business function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to setup business"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);