import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  DollarSign, 
  CreditCard, 
  Banknote,
  TrendingDown,
  FileText,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface EODReportData {
  total_sales: number;
  total_transactions: number;
  cash_sales: number;
  card_sales: number;
  returns_amount: number;
  discounts_given: number;
  opening_cash: number;
  closing_cash: number;
  cash_drops: number;
  notes: string;
}

interface Store {
  id: string;
  name: string;
}

const EODReport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [reportData, setReportData] = useState<EODReportData>({
    total_sales: 0,
    total_transactions: 0,
    cash_sales: 0,
    card_sales: 0,
    returns_amount: 0,
    discounts_given: 0,
    opening_cash: 0,
    closing_cash: 0,
    cash_drops: 0,
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [todaysActualSales, setTodaysActualSales] = useState({
    total: 0,
    transactions: 0
  });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchStores();
    fetchTodaysActualSales();
  }, [user]);

  const fetchStores = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('stores')
        .select('id, name')
        .eq('status', 'active');
      
      if (data) {
        setStores(data);
        if (data.length === 1) {
          setSelectedStoreId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const fetchTodaysActualSales = async () => {
    if (!user) return;

    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('total, payment_method')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      if (orders) {
        const total = orders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
        setTodaysActualSales({
          total,
          transactions: orders.length
        });
        
        // Auto-populate with actual sales data
        setReportData(prev => ({
          ...prev,
          total_sales: total,
          total_transactions: orders.length
        }));
      }
    } catch (error) {
      console.error('Error fetching actual sales:', error);
    }
  };

  const handleInputChange = (field: keyof EODReportData, value: string | number) => {
    setReportData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? (field === 'notes' ? value : parseFloat(value) || 0) : value
    }));
  };

  const validateReport = () => {
    const errors = [];
    
    if (!selectedStoreId) {
      errors.push("Please select a store");
    }
    
    if (reportData.opening_cash < 0) {
      errors.push("Opening cash cannot be negative");
    }
    
    if (reportData.closing_cash < 0) {
      errors.push("Closing cash cannot be negative");
    }
    
    const totalPayments = reportData.cash_sales + reportData.card_sales;
    const expectedTotal = reportData.total_sales - reportData.returns_amount - reportData.discounts_given;
    
    if (Math.abs(totalPayments - expectedTotal) > 0.01) {
      errors.push("Payment totals don't match expected total sales");
    }

    return errors;
  };

  const submitReport = async () => {
    const errors = validateReport();
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(", "),
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const { data: submittedReport, error } = await supabase
        .from('end_of_day_reports')
        .insert({
          user_id: user!.id,
          store_id: selectedStoreId,
          business_id: '00000000-0000-0000-0000-000000000000', // Will be updated when user has business context
          report_date: today,
          ...reportData
        })
        .select()
        .single();

      if (error) throw error;

      // Get user profile and store info for email notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user!.id)
        .single();

      const { data: store } = await supabase
        .from('stores')
        .select('name')
        .eq('id', selectedStoreId)
        .single();

      // Send email notification to managers
      if (profile && store && submittedReport) {
        try {
          await supabase.functions.invoke('send-eod-notification', {
            body: {
              reportId: submittedReport.id,
              employeeName: profile.full_name || profile.email || 'Employee',
              employeeEmail: profile.email || user!.email || '',
              storeName: store.name,
              reportDate: today,
              totalSales: submittedReport.total_sales,
              totalTransactions: submittedReport.total_transactions,
              notes: submittedReport.notes
            }
          });
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
          // Don't fail the whole operation if email fails
        }
      }

      toast({
        title: "Report Submitted",
        description: "Your end-of-day report has been submitted successfully",
      });

      navigate('/employee');
      
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit report",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const salesVariance = reportData.total_sales - todaysActualSales.total;
  const hasVariance = Math.abs(salesVariance) > 0.01;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/employee')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">End of Day Report</h1>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Store Selection */}
        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Store Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="store">Select Store</Label>
              <select
                id="store"
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Choose a store...</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Sales Summary */}
        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TrendingDown className="h-5 w-5 mr-2 text-primary" />
              Sales Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasVariance && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                <div className="flex items-center text-warning text-sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Sales variance detected: ${Math.abs(salesVariance).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Reported vs System: ${reportData.total_sales.toFixed(2)} vs ${todaysActualSales.total.toFixed(2)}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="total_sales">Total Sales ($)</Label>
                <Input
                  id="total_sales"
                  type="number"
                  step="0.01"
                  value={reportData.total_sales}
                  onChange={(e) => handleInputChange('total_sales', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="total_transactions">Transactions</Label>
                <Input
                  id="total_transactions"
                  type="number"
                  value={reportData.total_transactions}
                  onChange={(e) => handleInputChange('total_transactions', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Breakdown */}
        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-success" />
              Payment Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cash_sales">Cash Sales ($)</Label>
                <Input
                  id="cash_sales"
                  type="number"
                  step="0.01"
                  value={reportData.cash_sales}
                  onChange={(e) => handleInputChange('cash_sales', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="card_sales">Card Sales ($)</Label>
                <Input
                  id="card_sales"
                  type="number"
                  step="0.01"
                  value={reportData.card_sales}
                  onChange={(e) => handleInputChange('card_sales', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="returns_amount">Returns ($)</Label>
                <Input
                  id="returns_amount"
                  type="number"
                  step="0.01"
                  value={reportData.returns_amount}
                  onChange={(e) => handleInputChange('returns_amount', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="discounts_given">Discounts ($)</Label>
                <Input
                  id="discounts_given"
                  type="number"
                  step="0.01"
                  value={reportData.discounts_given}
                  onChange={(e) => handleInputChange('discounts_given', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cash Management */}
        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Banknote className="h-5 w-5 mr-2 text-warning" />
              Cash Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="opening_cash">Opening Cash ($)</Label>
                <Input
                  id="opening_cash"
                  type="number"
                  step="0.01"
                  value={reportData.opening_cash}
                  onChange={(e) => handleInputChange('opening_cash', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="closing_cash">Closing Cash ($)</Label>
                <Input
                  id="closing_cash"
                  type="number"
                  step="0.01"
                  value={reportData.closing_cash}
                  onChange={(e) => handleInputChange('closing_cash', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="cash_drops">Cash Drops ($)</Label>
              <Input
                id="cash_drops"
                type="number"
                step="0.01"
                value={reportData.cash_drops}
                onChange={(e) => handleInputChange('cash_drops', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <FileText className="h-5 w-5 mr-2 text-accent-foreground" />
              Additional Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any issues, observations, or important notes from today..."
              value={reportData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="pb-6">
          <Button 
            onClick={submitReport}
            disabled={submitting || !selectedStoreId}
            className="w-full h-12"
          >
            {submitting ? (
              "Submitting..."
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Submit End of Day Report
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center mt-2">
            Report will be sent to management for review
          </p>
        </div>
      </div>
    </div>
  );
};

export default EODReport;