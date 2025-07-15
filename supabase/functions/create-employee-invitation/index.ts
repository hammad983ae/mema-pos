import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: user } = await supabaseClient.auth.getUser(token)
    if (!user.user) {
      throw new Error('Unauthorized')
    }

    const { 
      businessId, 
      email, 
      fullName, 
      role,
      positionType
    } = await req.json()

    // Verify user has permission to create invitations
    const { data: membership } = await supabaseClient
      .from('user_business_memberships')
      .select('role')
      .eq('user_id', user.user.id)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .single()

    if (!membership || !['business_owner', 'manager', 'office'].includes(membership.role)) {
      throw new Error('Insufficient permissions')
    }

    // Check if email is already invited or registered
    const { data: existingInvite } = await supabaseClient
      .from('business_invitations')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('business_id', businessId)
      .is('used_at', null)
      .maybeSingle()

    if (existingInvite) {
      throw new Error('An invitation has already been sent to this email')
    }

    // Generate invitation token
    const invitationToken = crypto.randomUUID().substring(0, 8).toUpperCase()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    // Create invitation record
    const invitationData = {
      business_id: businessId,
      email: email.toLowerCase(),
      role: role,
      invitation_token: invitationToken,
      expires_at: expiresAt.toISOString(),
      invited_by: user.user.id
    }

    // Add position_type for employees
    if (role === 'employee' && positionType) {
      invitationData.position_type = positionType
    }

    const { error: invitationError } = await supabaseClient
      .from('business_invitations')
      .insert(invitationData)

    if (invitationError) {
      throw new Error(`Failed to create invitation: ${invitationError.message}`)
    }

    // Generate invitation link
    const baseUrl = req.headers.get('origin') || 'https://app.fielix.com'
    const invitationLink = `${baseUrl}/join?invite=${invitationToken}`

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitationLink,
        invitationToken,
        message: 'Employee invitation created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )

  } catch (error) {
    console.error('Error creating employee invitation:', error)
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