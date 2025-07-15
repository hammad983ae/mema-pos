import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChargebackDispute {
  id: string;
  case_number: string;
  transaction_id?: string;
  transaction_date: string;
  dispute_amount: number;
  currency: string;
  customer_name: string;
  customer_email?: string;
  chargeback_reason: string;
  chargeback_date: string;
  response_deadline: string;
  bank_name?: string;
  bank_contact_info?: string;
  merchant_category_code?: string;
  acquiring_bank?: string;
  dispute_description?: string;
}

interface Evidence {
  evidence_type: string;
  file_name: string;
  description?: string;
  is_primary: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, disputeId, businessId, customInstructions } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let result;
    switch (action) {
      case 'generate_dispute_response':
        result = await generateDisputeResponse(disputeId, customInstructions, openAIApiKey, supabase);
        break;
      case 'analyze_case_strength':
        result = await analyzeCaseStrength(disputeId, openAIApiKey, supabase);
        break;
      case 'suggest_evidence':
        result = await suggestEvidence(disputeId, openAIApiKey, supabase);
        break;
      case 'draft_bank_email':
        result = await draftBankEmail(disputeId, customInstructions, openAIApiKey, supabase);
        break;
      default:
        throw new Error('Invalid action specified');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in chargeback-dispute-ai function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

async function generateDisputeResponse(disputeId: string, customInstructions: string, openAIApiKey: string, supabase: any) {
  // Get dispute details and evidence
  const { data: dispute, error: disputeError } = await supabase
    .from('chargeback_disputes')
    .select('*')
    .eq('id', disputeId)
    .single();

  if (disputeError || !dispute) {
    throw new Error('Dispute not found');
  }

  const { data: evidence, error: evidenceError } = await supabase
    .from('chargeback_evidence')
    .select('*')
    .eq('dispute_id', disputeId);

  if (evidenceError) {
    throw new Error('Failed to fetch evidence');
  }

  const evidenceList = evidence.map(e => `${e.evidence_type}: ${e.description || e.file_name}`).join('\n');

  const prompt = `
You are an expert chargeback dispute specialist helping a Caribbean business fight a chargeback. Generate a professional, detailed dispute response letter.

DISPUTE DETAILS:
- Case Number: ${dispute.case_number}
- Transaction Date: ${dispute.transaction_date}
- Amount: ${dispute.currency} ${dispute.dispute_amount}
- Customer: ${dispute.customer_name}
- Chargeback Reason: ${dispute.chargeback_reason}
- Bank: ${dispute.bank_name || 'Unknown'}
- Dispute Description: ${dispute.dispute_description || 'Not provided'}

AVAILABLE EVIDENCE:
${evidenceList}

CUSTOM INSTRUCTIONS:
${customInstructions || 'Use standard professional tone'}

Generate a comprehensive dispute response that includes:
1. Professional header with case reference
2. Clear statement of merchant position
3. Detailed rebuttal to chargeback reason
4. Reference to supporting evidence
5. Legal compliance points for Caribbean jurisdiction
6. Professional closing with next steps

Make it formal, factual, and persuasive. Focus on evidence-based arguments.
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert legal professional specializing in chargeback disputes for Caribbean businesses. Generate professional, persuasive dispute responses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  const generatedResponse = data.choices[0].message.content;

  // Save the AI-generated response to the dispute
  await supabase
    .from('chargeback_disputes')
    .update({ ai_generated_response: generatedResponse })
    .eq('id', disputeId);

  return {
    success: true,
    dispute_response: generatedResponse,
    case_number: dispute.case_number
  };
}

async function analyzeCaseStrength(disputeId: string, openAIApiKey: string, supabase: any) {
  const { data: dispute, error: disputeError } = await supabase
    .from('chargeback_disputes')
    .select('*')
    .eq('id', disputeId)
    .single();

  if (disputeError || !dispute) {
    throw new Error('Dispute not found');
  }

  const { data: evidence, error: evidenceError } = await supabase
    .from('chargeback_evidence')
    .select('*')
    .eq('dispute_id', disputeId);

  if (evidenceError) {
    throw new Error('Failed to fetch evidence');
  }

  const evidenceTypes = evidence.map(e => e.evidence_type);
  const evidenceList = evidence.map(e => `${e.evidence_type}: ${e.description || e.file_name}`).join('\n');

  const prompt = `
Analyze the strength of this chargeback dispute case for a Caribbean business:

DISPUTE DETAILS:
- Chargeback Reason: ${dispute.chargeback_reason}
- Amount: ${dispute.currency} ${dispute.dispute_amount}
- Transaction Date: ${dispute.transaction_date}
- Response Deadline: ${dispute.response_deadline}

AVAILABLE EVIDENCE:
${evidenceList}

Provide analysis including:
1. Case strength score (1-10, where 10 is strongest)
2. Key strengths in the evidence
3. Potential weaknesses or gaps
4. Recommended additional evidence to collect
5. Likelihood of success percentage
6. Strategic recommendations

Be honest and practical in your assessment.
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert chargeback dispute analyst. Provide honest, actionable assessments of case strength.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1500,
    }),
  });

  const data = await response.json();
  const analysis = data.choices[0].message.content;

  return {
    success: true,
    case_analysis: analysis,
    evidence_count: evidence.length,
    case_number: dispute.case_number
  };
}

