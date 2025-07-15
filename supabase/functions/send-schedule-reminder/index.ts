import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleReminderRequest {
  userId?: string;
  scheduleDate?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, scheduleDate }: ScheduleReminderRequest = await req.json();

    console.log(`Processing schedule reminders for user: ${userId || 'all'}, date: ${scheduleDate || 'tomorrow'}`);

    // Calculate tomorrow's date if not specified
    const tomorrow = scheduleDate ? new Date(scheduleDate) : new Date();
    if (!scheduleDate) {
      tomorrow.setDate(tomorrow.getDate() + 1);
    }
    const tomorrowString = tomorrow.toISOString().split('T')[0];

    // Build query conditions
    let query = supabase
      .from('employee_schedules')
      .select(`
        *,
        profiles!inner(full_name, phone, email),
        stores!inner(name, address)
      `)
      .eq('schedule_date', tomorrowString)
      .eq('status', 'scheduled');

    // Filter by user if specified
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: schedules, error: scheduleError } = await query;

    if (scheduleError) {
      console.error('Error fetching schedules:', scheduleError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch schedules' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notifications = [];

    for (const schedule of schedules || []) {
      const employeeName = schedule.profiles?.full_name || 'Employee';
      const storeName = schedule.stores?.name || 'Store';
      const storeAddress = schedule.stores?.address || '';
      const startTime = schedule.start_time;
      const endTime = schedule.end_time;

      // Create notification message
      const message = `🗓️ WORK SCHEDULE REMINDER

Hi ${employeeName},

You have a shift scheduled for tomorrow:

📅 Date: ${new Date(schedule.schedule_date).toLocaleDateString()}
🕒 Time: ${startTime} - ${endTime}
🏪 Location: ${storeName}
📍 Address: ${storeAddress}

${schedule.notes ? `📝 Notes: ${schedule.notes}` : ''}

Please arrive 10 minutes early and make sure you have everything you need.

Have a great day!`;

      // Log the notification (in a real implementation, you would send via SMS/email/push)
      console.log('Schedule reminder prepared:', {
        employee: employeeName,
        phone: schedule.profiles?.phone,
        email: schedule.profiles?.email,
        scheduleDate: schedule.schedule_date,
        startTime,
        endTime,
        storeName,
        message: message.substring(0, 100) + '...'
      });

      // Simulate sending notification
      const notificationResult = {
        scheduleId: schedule.id,
        employee: employeeName,
        phone: schedule.profiles?.phone,
        email: schedule.profiles?.email,
        scheduleDate: schedule.schedule_date,
        startTime,
        endTime,
        storeName,
        storeAddress,
        sentAt: new Date().toISOString(),
        type: 'schedule_reminder',
        status: 'sent'
      };

      notifications.push(notificationResult);

      // In a real implementation, you would integrate with:
      // - Twilio for SMS: Send to schedule.profiles?.phone
      // - Resend/SendGrid for email: Send to schedule.profiles?.email
      // - Push notification service for mobile apps
      // - WhatsApp Business API for WhatsApp messages
    }

    const response = {
      success: true,
      date: tomorrowString,
      notificationsSent: notifications.length,
      notifications,
      message: `Sent ${notifications.length} schedule reminders for ${tomorrowString}`
    };

    console.log('Schedule reminders processed successfully:', response);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in send-schedule-reminder function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process schedule reminders'
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);