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
    const { action, message, conversationId, customerInfo, issueType } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    if (action === 'customer_support_chat') {
      // Get conversation history if provided
      let conversationHistory = '';
      if (conversationId) {
        const { data: messages } = await supabase
          .from('customer_support_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(15);

        conversationHistory = messages?.map(msg => 
          `${msg.sender_type}: ${msg.content}`
        ).join('\n') || '';
      }

      // Create comprehensive Fielix support system prompt
      const systemPrompt = `You are a helpful customer support agent for Fielix, a comprehensive business management platform. You help business owners and their staff resolve issues with:

**FIELIX FEATURES YOU SUPPORT:**
• POS System (cash drawer, receipt printing, payment processing, barcode scanning)
• Inventory Management (stock tracking, low stock alerts, product management)
• Team Management (employee scheduling, time clock, user permissions, roles)
• Customer Management (customer profiles, visit tracking, loyalty points)
• Appointments & Booking (scheduling, reminders, calendar management)
• Reports & Analytics (sales reports, inventory reports, team performance)
• Settings & Configuration (business setup, store settings, integrations)

**COMMON ISSUES & SOLUTIONS:**

**POS PROBLEMS:**
- Receipt printer not working: Check power, paper, USB/network connection, try test print
- Cash drawer won't open: Check cable connection, ensure drawer is assigned to register
- Barcode scanner issues: Check USB connection, try different barcodes, verify scanner settings
- Payment processing errors: Check internet connection, verify payment processor settings
- POS running slowly: Clear browser cache, check internet speed, restart device

**USER & LOGIN ISSUES:**
- Employee can't log in: Check username/password, verify account is active, check user role permissions
- POS PIN not working: PIN may need reset by manager, check PIN requirements
- Permission errors: Verify user role has correct permissions for the action

**INVENTORY PROBLEMS:**
- Stock not updating: Check if inventory tracking is enabled for products, sync may be needed
- Low stock alerts not working: Verify threshold settings, check notification preferences
- Barcode scanning not finding products: Ensure products have correct barcodes assigned

**TIME CLOCK ISSUES:**
- Can't clock in/out: Check if user is scheduled, verify time clock permissions, check device time
- Missing punch records: Check for network issues during punch, may need manual entry

**GENERAL TROUBLESHOOTING:**
- App running slowly: Clear browser cache, check internet connection, try refreshing
- Data not syncing: Check internet connection, try logging out and back in
- Settings not saving: Ensure user has permission to change settings, check for error messages

**ESCALATION:**
If the issue requires technical investigation, account access, or billing support, offer to connect them with human support.

**TONE:** Be helpful, patient, and solution-focused. Ask clarifying questions to better understand the issue. Provide step-by-step instructions when possible.

Previous conversation:
${conversationHistory}

Customer Info: ${customerInfo ? JSON.stringify(customerInfo) : 'Not provided'}
Issue Type: ${issueType || 'General Support'}`;

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
          temperature: 0.3,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Save conversation messages
      if (conversationId) {
        await supabase.from('customer_support_messages').insert([
          {
            conversation_id: conversationId,
            content: message,
            sender_type: 'customer'
          },
          {
            conversation_id: conversationId,
            content: aiResponse,
            sender_type: 'ai',
            metadata: { issue_type: issueType }
          }
        ]);

        // Update conversation with last activity
        await supabase
          .from('customer_support_conversations')
          .update({ 
            last_message_at: new Date().toISOString(),
            issue_type: issueType 
          })
          .eq('id', conversationId);
      }

      return new Response(JSON.stringify({ 
        response: aiResponse,
        conversationId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'start_conversation') {
      // Create new customer support conversation
      const { data: conversation, error } = await supabase
        .from('customer_support_conversations')
        .insert({
          customer_email: customerInfo?.email || 'anonymous@example.com',
          customer_name: customerInfo?.name || 'Anonymous',
          issue_type: issueType || 'general',
          status: 'active',
          channel: 'ai_chat'
        })
        .select()
        .single();

      if (error) throw error;

      // Send initial welcome message
      const welcomeMessage = `Hi! I'm the Fielix support assistant. I'm here to help you resolve any issues with your Fielix system.

I can help with:
• POS problems (printing, cash drawer, payments)
• User login and permission issues  
• Inventory and stock management
• Time clock and scheduling
• General system questions

What issue are you experiencing today?`;

      await supabase.from('customer_support_messages').insert({
        conversation_id: conversation.id,
        content: welcomeMessage,
        sender_type: 'ai'
      });

      return new Response(JSON.stringify({ 
        conversationId: conversation.id,
        welcomeMessage 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'escalate_to_human') {
      // Mark conversation for human takeover
      if (conversationId) {
        await supabase
          .from('customer_support_conversations')
          .update({ 
            status: 'escalated',
            escalated_at: new Date().toISOString(),
            escalation_reason: message
          })
          .eq('id', conversationId);

        // Send escalation confirmation
        const escalationMessage = `I've escalated your issue to our human support team. A Fielix support specialist will reach out to you within 2 business hours to help resolve your issue.

In the meantime, you can also:
• Check our help documentation at fielix.com/help
• Email us directly at support@fielix.com
• Call our support line: 1-800-FIELIX

Reference ID: ${conversationId}`;

        await supabase.from('customer_support_messages').insert({
          conversation_id: conversationId,
          content: escalationMessage,
          sender_type: 'system'
        });

        return new Response(JSON.stringify({ 
          message: escalationMessage,
          escalated: true 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    throw new Error('Invalid action specified');

  } catch (error) {
    console.error('Error in customer support AI:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});