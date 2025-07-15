export interface TaxRate {
  id: string;
  name: string;
  rate: number; // decimal (e.g., 0.0825 for 8.25%)
  is_active: boolean;
  is_compound: boolean;
  sort_order: number;
}

export interface TaxExemption {
  id: string;
  exemption_type: 'customer' | 'product' | 'category';
  entity_id: string;
  tax_rate_id?: string;
  is_active: boolean;
}

export interface TaxCalculationResult {
  subtotal: number;
  taxDetails: Array<{
    tax_rate_id: string;
    tax_name: string;
    tax_rate: number;
    taxable_amount: number;
    tax_amount: number;
    is_compound: boolean;
  }>;
  totalTax: number;
  grandTotal: number;
}

interface TaxCalculationParams {
  subtotal: number;
  taxRates: TaxRate[];
  exemptions?: TaxExemption[];
  customerId?: string;
  productIds?: string[];
  categoryIds?: string[];
}

/**
 * Calculate taxes for a transaction with support for compound taxes and exemptions
 */
export const calculateTaxes = ({
  subtotal,
  taxRates,
  exemptions = [],
  customerId,
  productIds = [],
  categoryIds = []
}: TaxCalculationParams): TaxCalculationResult => {
  // Filter active tax rates and sort by order
  const activeTaxRates = taxRates
    .filter(rate => rate.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  // Check for customer-level exemptions
  const customerExemptions = exemptions.filter(
    ex => ex.exemption_type === 'customer' && 
          ex.entity_id === customerId && 
          ex.is_active
  );

  // Check for product/category exemptions
  const productExemptions = exemptions.filter(
    ex => (ex.exemption_type === 'product' && productIds.includes(ex.entity_id)) ||
          (ex.exemption_type === 'category' && categoryIds.includes(ex.entity_id)) &&
          ex.is_active
  );

  const taxDetails: TaxCalculationResult['taxDetails'] = [];
  let runningTotal = subtotal;
  let totalTax = 0;

  // Calculate simple taxes first
  const simpleTaxes = activeTaxRates.filter(rate => !rate.is_compound);
  const compoundTaxes = activeTaxRates.filter(rate => rate.is_compound);

  // Process simple taxes
  for (const taxRate of simpleTaxes) {
    // Check if this tax is exempted
    const isExempted = 
      customerExemptions.some(ex => !ex.tax_rate_id || ex.tax_rate_id === taxRate.id) ||
      productExemptions.some(ex => !ex.tax_rate_id || ex.tax_rate_id === taxRate.id);

    if (!isExempted) {
      const taxableAmount = subtotal;
      const taxAmount = taxableAmount * taxRate.rate;
      
      taxDetails.push({
        tax_rate_id: taxRate.id,
        tax_name: taxRate.name,
        tax_rate: taxRate.rate,
        taxable_amount: taxableAmount,
        tax_amount: taxAmount,
        is_compound: false
      });

      totalTax += taxAmount;
    }
  }

  // Update running total with simple taxes for compound calculation
  runningTotal = subtotal + totalTax;

  // Process compound taxes (applied on top of subtotal + simple taxes)
  for (const taxRate of compoundTaxes) {
    // Check if this tax is exempted
    const isExempted = 
      customerExemptions.some(ex => !ex.tax_rate_id || ex.tax_rate_id === taxRate.id) ||
      productExemptions.some(ex => !ex.tax_rate_id || ex.tax_rate_id === taxRate.id);

    if (!isExempted) {
      const taxableAmount = runningTotal;
      const taxAmount = taxableAmount * taxRate.rate;
      
      taxDetails.push({
        tax_rate_id: taxRate.id,
        tax_name: taxRate.name,
        tax_rate: taxRate.rate,
        taxable_amount: taxableAmount,
        tax_amount: taxAmount,
        is_compound: true
      });

      totalTax += taxAmount;
      runningTotal += taxAmount; // Update for next compound tax
    }
  }

  return {
    subtotal,
    taxDetails,
    totalTax: Number(totalTax.toFixed(2)),
    grandTotal: Number((subtotal + totalTax).toFixed(2))
  };
};

/**
 * Format tax rate for display (e.g., 0.0825 -> "8.25%")
 */
export const formatTaxRate = (rate: number): string => {
  return `${(rate * 100).toFixed(2)}%`;
};

/**
 * Parse tax rate from percentage string (e.g., "8.25%" -> 0.0825)
 */
export const parseTaxRate = (rateString: string): number => {
  const numericString = rateString.replace('%', '');
  return parseFloat(numericString) / 100;
};

/**
 * Get effective tax rate (simple calculation for display purposes)
 */
export const getEffectiveTaxRate = (taxRates: TaxRate[]): number => {
  const activeTaxRates = taxRates.filter(rate => rate.is_active);
  const simpleTaxes = activeTaxRates.filter(rate => !rate.is_compound);
  const compoundTaxes = activeTaxRates.filter(rate => rate.is_compound);

  // Calculate simple tax total
  const simpleTaxTotal = simpleTaxes.reduce((sum, rate) => sum + rate.rate, 0);
  
  // For compound taxes, approximate the effective rate
  // This is a simplified calculation - actual compound effect depends on order
  const compoundTaxTotal = compoundTaxes.reduce((sum, rate) => sum + rate.rate, 0);
  const compoundEffect = compoundTaxTotal * (1 + simpleTaxTotal);

  return simpleTaxTotal + compoundEffect;
};

/**
 * Validate tax configuration
 */
export const validateTaxConfiguration = (taxRates: TaxRate[]): string[] => {
  const errors: string[] = [];

  // Check for duplicate names
  const names = taxRates.map(rate => rate.name.toLowerCase());
  const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
  if (duplicateNames.length > 0) {
    errors.push(`Duplicate tax rate names found: ${[...new Set(duplicateNames)].join(', ')}`);
  }

  // Check for negative rates
  const negativeRates = taxRates.filter(rate => rate.rate < 0);
  if (negativeRates.length > 0) {
    errors.push(`Negative tax rates are not allowed: ${negativeRates.map(r => r.name).join(', ')}`);
  }

  // Check for excessively high rates (over 50%)
  const highRates = taxRates.filter(rate => rate.rate > 0.5);
  if (highRates.length > 0) {
    errors.push(`Tax rates over 50% detected: ${highRates.map(r => r.name).join(', ')}`);
  }

  // Warn about total effective rate
  const effectiveRate = getEffectiveTaxRate(taxRates);
  if (effectiveRate > 0.25) { // 25%
    errors.push(`Total effective tax rate is very high: ${formatTaxRate(effectiveRate)}`);
  }

  return errors;
};