async function suggestEvidence(disputeId: string, openAIApiKey: string, supabase: any) {
  const { data: dispute, error: disputeError } = await supabase
    .from('chargeback_disputes')
    .select('*')
    .eq('id', disputeId)
    .single();

  if (disputeError || !dispute) {
    throw new Error('Dispute not found');
  }

  const { data: evidence, error: evidenceError } = await supabase
    .from('chargeback_evidence')
    .select('evidence_type')
    .eq('dispute_id', disputeId);

  if (evidenceError) {
    throw new Error('Failed to fetch evidence');
  }

  const existingEvidenceTypes = evidence.map(e => e.evidence_type);

  const prompt = `
For a chargeback dispute with reason "${dispute.chargeback_reason}", suggest the most important evidence to collect.

CURRENT EVIDENCE: ${existingEvidenceTypes.join(', ') || 'None uploaded yet'}

DISPUTE CONTEXT:
- Reason: ${dispute.chargeback_reason}
- Amount: ${dispute.currency} ${dispute.dispute_amount}
- Customer: ${dispute.customer_name}

Suggest specific evidence types that would strengthen this case. For each suggestion, explain:
1. What evidence to collect
2. Why it's important for this dispute reason
3. How to obtain it
4. Priority level (Critical/Important/Helpful)

Focus on evidence that directly counters the chargeback reason.
`;

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
          content: 'You are a chargeback evidence specialist. Provide specific, actionable evidence collection recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1200,
    }),
  });

  const data = await response.json();
  const suggestions = data.choices[0].message.content;

  return {
    success: true,
    evidence_suggestions: suggestions,
    existing_evidence: existingEvidenceTypes,
    case_number: dispute.case_number
  };
}

async function draftBankEmail(disputeId: string, customInstructions: string, openAIApiKey: string, supabase: any) {
  const { data: dispute, error: disputeError } = await supabase
    .from('chargeback_disputes')
    .select('*')
    .eq('id', disputeId)
    .single();

  if (disputeError || !dispute) {
    throw new Error('Dispute not found');
  }

  const { data: evidence, error: evidenceError } = await supabase
    .from('chargeback_evidence')
    .select('*')
    .eq('dispute_id', disputeId);

  if (evidenceError) {
    throw new Error('Failed to fetch evidence');
  }

  const evidenceList = evidence.map(e => e.file_name).join(', ');

  const prompt = `
Draft a professional email to the bank for this chargeback dispute:

DISPUTE DETAILS:
- Case Number: ${dispute.case_number}
- Bank: ${dispute.bank_name || 'Issuing Bank'}
- Amount: ${dispute.currency} ${dispute.dispute_amount}
- Chargeback Reason: ${dispute.chargeback_reason}
- Deadline: ${dispute.response_deadline}

ATTACHED EVIDENCE: ${evidenceList || 'Supporting documentation'}

CUSTOM INSTRUCTIONS: ${customInstructions || 'Standard professional tone'}

Create a formal email that:
1. Has a clear, professional subject line
2. References the case number immediately
3. States merchant position clearly
4. Lists attached evidence
5. Requests reversal of chargeback
6. Includes contact information for follow-up
7. Uses appropriate business language for Caribbean banking context

Make it concise but comprehensive.
`;

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
          content: 'You are a professional business communications specialist. Draft formal, effective emails for financial institutions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 800,
    }),
  });

  const data = await response.json();
  const emailDraft = data.choices[0].message.content;

  return {
    success: true,
    email_draft: emailDraft,
    case_number: dispute.case_number,
    bank_contact: dispute.bank_contact_info
  };
}

serve(handler);