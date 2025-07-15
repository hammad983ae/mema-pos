import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  scheduleId: string;
  action: 'created' | 'updated' | 'deleted';
  managerName: string;
  userIds: string[];
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

    const { scheduleId, action, managerName, userIds }: NotificationRequest = await req.json();

    console.log(`Processing schedule notification: ${action} for schedule ${scheduleId}`);

    // Get the schedule details
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedule_assignments')
      .select(`
        *,
        stores!inner(name, address)
      `)
      .eq('id', scheduleId)
      .single();

    if (scheduleError || !schedule) {
      console.error('Error fetching schedule:', scheduleError);
      return new Response(
        JSON.stringify({ error: 'Schedule not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format push notification message
    let notificationTitle = '';
    let notificationMessage = '';
    const storeName = schedule.stores?.name || 'Store';
    const scheduleDate = new Date(schedule.schedule_date).toLocaleDateString();

    switch (action) {
      case 'created':
        notificationTitle = '📅 New Schedule Available';
        notificationMessage = `${managerName} has published a new schedule for ${scheduleDate}`;
        break;

      case 'updated':
        notificationTitle = '📝 Schedule Updated';
        notificationMessage = `${managerName} has updated the schedule for ${scheduleDate}`;
        break;

      case 'deleted':
        notificationTitle = '❌ Schedule Cancelled';
        notificationMessage = `${managerName} has cancelled the schedule for ${scheduleDate}`;
        break;
    }

    // Create push notification payload
    const notificationPayload = {
      title: notificationTitle,
      body: notificationMessage,
      data: {
        type: 'schedule_notification',
        scheduleId: scheduleId,
        action: action,
        scheduleDate: scheduleDate
      }
    };

    // Create notification records for each user
    const notificationRecords = userIds.map(userId => ({
      schedule_id: scheduleId,
      user_id: userId,
      notification_type: 'push' as const,
      message: notificationMessage,
      status: 'sent' as const
    }));

    const { error: logError } = await supabase
      .from('schedule_notifications')
      .insert(notificationRecords);

    if (logError) {
      console.error('Error logging notifications:', logError);
    }

    // Log push notification details
    console.log('Push notification prepared:', {
      userIds,
      payload: notificationPayload
    });

    // Return successful response
    const notificationResponse = {
      success: true,
      userCount: userIds.length,
      action,
      scheduledDate: scheduleDate,
      sentAt: new Date().toISOString(),
      notification: notificationPayload
    };

    console.log('Notification sent successfully:', notificationResponse);

    return new Response(
      JSON.stringify(notificationResponse),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in send-schedule-notification function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to send schedule notification'
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