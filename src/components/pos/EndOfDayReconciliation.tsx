import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Clock,
  Package
} from "lucide-react";
import { format } from "date-fns";

interface ReconciliationData {
  till_session?: {
    id: string;
    opening_cash: number;
    closing_cash?: number;
    total_sales: number;
    total_cash_sales: number;
    total_card_sales: number;
    total_cash_drops: number;
    total_transactions: number;
    cash_variance?: number;
  };
  sales_summary: {
    total_sales: number;
    cash_sales: number;
    card_sales: number;
    total_transactions: number;
  };
  inventory_changes: {
    items_sold: number;
    top_sold_products: Array<{
      product_name: string;
      quantity_sold: number;
    }>;
  };
  discrepancies: {
    cash_variance: number;
    inventory_issues: Array<{
      product_name: string;
      expected: number;
      actual: number;
      variance: number;
    }>;
  };
}

interface EndOfDayReconciliationProps {
  storeId: string;
  date?: string;
}

export const EndOfDayReconciliation = ({ storeId, date = new Date().toISOString().split('T')[0] }: EndOfDayReconciliationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [reconciliationData, setReconciliationData] = useState<ReconciliationData | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"pending" | "reviewed" | "approved" | "flagged">("pending");

  useEffect(() => {
    if (user && storeId) {
      generateReconciliationData();
    }
  }, [user, storeId, date]);

  const generateReconciliationData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get till session for the date
      const { data: tillSession } = await supabase
        .from("till_sessions")
        .select("*")
        .eq("store_id", storeId)
        .gte("session_start", `${date}T00:00:00.000Z`)
        .lt("session_start", `${date}T23:59:59.999Z`)
        .order("session_start", { ascending: false })
        .limit(1)
        .single();

      // Get sales data for the date
      const { data: salesData } = await supabase
        .from("orders")
        .select(`
          total,
          payment_method,
          order_items (
            quantity,
            products (
              name
            )
          )
        `)
        .eq("store_id", storeId)
        .gte("created_at", `${date}T00:00:00.000Z`)
        .lt("created_at", `${date}T23:59:59.999Z`)
        .eq("status", "completed");

      // Calculate sales summary
      const totalSales = salesData?.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0;
      const cashSales = salesData?.filter(o => o.payment_method === 'cash')
        .reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0;
      const cardSales = salesData?.filter(o => ['card', 'credit', 'debit'].includes(o.payment_method))
        .reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0;

      // Calculate inventory changes
      const itemsSold = salesData?.reduce((sum, order) => 
        sum + (order.order_items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0), 0) || 0;

      // Get top sold products
      const productSales: Record<string, number> = {};
      salesData?.forEach(order => {
        order.order_items?.forEach(item => {
          const productName = (item.products as any)?.name || 'Unknown Product';
          productSales[productName] = (productSales[productName] || 0) + (item.quantity || 0);
        });
      });

      const topSoldProducts = Object.entries(productSales)
        .map(([product_name, quantity_sold]) => ({ product_name, quantity_sold }))
        .sort((a, b) => b.quantity_sold - a.quantity_sold)
        .slice(0, 5);

      // Calculate discrepancies
      const cashVariance = tillSession ? (tillSession.cash_variance || 0) : 0;

      const reconciliation: ReconciliationData = {
        till_session: tillSession || undefined,
        sales_summary: {
          total_sales: totalSales,
          cash_sales: cashSales,
          card_sales: cardSales,
          total_transactions: salesData?.length || 0
        },
        inventory_changes: {
          items_sold: itemsSold,
          top_sold_products: topSoldProducts
        },
        discrepancies: {
          cash_variance: cashVariance,
          inventory_issues: [] // Would need more complex logic to detect inventory discrepancies
        }
      };

      setReconciliationData(reconciliation);

      // Automatically flag if there are significant discrepancies
      if (Math.abs(cashVariance) > 10) {
        setStatus("flagged");
      }

    } catch (error: any) {
      console.error("Error generating reconciliation data:", error);
      toast({
        title: "Error",
        description: "Failed to generate reconciliation report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveReconciliationReport = async () => {
    if (!user || !reconciliationData) return;

    try {
      setProcessing(true);

      const { data: membership } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membership) throw new Error("Business context not found");

      const reportData = {
        business_id: membership.business_id,
        store_id: storeId,
        report_date: date,
        till_session_id: reconciliationData.till_session?.id || null,
        created_by: user.id,
        
        // Sales totals
        total_sales: reconciliationData.sales_summary.total_sales,
        cash_sales: reconciliationData.sales_summary.cash_sales,
        card_sales: reconciliationData.sales_summary.card_sales,
        total_transactions: reconciliationData.sales_summary.total_transactions,
        
        // Cash management
        opening_cash: reconciliationData.till_session?.opening_cash || 0,
        closing_cash: reconciliationData.till_session?.closing_cash || 0,
        cash_drops: reconciliationData.till_session?.total_cash_drops || 0,
        expected_cash: reconciliationData.till_session ? 
          (reconciliationData.till_session.opening_cash + reconciliationData.till_session.total_cash_sales - reconciliationData.till_session.total_cash_drops) : 0,
        cash_variance: reconciliationData.discrepancies.cash_variance,
        
        // Inventory impact
        items_sold: reconciliationData.inventory_changes.items_sold,
        inventory_adjustments: 0, // Would be calculated from actual adjustments
        
        // Discrepancies
        transaction_discrepancies: [],
        inventory_discrepancies: reconciliationData.discrepancies.inventory_issues,
        cash_discrepancies: reconciliationData.discrepancies.cash_variance !== 0 ? 
          [{ amount: reconciliationData.discrepancies.cash_variance, reason: "Till variance" }] : [],
        
        status,
        notes: notes || null
      };

      const { error } = await supabase
        .from("reconciliation_reports")
        .insert(reportData);

      if (error) throw error;

      toast({
        title: "Report Saved",
        description: "End-of-day reconciliation report has been saved successfully",
      });

    } catch (error: any) {
      console.error("Error saving reconciliation report:", error);
      toast({
        title: "Error",
        description: "Failed to save reconciliation report",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Generating reconciliation data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!reconciliationData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h4 className="font-semibold mb-2">No Data Available</h4>
            <p className="text-sm text-muted-foreground">
              No sales or till data found for {format(new Date(date), 'MMMM d, yyyy')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasDiscrepancies = Math.abs(reconciliationData.discrepancies.cash_variance) > 0 || 
                          reconciliationData.discrepancies.inventory_issues.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            End-of-Day Reconciliation
          </CardTitle>
          <CardDescription>
            {format(new Date(date), 'EEEE, MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge 
              variant={status === "flagged" ? "destructive" : status === "approved" ? "default" : "secondary"}
              className="text-sm"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
            {hasDiscrepancies && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Discrepancies Found
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sales Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Sales Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${reconciliationData.sales_summary.total_sales.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Sales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                ${reconciliationData.sales_summary.cash_sales.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Cash Sales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                ${reconciliationData.sales_summary.card_sales.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Card Sales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {reconciliationData.sales_summary.total_transactions}
              </div>
              <div className="text-sm text-muted-foreground">Transactions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Till Session Summary */}
      {reconciliationData.till_session && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Till Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  ${reconciliationData.till_session.opening_cash.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Opening Cash</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  ${(reconciliationData.till_session.closing_cash || 0).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Closing Cash</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  ${reconciliationData.till_session.total_cash_drops.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Cash Drops</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${Math.abs(reconciliationData.discrepancies.cash_variance) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                  ${reconciliationData.discrepancies.cash_variance.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Cash Variance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {reconciliationData.inventory_changes.items_sold}
              </div>
              <div className="text-sm text-muted-foreground">Items Sold</div>
            </div>
            
            {reconciliationData.inventory_changes.top_sold_products.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Top Selling Products</h4>
                <div className="space-y-2">
                  {reconciliationData.inventory_changes.top_sold_products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{product.product_name}</span>
                      <Badge variant="outline">{product.quantity_sold} sold</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Discrepancies */}
      {hasDiscrepancies && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Discrepancies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Math.abs(reconciliationData.discrepancies.cash_variance) > 0 && (
                <div className="p-4 border-l-4 border-red-500 bg-red-50">
                  <h4 className="font-semibold text-red-800">Cash Variance</h4>
                  <p className="text-red-700">
                    Cash count is off by ${Math.abs(reconciliationData.discrepancies.cash_variance).toFixed(2)}
                    {reconciliationData.discrepancies.cash_variance > 0 ? ' (over)' : ' (short)'}
                  </p>
                </div>
              )}
              
              {reconciliationData.discrepancies.inventory_issues.map((issue, index) => (
                <div key={index} className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
                  <h4 className="font-semibold text-yellow-800">{issue.product_name}</h4>
                  <p className="text-yellow-700">
                    Expected: {issue.expected}, Actual: {issue.actual}, 
                    Variance: {issue.variance > 0 ? '+' : ''}{issue.variance}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Notes & Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about discrepancies or other observations..."
              rows={4}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button
                variant={status === "pending" ? "default" : "outline"}
                onClick={() => setStatus("pending")}
                size="sm"
              >
                Pending
              </Button>
              <Button
                variant={status === "reviewed" ? "default" : "outline"}
                onClick={() => setStatus("reviewed")}
                size="sm"
              >
                Reviewed
              </Button>
              <Button
                variant={status === "approved" ? "default" : "outline"}
                onClick={() => setStatus("approved")}
                size="sm"
              >
                Approved
              </Button>
              <Button
                variant={status === "flagged" ? "destructive" : "outline"}
                onClick={() => setStatus("flagged")}
                size="sm"
              >
                Flagged
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={saveReconciliationReport} disabled={processing}>
              {processing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Save Report
                </>
              )}
            </Button>
            <Button variant="outline" onClick={generateReconciliationData}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};