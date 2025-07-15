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
    const { action, message, conversationId, customerId, businessId } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    if (action === 'chat') {
      // Get conversation history for context
      const { data: conversation } = await supabase
        .from('customer_service_conversations')
        .select(`
          *,
          customers(first_name, last_name, email, phone)
        `)
        .eq('id', conversationId)
        .single();

      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(20);

      // Build conversation context
      const customerInfo = conversation?.customers 
        ? `Customer: ${conversation.customers.first_name} ${conversation.customers.last_name} (${conversation.customers.email})`
        : 'Customer: Anonymous';

      const conversationHistory = messages?.map(msg => 
        `${msg.sender_type}: ${msg.content}`
      ).join('\n') || '';

      // Create AI prompt
      const systemPrompt = `You are a helpful customer service assistant. You're professional, empathetic, and solution-focused.

Customer Information: ${customerInfo}
Conversation Category: ${conversation?.category || 'General Support'}
Priority: ${conversation?.priority || 'medium'}

Recent conversation history:
${conversationHistory}

Instructions:
- Be helpful and professional
- Ask clarifying questions if needed
- Provide specific solutions when possible
- If you can't resolve something, suggest escalating to a human agent
- Keep responses concise but thorough
- Show empathy for customer concerns`;

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
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Save user message
      await supabase.from('chat_messages').insert({
        conversation_id: conversationId,
        content: message,
        sender_type: 'customer',
        sender_id: customerId,
      });

      // Save AI response
      await supabase.from('chat_messages').insert({
        conversation_id: conversationId,
        content: aiResponse,
        sender_type: 'ai',
        is_ai_generated: true,
        ai_confidence: 0.85,
      });

      // Update conversation timestamp
      await supabase
        .from('customer_service_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return new Response(JSON.stringify({ 
        response: aiResponse,
        conversationId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'categorize') {
      // Auto-categorize and prioritize new conversations
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
              content: `You are a customer service categorization assistant. Analyze the customer message and provide:
1. Category (one of: billing, technical, shipping, returns, general, complaint, compliment)
2. Priority (low, medium, high, urgent)
3. Suggested response approach
4. Whether it needs human escalation (true/false)

Respond in JSON format:
{
  "category": "category_name",
  "priority": "priority_level",
  "approach": "suggested approach",
  "needsEscalation": boolean,
  "reasoning": "brief explanation"
}`
            },
            { role: 'user', content: message }
          ],
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);

      return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'suggest_responses') {
      // Generate suggested responses for agents
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
              content: `Generate 3 different response suggestions for a customer service agent. 
Each should have a different tone:
1. Professional and formal
2. Friendly and casual
3. Empathetic and understanding

Return as JSON array with format:
[
  {"tone": "professional", "response": "response text"},
  {"tone": "friendly", "response": "response text"},
  {"tone": "empathetic", "response": "response text"}
]`
            },
            { role: 'user', content: `Customer message: ${message}` }
          ],
          temperature: 0.8,
        }),
      });

      const data = await response.json();
      const suggestions = JSON.parse(data.choices[0].message.content);

      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in AI customer service:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});