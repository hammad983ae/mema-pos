import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { calculateTaxes, TaxRate, TaxExemption, TaxCalculationResult } from "@/utils/taxCalculations";

export const useTaxCalculation = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [exemptions, setExemptions] = useState<TaxExemption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTaxData();
  }, []);

  const fetchTaxData = async () => {
    setLoading(true);
    try {
      // Fetch tax rates
      const { data: ratesData, error: ratesError } = await supabase
        .from("tax_rates")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (ratesError) throw ratesError;

      // Fetch tax exemptions
      const { data: exemptionsData, error: exemptionsError } = await supabase
        .from("tax_exemptions")
        .select("*")
        .eq("is_active", true);

      if (exemptionsError) throw exemptionsError;

      setTaxRates(ratesData || []);
      setExemptions((exemptionsData || []) as TaxExemption[]);
    } catch (error: any) {
      console.error("Error fetching tax data:", error);
      toast({
        title: "Error",
        description: "Failed to load tax configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateOrderTax = (
    subtotal: number,
    customerId?: string,
    productIds?: string[],
    categoryIds?: string[]
  ): TaxCalculationResult => {
    return calculateTaxes({
      subtotal,
      taxRates,
      exemptions,
      customerId,
      productIds,
      categoryIds
    });
  };

  const addTaxExemption = async (
    exemptionType: 'customer' | 'product' | 'category',
    entityId: string,
    taxRateId?: string,
    reason?: string
  ) => {
    if (!user) return;
    
    try {
      // Get user's business context
      const { data: userBusiness } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!userBusiness?.business_id) {
        throw new Error("Business context not found");
      }

      const { error } = await supabase
        .from("tax_exemptions")
        .insert([{
          business_id: userBusiness.business_id,
          exemption_type: exemptionType,
          entity_id: entityId,
          tax_rate_id: taxRateId,
          exemption_reason: reason,
          is_active: true,
          created_by: user.id
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tax exemption added successfully",
      });

      // Refresh data
      await fetchTaxData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add tax exemption",
        variant: "destructive",
      });
    }
  };

  const removeTaxExemption = async (exemptionId: string) => {
    try {
      const { error } = await supabase
        .from("tax_exemptions")
        .update({ is_active: false })
        .eq("id", exemptionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tax exemption removed successfully",
      });

      // Refresh data
      await fetchTaxData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove tax exemption",
        variant: "destructive",
      });
    }
  };

  const saveTaxDetails = async (orderId: string, taxCalculation: TaxCalculationResult) => {
    try {
      const taxDetailsToSave = taxCalculation.taxDetails.map(detail => ({
        order_id: orderId,
        tax_rate_id: detail.tax_rate_id,
        tax_name: detail.tax_name,
        tax_rate: detail.tax_rate,
        taxable_amount: detail.taxable_amount,
        tax_amount: detail.tax_amount,
        is_compound: detail.is_compound
      }));

      const { error } = await supabase
        .from("order_tax_details")
        .insert(taxDetailsToSave);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error saving tax details:", error);
      // Don't show toast for this as it's a background operation
    }
  };

  const getCustomerExemptions = (customerId: string) => {
    return exemptions.filter(
      ex => ex.exemption_type === 'customer' && 
            ex.entity_id === customerId && 
            ex.is_active
    );
  };

  const getProductExemptions = (productId: string) => {
    return exemptions.filter(
      ex => ex.exemption_type === 'product' && 
            ex.entity_id === productId && 
            ex.is_active
    );
  };

  const getCategoryExemptions = (categoryId: string) => {
    return exemptions.filter(
      ex => ex.exemption_type === 'category' && 
            ex.entity_id === categoryId && 
            ex.is_active
    );
  };

  const refreshTaxData = () => {
    fetchTaxData();
  };

  return {
    taxRates,
    exemptions,
    loading,
    calculateOrderTax,
    addTaxExemption,
    removeTaxExemption,
    saveTaxDetails,
    getCustomerExemptions,
    getProductExemptions,
    getCategoryExemptions,
    refreshTaxData
  };
};