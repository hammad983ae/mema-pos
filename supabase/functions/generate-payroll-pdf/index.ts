import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayrollPDFRequest {
  payroll_id: string;
  payroll_data?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { payroll_id, payroll_data }: PayrollPDFRequest = await req.json();

    // Get payroll data from database if not provided
    let payrollInfo = payroll_data;
    if (!payrollInfo) {
      const { data: payrollRecord, error } = await supabase
        .from('payroll_periods')
        .select(`
          *,
          profiles!inner(full_name, payroll_email)
        `)
        .eq('id', payroll_id)
        .single();

      if (error) throw error;
      payrollInfo = payrollRecord;
    }

    // Get business settings for PDF customization
    const { data: settings } = await supabase
      .from('payroll_settings')
      .select('*')
      .eq('business_id', payrollInfo.business_id)
      .single();

    // Generate HTML for PDF
    const htmlContent = generatePayrollHTML(payrollInfo, settings);

    // For now, return the HTML content
    // In production, you would use a PDF generation library like Puppeteer
    const pdfBuffer = await generatePDF(htmlContent);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="payroll-${payroll_id}.pdf"`,
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error generating payroll PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

function generatePayrollHTML(payrollData: any, settings: any): string {
  const companyName = settings?.company_name || 'Your Company';
  const companyAddress = settings?.company_address || '';
  const employeeName = payrollData.profiles?.full_name || 'Employee';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payroll Statement</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-info { margin-bottom: 20px; }
        .employee-info { margin-bottom: 20px; }
        .payroll-details { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .daily-breakdown { margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Payroll Statement</h1>
        <div class="company-info">
          <h2>${companyName}</h2>
          ${companyAddress ? `<p>${companyAddress}</p>` : ''}
        </div>
      </div>
      
      <div class="employee-info">
        <h3>Employee Information</h3>
        <p><strong>Name:</strong> ${employeeName}</p>
        <p><strong>Pay Period:</strong> ${payrollData.period_start} to ${payrollData.period_end}</p>
        <p><strong>Generated:</strong> ${new Date(payrollData.generated_at).toLocaleDateString()}</p>
      </div>
      
      <div class="payroll-details">
        <h3>Earnings & Deductions</h3>
        <table>
          <tr><th>Description</th><th>Amount</th></tr>
          <tr><td>Total Sales</td><td>$${Number(payrollData.total_sales).toLocaleString()}</td></tr>
          <tr><td>Commission</td><td>$${Number(payrollData.total_commission).toLocaleString()}</td></tr>
          <tr><td>Base Pay</td><td>$${Number(payrollData.base_pay).toLocaleString()}</td></tr>
          <tr><td>Hours Worked</td><td>${Number(payrollData.total_hours).toFixed(1)} hours</td></tr>
          <tr class="total-row"><td>Gross Pay</td><td>$${Number(payrollData.gross_pay).toLocaleString()}</td></tr>
          <tr class="total-row"><td>Net Pay</td><td>$${Number(payrollData.net_pay).toLocaleString()}</td></tr>
        </table>
      </div>
      
      ${payrollData.daily_breakdown ? generateDailyBreakdownHTML(payrollData.daily_breakdown) : ''}
    </body>
    </html>
  `;
}

function generateDailyBreakdownHTML(dailyBreakdown: any): string {
  if (!dailyBreakdown || dailyBreakdown.length === 0) return '';
  
  const breakdown = typeof dailyBreakdown === 'string' ? JSON.parse(dailyBreakdown) : dailyBreakdown;
  
  let html = `
    <div class="daily-breakdown">
      <h3>Daily Breakdown</h3>
      <table>
        <tr><th>Date</th><th>Store</th><th>Sales</th><th>Commission</th><th>Hours</th></tr>
  `;
  
  breakdown.forEach((day: any) => {
    html += `
      <tr>
        <td>${new Date(day.date).toLocaleDateString()}</td>
        <td>${day.store}</td>
        <td>$${Number(day.sales).toLocaleString()}</td>
        <td>$${Number(day.commission).toLocaleString()}</td>
        <td>${Number(day.hours).toFixed(1)}h</td>
      </tr>
    `;
  });
  
  html += '</table></div>';
  return html;
}

// Simple PDF generation (in production, use Puppeteer or similar)
async function generatePDF(htmlContent: string): Promise<Uint8Array> {
  // For now, return the HTML as bytes
  // In production, you would use a PDF generation service
  return new TextEncoder().encode(htmlContent);
}

serve(handler);