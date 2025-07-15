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
    const { action, businessId, dateRange, storeId } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    if (action === 'sales_insights') {
      // Get sales data for analysis
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(*),
          stores!inner(business_id, name)
        `)
        .eq('stores.business_id', businessId)
        .eq('status', 'completed');

      if (dateRange?.from && dateRange?.to) {
        query = query
          .gte('created_at', dateRange.from)
          .lte('created_at', dateRange.to);
      }

      if (storeId && storeId !== 'all') {
        query = query.eq('store_id', storeId);
      }

      const { data: ordersData } = await query.limit(500);

      if (!ordersData || ordersData.length === 0) {
        return new Response(JSON.stringify({ 
          insights: [{
            type: 'info',
            title: 'Insufficient Data',
            description: 'Not enough sales data available for meaningful analysis.',
            confidence: 0.9
          }]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Prepare data summary for AI analysis
      const salesSummary = {
        totalOrders: ordersData.length,
        totalRevenue: ordersData.reduce((sum, order) => sum + order.total, 0),
        averageOrderValue: ordersData.reduce((sum, order) => sum + order.total, 0) / ordersData.length,
        topSellingTimes: ordersData.map(order => new Date(order.created_at).getHours()),
        dailySales: ordersData.reduce((acc, order) => {
          const date = new Date(order.created_at).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + order.total;
          return acc;
        }, {}),
        orderSizes: ordersData.map(order => order.order_items?.length || 0)
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
            {
              role: 'system',
              content: `You are a business intelligence analyst. Analyze sales data and provide actionable insights.
              
              Respond with a JSON array of insights in this exact format:
              [
                {
                  "type": "trend", // or "opportunity", "warning", "info"
                  "title": "Brief insight title",
                  "description": "Detailed explanation with specific numbers and actionable recommendations",
                  "confidence": 0.85, // 0-1 confidence score
                  "impact": "high" // or "medium", "low"
                }
              ]
              
              Focus on:
              - Sales patterns and trends
              - Peak selling hours/days
              - Revenue opportunities
              - Performance anomalies
              - Actionable recommendations`
            },
            {
              role: 'user',
              content: `Analyze this sales data: ${JSON.stringify(salesSummary)}`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      const data = await response.json();
      const insights = JSON.parse(data.choices[0].message.content);

      return new Response(JSON.stringify({ insights }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'inventory_forecast') {
      // Get inventory and sales data
      let inventoryQuery = supabase
        .from('inventory')
        .select(`
          *,
          products(*),
          stores!inner(business_id)
        `)
        .eq('stores.business_id', businessId);

      if (storeId && storeId !== 'all') {
        inventoryQuery = inventoryQuery.eq('store_id', storeId);
      }

      const { data: inventoryData } = await inventoryQuery;

      // Get recent sales data for products
      let salesQuery = supabase
        .from('order_items')
        .select(`
          *,
          orders!inner(store_id, created_at, stores!inner(business_id))
        `)
        .eq('orders.stores.business_id', businessId)
        .gte('orders.created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (storeId && storeId !== 'all') {
        salesQuery = salesQuery.eq('orders.store_id', storeId);
      }

      const { data: salesData } = await salesQuery;

      const forecastSummary = {
        lowStockItems: inventoryData?.filter(item => item.quantity_on_hand <= item.low_stock_threshold).length || 0,
        totalProducts: inventoryData?.length || 0,
        recentSales: salesData?.reduce((acc, item) => {
          acc[item.product_id] = (acc[item.product_id] || 0) + item.quantity;
          return acc;
        }, {}) || {},
        currentStock: inventoryData?.reduce((acc, item) => {
          acc[item.product_id] = item.quantity_on_hand;
          return acc;
        }, {}) || {}
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
            {
              role: 'system',
              content: `You are an inventory management specialist. Analyze inventory and sales data to provide forecasts and recommendations.
              
              Respond with a JSON object containing forecasts and recommendations:
              {
                "forecasts": [
                  {
                    "type": "stock_alert", // or "reorder_recommendation", "demand_forecast"
                    "title": "Forecast title",
                    "description": "Detailed forecast with specific recommendations",
                    "urgency": "high", // or "medium", "low"
                    "timeframe": "Next 7 days", // or relevant timeframe
                    "confidence": 0.8
                  }
                ],
                "recommendations": [
                  {
                    "action": "Increase order quantity",
                    "reason": "High demand trend detected",
                    "priority": "high"
                  }
                ]
              }`
            },
            {
              role: 'user',
              content: `Analyze this inventory data: ${JSON.stringify(forecastSummary)}`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'customer_behavior') {
      // Get customer and order data
      let customerQuery = supabase
        .from('orders')
        .select(`
          *,
          customers(*),
          stores!inner(business_id)
        `)
        .eq('stores.business_id', businessId)
        .not('customer_id', 'is', null);

      if (dateRange?.from && dateRange?.to) {
        customerQuery = customerQuery
          .gte('created_at', dateRange.from)
          .lte('created_at', dateRange.to);
      }

      if (storeId && storeId !== 'all') {
        customerQuery = customerQuery.eq('store_id', storeId);
      }

      const { data: customerOrders } = await customerQuery.limit(300);

      if (!customerOrders || customerOrders.length === 0) {
        return new Response(JSON.stringify({ 
          insights: [{
            type: 'info',
            title: 'Insufficient Customer Data',
            description: 'Not enough customer data available for behavioral analysis.',
            confidence: 0.9
          }]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Analyze customer behavior
      const customerBehavior = {
        totalCustomers: new Set(customerOrders.map(order => order.customer_id)).size,
        repeatCustomers: Object.values(
          customerOrders.reduce((acc, order) => {
            acc[order.customer_id] = (acc[order.customer_id] || 0) + 1;
            return acc;
          }, {})
        ).filter(count => count > 1).length,
        averageOrderValue: customerOrders.reduce((sum, order) => sum + order.total, 0) / customerOrders.length,
        purchaseFrequency: customerOrders.length / new Set(customerOrders.map(order => order.customer_id)).size,
        customerLifetimeValue: customerOrders.reduce((acc, order) => {
          if (order.customers) {
            acc[order.customer_id] = order.customers.total_spent || 0;
          }
          return acc;
        }, {})
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
            {
              role: 'system',
              content: `You are a customer behavior analyst. Analyze customer data and provide insights about customer patterns, retention, and growth opportunities.
              
              Respond with a JSON array of behavioral insights:
              [
                {
                  "type": "behavior", // or "retention", "growth", "segment"
                  "title": "Customer insight title",
                  "description": "Detailed analysis with specific metrics and actionable recommendations",
                  "category": "loyalty", // or "acquisition", "retention", "value"
                  "confidence": 0.8,
                  "actionable": true
                }
              ]`
            },
            {
              role: 'user',
              content: `Analyze this customer behavior data: ${JSON.stringify(customerBehavior)}`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      const data = await response.json();
      const insights = JSON.parse(data.choices[0].message.content);

      return new Response(JSON.stringify({ insights }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action specified');

  } catch (error) {
    console.error('Error in business intelligence AI:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});