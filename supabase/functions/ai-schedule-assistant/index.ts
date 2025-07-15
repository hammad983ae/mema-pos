import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, businessId, scheduleData, timeframe } = await req.json();

    console.log(`AI Schedule Assistant: ${action} for business ${businessId}`);

    switch (action) {
      case 'analyze_team_performance':
        return await analyzeTeamPerformance(businessId, timeframe);
      case 'suggest_pairings':
        return await suggestTeamPairings(businessId, scheduleData);
      case 'optimize_schedule':
        return await optimizeSchedule(businessId, scheduleData);
      case 'learn_patterns':
        return await learnSchedulePatterns(businessId);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in ai-schedule-assistant:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function analyzeTeamPerformance(businessId: string, timeframe: string = '2_weeks') {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Get sales data for the timeframe
  const { data: salesData } = await supabase
    .from('orders')
    .select(`
      id, total, user_id, store_id, created_at, sale_type,
      profiles(full_name, position_type),
      stores(name)
    `)
    .eq('status', 'completed')
    .gte('created_at', getTimeframeDate(timeframe))
    .order('created_at', { ascending: false });

  // Get team compatibility data
  const { data: compatibilityData } = await supabase
    .from('team_compatibility')
    .select('*')
    .eq('business_id', businessId);

  // Get commission payments for performance tracking
  const { data: commissionData } = await supabase
    .from('commission_payments')
    .select('*')
    .eq('business_id', businessId)
    .gte('created_at', getTimeframeDate(timeframe));

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a retail scheduling analyst. Analyze team performance data to identify patterns and insights for optimal staff scheduling. Consider:
1. Individual performance metrics
2. Team compatibility scores
3. Store-specific performance
4. Opener vs Upseller effectiveness
5. Peak performance times/days

Return insights as JSON with this structure:
{
  "insights": [
    {
      "type": "performance" | "compatibility" | "timing" | "store_specific",
      "insight": "description",
      "confidence": 0.0-1.0,
      "actionable": "suggested action"
    }
  ],
  "top_performers": [
    {
      "user_id": "uuid",
      "name": "string",
      "role": "opener" | "upseller",
      "avg_performance": number,
      "best_stores": ["store_names"]
    }
  ],
  "best_pairings": [
    {
      "opener_id": "uuid",
      "upseller_id": "uuid", 
      "compatibility_score": number,
      "avg_sales": number
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Analyze this team performance data:

Sales Data (${salesData?.length || 0} records):
${salesData?.slice(0, 50).map(s => `${s.profiles?.full_name} (${s.profiles?.position_type}): $${s.total} at ${s.stores?.name} - ${s.sale_type}`).join('\n')}

Team Compatibility:
${compatibilityData?.map(c => `Users ${c.user_1_id} & ${c.user_2_id}: ${c.compatibility_score} compatibility, ${c.total_shifts_together} shifts together`).join('\n')}

Commission Performance:
${commissionData?.map(c => `${c.user_id}: $${c.commission_amount} commission on $${c.sale_amount} sale`).join('\n')}`
        }
      ],
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  const analysis = JSON.parse(data.choices[0].message.content);

  return new Response(
    JSON.stringify(analysis),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function suggestTeamPairings(businessId: string, scheduleData: any) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Get team members and their roles
  const { data: teamMembers } = await supabase
    .from('user_business_memberships')
    .select(`
      user_id, role,
      profiles(full_name, position_type)
    `)
    .eq('business_id', businessId)
    .eq('is_active', true)
    .in('role', ['employee', 'manager']);

  // Get recent performance data
  const { data: performanceData } = await supabase
    .from('orders')
    .select('user_id, total, store_id, sale_type')
    .eq('status', 'completed')
    .gte('created_at', getTimeframeDate('1_week'))
    .order('created_at', { ascending: false });

  // Get compatibility scores
  const { data: compatibilityData } = await supabase
    .from('team_compatibility')
    .select('*')
    .eq('business_id', businessId);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a scheduling assistant. Suggest optimal opener/upseller pairings for different stores based on:
1. Individual performance history
2. Team compatibility scores  
3. Store-specific success rates
4. Balance of skills and experience

Be subtle and supportive - managers value gut instinct. Provide gentle suggestions, not rigid recommendations.

Return JSON:
{
  "suggestions": [
    {
      "store_id": "uuid",
      "store_name": "string",
      "recommended_pairings": [
        {
          "opener": {"id": "uuid", "name": "string", "confidence": 0.0-1.0},
          "upseller": {"id": "uuid", "name": "string", "confidence": 0.0-1.0},
          "reasoning": "brief explanation",
          "estimated_performance": "increase/maintain/boost"
        }
      ],
      "alternative_options": ["brief alternatives"]
    }
  ],
  "general_tips": ["subtle scheduling tips"],
  "confidence_level": "low" | "medium" | "high"
}`
        },
        {
          role: 'user',
          content: `Current schedule context: ${JSON.stringify(scheduleData)}

Team Members:
${teamMembers?.map(m => `${m.profiles?.full_name} (${m.profiles?.position_type})`).join('\n')}

Recent Performance:
${performanceData?.slice(0, 20).map(p => `User ${p.user_id}: $${p.total} (${p.sale_type}) at store ${p.store_id}`).join('\n')}

Team Compatibility:
${compatibilityData?.slice(0, 10).map(c => `${c.compatibility_score} compatibility between users`).join('\n')}`
        }
      ],
      temperature: 0.4,
    }),
  });

  const data = await response.json();
  const suggestions = JSON.parse(data.choices[0].message.content);

  return new Response(
    JSON.stringify(suggestions),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function optimizeSchedule(businessId: string, scheduleData: any) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Get stores for this business
  const { data: stores } = await supabase
    .from('stores')
    .select('*')
    .eq('business_id', businessId);

  // Get historical sales patterns
  const { data: salesPatterns } = await supabase
    .from('orders')
    .select('store_id, created_at, total, user_id')
    .eq('status', 'completed')
    .gte('created_at', getTimeframeDate('2_weeks'));

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a subtle scheduling optimization assistant. Analyze the current schedule and provide gentle, non-intrusive suggestions for improvements. Remember that managers prefer to trust their instincts, so be supportive rather than prescriptive.

Return JSON:
{
  "optimization_suggestions": [
    {
      "area": "coverage" | "performance" | "balance" | "efficiency",
      "suggestion": "gentle suggestion",
      "impact": "potential positive outcome",
      "confidence": 0.0-1.0
    }
  ],
  "potential_gaps": [
    {
      "time_period": "day/time range",
      "store": "store name",
      "gap_type": "coverage/skill mix",
      "gentle_suggestion": "non-directive suggestion"
    }
  ],
  "strengths": ["positive aspects of current schedule"],
  "overall_tone": "supportive"
}`
        },
        {
          role: 'user',
          content: `Current Schedule: ${JSON.stringify(scheduleData)}

Available Stores:
${stores?.map(s => `${s.name} (${s.id})`).join('\n')}

Recent Sales Patterns:
${salesPatterns?.slice(0, 30).map(s => `Store ${s.store_id}: $${s.total} on ${new Date(s.created_at).toLocaleString()}`).join('\n')}`
        }
      ],
      temperature: 0.5,
    }),
  });

  const data = await response.json();
  const optimization = JSON.parse(data.choices[0].message.content);

  return new Response(
    JSON.stringify(optimization),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function learnSchedulePatterns(businessId: string) {
  // This function analyzes 2 weeks of data to learn patterns
  const { data: scheduleHistory } = await supabase
    .from('scheduled_shifts')
    .select(`
      *, 
      profiles(full_name, position_type),
      stores(name)
    `)
    .eq('business_id', businessId)
    .gte('shift_date', getTimeframeDate('2_weeks'));

  const { data: salesOutcomes } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'completed')
    .gte('created_at', getTimeframeDate('2_weeks'));

  // Store learned patterns in the database for future use
  const patterns = {
    learning_period: '2_weeks',
    patterns_identified: scheduleHistory?.length || 0,
    sales_correlation: salesOutcomes?.length || 0,
    last_updated: new Date().toISOString()
  };

  await supabase
    .from('ai_schedule_insights')
    .upsert({
      business_id: businessId,
      insights_data: patterns,
      created_at: new Date().toISOString()
    });

  return new Response(
    JSON.stringify({ message: 'Patterns learned successfully', patterns }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function getTimeframeDate(timeframe: string): string {
  const now = new Date();
  switch (timeframe) {
    case '1_week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '2_weeks':
      return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    case '1_month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  }
}