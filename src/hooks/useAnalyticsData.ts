import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AnalyticsData {
  totalRevenue: number;
  totalTransactions: number;
  activeStores: number;
  teamPerformance: number;
}

export const useAnalyticsData = (
  dateRange: { from: Date; to: Date },
  selectedStore: string
) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalTransactions: 0,
    activeStores: 0,
    teamPerformance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, dateRange, selectedStore]);

  const fetchAnalyticsData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's business context (get first active membership)
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id, role")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (!membershipData) {
        throw new Error("User not associated with any business");
      }

      // Fetch stores for filter dropdown
      const { data: storesData } = await supabase
        .from("stores")
        .select("id, name")
        .eq("business_id", membershipData.business_id)
        .eq("status", "active");

      setStores(storesData || []);

      // Fetch analytics data based on date range and store filter
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      let storeFilter = {};
      if (selectedStore !== "all") {
        storeFilter = { store_id: selectedStore };
      }

      // Get orders within date range
      const { data: ordersData } = await supabase
        .from("orders")
        .select(`
          *,
          stores!inner(business_id)
        `)
        .eq("stores.business_id", membershipData.business_id)
        .gte("created_at", `${fromDate}T00:00:00`)
        .lte("created_at", `${toDate}T23:59:59`)
        .match(storeFilter);

      // Calculate analytics
      const totalRevenue = ordersData?.reduce((sum, order) => sum + order.total, 0) || 0;
      const totalTransactions = ordersData?.length || 0;

      // Get active stores count
      const { data: activeStoresData } = await supabase
        .from("stores")
        .select("id")
        .eq("business_id", membershipData.business_id)
        .eq("status", "active");

      const activeStores = activeStoresData?.length || 0;

      // Calculate team performance (simplified)
      const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      const teamPerformance = Math.min((avgOrderValue / 100) * 100, 150); // Target $100 AOV

      setAnalyticsData({
        totalRevenue,
        totalTransactions,
        activeStores,
        teamPerformance,
      });

    } catch (error: any) {
      console.error("Error fetching analytics data:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    analyticsData,
    stores,
    loading,
    refetch: fetchAnalyticsData
  };
};