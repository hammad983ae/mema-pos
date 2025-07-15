import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, errorData, systemInfo, userMessage, conversationId } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    if (action === 'diagnose_error') {
      // Create comprehensive system prompt for Fielix support
      const systemPrompt = `You are a specialized AI support agent for Fielix, a comprehensive business management platform with POS, inventory, team management, and customer service features.

Your expertise includes:
- POS system troubleshooting (cash drawer, receipt printing, payment processing)
- Inventory management issues (stock alerts, product sync, barcode scanning)  
- Team management problems (scheduling, time clock, permissions)
- Database connectivity and sync issues
- UI/UX problems and navigation issues
- Integration problems with external services
- Performance optimization and system health

When helping with errors:
1. Analyze the error details thoroughly
2. Provide step-by-step troubleshooting instructions
3. Suggest immediate workarounds if available
4. Identify if this requires developer intervention
5. Provide prevention tips for the future

Response format should be JSON:
{
  "diagnosis": "Brief explanation of the issue",
  "severity": "low|medium|high|critical",
  "category": "pos|inventory|team|system|integration",
  "solution": {
    "immediate_steps": ["Step 1", "Step 2", "etc"],
    "workaround": "Alternative approach if main fix isn't possible",
    "requires_dev": boolean,
    "estimated_time": "5 minutes"
  },
  "prevention": "How to avoid this issue in the future",
  "related_docs": ["link1", "link2"] // if applicable
}`;

      // Prepare error context
      const errorContext = {
        error: errorData,
        system: systemInfo,
        timestamp: new Date().toISOString(),
        userAgent: req.headers.get('user-agent')
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { 
              role: 'user', 
              content: `Please diagnose this Fielix system issue:
              
Error Details: ${JSON.stringify(errorContext)}
User Description: ${userMessage}`
            }
          ],
          temperature: 0.2,
          max_tokens: 1500,
        }),
      });

      const data = await response.json();
      const diagnosis = JSON.parse(data.choices[0].message.content);

      // Log the support request
      await supabase.from('support_requests').insert({
        error_data: errorContext,
        user_message: userMessage,
        ai_diagnosis: diagnosis,
        status: 'diagnosed',
        severity: diagnosis.severity,
        category: diagnosis.category
      });

      return new Response(JSON.stringify(diagnosis), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'chat_support') {
      // Get conversation history if provided
      let conversationHistory = '';
      if (conversationId) {
        const { data: messages } = await supabase
          .from('support_chat_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(10);

        conversationHistory = messages?.map(msg => 
          `${msg.sender_type}: ${msg.content}`
        ).join('\n') || '';
      }

      const systemPrompt = `You are a helpful Fielix support agent. You assist with POS issues, system problems, and general troubleshooting.

Be conversational, helpful, and solution-focused. If you need more information to help, ask specific questions.

Previous conversation:
${conversationHistory}

Keep responses concise but thorough. Always aim to provide actionable solutions.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Save conversation if conversationId provided
      if (conversationId) {
        await supabase.from('support_chat_messages').insert([
          {
            conversation_id: conversationId,
            content: userMessage,
            sender_type: 'user'
          },
          {
            conversation_id: conversationId,
            content: aiResponse,
            sender_type: 'ai'
          }
        ]);
      }

      return new Response(JSON.stringify({ response: aiResponse }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'system_health_check') {
      // Analyze system health and provide recommendations
      const healthPrompt = `You are analyzing Fielix system health. Based on the provided metrics, identify potential issues and provide recommendations.

Respond with JSON:
{
  "overall_health": "excellent|good|fair|poor|critical",
  "issues": [
    {
      "component": "pos|inventory|database|etc",
      "severity": "low|medium|high",
      "description": "Issue description",
      "recommendation": "What to do about it"
    }
  ],
  "optimizations": ["Performance improvement suggestions"],
  "alerts": ["Things to monitor closely"]
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: healthPrompt },
            { role: 'user', content: `System metrics: ${JSON.stringify(systemInfo)}` }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      const data = await response.json();
      const healthReport = JSON.parse(data.choices[0].message.content);

      return new Response(JSON.stringify(healthReport), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action specified');

  } catch (error) {
    console.error('Error in Fielix support AI:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});