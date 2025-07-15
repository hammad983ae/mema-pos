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

    // Get current time and 24 hours from now
    const now = new Date()
    const reminderWindow = new Date(now.getTime() + (24 * 60 * 60 * 1000)) // 24 hours

    // Find appointments that need reminders
    const { data: appointments, error: appointmentsError } = await supabaseClient
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        reminder_sent,
        customers(first_name, last_name, email, phone),
        services(name, duration),
        businesses(name)
      `)
      .eq('status', 'scheduled')
      .eq('reminder_sent', false)
      .gte('appointment_date', now.toISOString().split('T')[0])
      .lte('appointment_date', reminderWindow.toISOString().split('T')[0])

    if (appointmentsError) {
      throw appointmentsError
    }

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No appointments need reminders', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let sentCount = 0

    for (const appointment of appointments) {
      if (!appointment.customers?.email) continue

      try {
        // Create reminder record
        const reminderTime = new Date(`${appointment.appointment_date}T${appointment.start_time}`)
        reminderTime.setHours(reminderTime.getHours() - 24) // 24 hours before

        const { error: reminderError } = await supabaseClient
          .from('appointment_reminders')
          .insert([{
            appointment_id: appointment.id,
            reminder_type: 'email',
            reminder_time: reminderTime.toISOString(),
            status: 'sent',
            sent_at: now.toISOString()
          }])

        if (reminderError) {
          console.error('Error creating reminder record:', reminderError)
          continue
        }

        // Mark appointment as reminder sent
        const { error: updateError } = await supabaseClient
          .from('appointments')
          .update({ reminder_sent: true })
          .eq('id', appointment.id)

        if (updateError) {
          console.error('Error updating appointment:', updateError)
          continue
        }

        // In a real implementation, you would send the actual email here
        // using a service like Resend, SendGrid, etc.
        console.log(`Reminder sent for appointment ${appointment.id} to ${appointment.customers.email}`)
        
        sentCount++
      } catch (error) {
        console.error(`Error processing reminder for appointment ${appointment.id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Reminders processed`,
        totalAppointments: appointments.length,
        remindersSent: sentCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-appointment-reminder function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})