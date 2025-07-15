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
    const { action, documentId, content, fileName, mimeType } = await req.json();

    console.log(`Processing ${action} for document ${documentId}`);

    switch (action) {
      case 'categorize':
        return await categorizeDocument(content, fileName, mimeType, documentId);
      case 'search':
        return await searchDocuments(content);
      case 'summarize':
        return await summarizeDocument(content, documentId);
      case 'extract_invoice':
        return await extractInvoiceData(content, documentId);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in ai-document-processor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function categorizeDocument(content: string, fileName: string, mimeType: string, documentId: string) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Get existing categories from database
  const { data: categories } = await supabase
    .from('document_categories')
    .select('name, description')
    .eq('is_active', true);

  const categoriesContext = categories?.map(c => `${c.name}: ${c.description || ''}`).join('\n') || '';

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
          content: `You are a document categorization AI. Analyze the document and suggest:
1. The most appropriate category from the existing categories (or "Other" if none fit)
2. 3-5 relevant tags for the document
3. A brief description if the current one is empty

Existing categories:
${categoriesContext}

Return your response as JSON with this structure:
{
  "category": "category_name",
  "tags": ["tag1", "tag2", "tag3"],
  "description": "brief description if needed"
}`
        },
        {
          role: 'user',
          content: `Document: ${fileName}
Type: ${mimeType}
Content: ${content.substring(0, 4000)}`
        }
      ],
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);

  // Update document with AI suggestions
  const { error } = await supabase
    .from('documents')
    .update({
      tags: result.tags,
      description: result.description,
      metadata: { ai_categorized: true, suggested_category: result.category }
    })
    .eq('id', documentId);

  if (error) throw error;

  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function searchDocuments(query: string) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Get all documents for semantic search
  const { data: documents } = await supabase
    .from('documents')
    .select(`
      id, title, description, file_name, tags, 
      document_categories(name),
      profiles(full_name)
    `)
    .eq('is_current_version', true);

  // Use AI to understand search intent and match documents
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
          content: `You are a document search AI. Analyze the user's search query and find the most relevant documents from the provided list. Consider title, description, tags, category, and semantic meaning.

Return the document IDs ranked by relevance (most relevant first) along with relevance scores (0-1) and brief explanations.

Return as JSON:
{
  "results": [
    {
      "id": "doc_id",
      "relevance": 0.95,
      "reason": "explanation why this document matches"
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Search query: "${query}"

Available documents:
${documents?.map(d => `ID: ${d.id}
Title: ${d.title}
Description: ${d.description || 'No description'}
Tags: ${d.tags?.join(', ') || 'No tags'}
Category: ${d.document_categories?.name || 'Uncategorized'}
Uploader: ${d.profiles?.full_name || 'Unknown'}`).join('\n\n')}`
        }
      ],
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  const searchResults = JSON.parse(data.choices[0].message.content);

  return new Response(
    JSON.stringify(searchResults),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function summarizeDocument(content: string, documentId: string) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

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
          content: 'You are a document summarization AI. Create a concise, informative summary of the document content. Focus on key points, important details, and actionable items.'
        },
        {
          role: 'user',
          content: `Please summarize this document:\n\n${content}`
        }
      ],
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  const summary = data.choices[0].message.content;

  // Store summary in metadata
  const { error } = await supabase
    .from('documents')
    .update({
      metadata: { ai_summary: summary, last_summarized: new Date().toISOString() }
    })
    .eq('id', documentId);

  if (error) throw error;

  return new Response(
    JSON.stringify({ summary }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function extractInvoiceData(content: string, documentId: string) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

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
          content: `You are an invoice processing AI. Extract key information from invoices and return structured data.

Return JSON with this structure:
{
  "invoice_number": "string or null",
  "date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null", 
  "vendor": "string or null",
  "total_amount": "number or null",
  "tax_amount": "number or null",
  "line_items": [
    {
      "description": "string",
      "quantity": "number or null",
      "unit_price": "number or null",
      "total": "number or null"
    }
  ],
  "vendor_address": "string or null",
  "billing_address": "string or null"
}`
        },
        {
          role: 'user',
          content: `Extract invoice data from this document:\n\n${content}`
        }
      ],
      temperature: 0.1,
    }),
  });

  const data = await response.json();
  const invoiceData = JSON.parse(data.choices[0].message.content);

  // Store extracted data in metadata
  const { error } = await supabase
    .from('documents')
    .update({
      metadata: { 
        invoice_data: invoiceData, 
        ai_processed: true,
        processed_at: new Date().toISOString()
      }
    })
    .eq('id', documentId);

  if (error) throw error;

  return new Response(
    JSON.stringify(invoiceData),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}