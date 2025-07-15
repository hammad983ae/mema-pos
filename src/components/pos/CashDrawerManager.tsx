import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  Calculator, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  Receipt,
  CreditCard,
  Banknote
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TillSession {
  id: string;
  business_id: string;
  store_id: string;
  user_id: string;
  opening_cash: number;
  closing_cash?: number;
  total_sales: number;
  total_cash_sales: number;
  total_card_sales: number;
  total_cash_drops: number;
  total_transactions: number;
  expected_cash?: number;
  cash_variance?: number;
  status: string;
  session_start: string;
  session_end?: string;
}

interface CashOperation {
  id: string;
  operation_type: string;
  amount: number;
  expected_amount?: number;
  variance?: number;
  notes?: string;
  created_at: string;
}

interface CashDrawerManagerProps {
  storeId: string;
}

export const CashDrawerManager = ({ storeId }: CashDrawerManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<TillSession | null>(null);
  const [recentOperations, setRecentOperations] = useState<CashOperation[]>([]);
  const [showCashCount, setShowCashCount] = useState(false);
  const [showCashDrop, setShowCashDrop] = useState(false);
  
  const [countForm, setCountForm] = useState({
    amount: "",
    notes: ""
  });

  const [dropForm, setDropForm] = useState({
    amount: "",
    notes: ""
  });

  useEffect(() => {
    if (user && storeId) {
      fetchCurrentSession();
      fetchRecentOperations();
    }
  }, [user, storeId]);

  const fetchCurrentSession = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("till_sessions")
        .select("*")
        .eq("store_id", storeId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("session_start", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      setCurrentSession(data);
    } catch (error: any) {
      console.error("Error fetching current session:", error);
    }
  };

  const fetchRecentOperations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("cash_drawer_operations")
        .select("*")
        .eq("store_id", storeId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentOperations(data || []);
    } catch (error: any) {
      console.error("Error fetching operations:", error);
    } finally {
      setLoading(false);
    }
  };

  const startTillSession = async (openingCash: number) => {
    if (!user) return;

    try {
      const { data: membership } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membership) throw new Error("Business context not found");

      // Create new till session
      const { data: session, error: sessionError } = await supabase
        .from("till_sessions")
        .insert({
          business_id: membership.business_id,
          store_id: storeId,
          user_id: user.id,
          opening_cash: openingCash,
          status: "active"
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Record cash drawer open operation
      await supabase
        .from("cash_drawer_operations")
        .insert({
          business_id: membership.business_id,
          store_id: storeId,
          user_id: user.id,
          operation_type: "open",
          amount: openingCash,
          till_session_id: session.id,
          notes: "Till opened for new session"
        });

      setCurrentSession(session);
      fetchRecentOperations();

      toast({
        title: "Till Opened",
        description: `Session started with $${openingCash.toFixed(2)}`,
      });
    } catch (error: any) {
      console.error("Error starting session:", error);
      toast({
        title: "Error",
        description: "Failed to start till session",
        variant: "destructive",
      });
    }
  };

  const closeTillSession = async (closingCash: number) => {
    if (!user || !currentSession) return;

    try {
      const expectedCash = currentSession.opening_cash + currentSession.total_cash_sales - currentSession.total_cash_drops;
      const variance = closingCash - expectedCash;

      // Update till session
      const { error: updateError } = await supabase
        .from("till_sessions")
        .update({
          closing_cash: closingCash,
          expected_cash: expectedCash,
          cash_variance: variance,
          status: "closed",
          session_end: new Date().toISOString()
        })
        .eq("id", currentSession.id);

      if (updateError) throw updateError;

      // Record cash drawer close operation
      await supabase
        .from("cash_drawer_operations")
        .insert({
          business_id: currentSession.business_id,
          store_id: storeId,
          user_id: user.id,
          operation_type: "close",
          amount: closingCash,
          expected_amount: expectedCash,
          variance: variance,
          till_session_id: currentSession.id,
          notes: variance !== 0 ? `Variance: $${variance.toFixed(2)}` : "Till closed - no variance"
        });

      setCurrentSession(null);
      setShowCashCount(false);
      fetchRecentOperations();

      if (Math.abs(variance) > 5) {
        toast({
          title: "Till Closed with Variance",
          description: `Expected: $${expectedCash.toFixed(2)}, Actual: $${closingCash.toFixed(2)}, Variance: $${variance.toFixed(2)}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Till Closed",
          description: "Session ended successfully",
        });
      }
    } catch (error: any) {
      console.error("Error closing session:", error);
      toast({
        title: "Error",
        description: "Failed to close till session",
        variant: "destructive",
      });
    }
  };

  const recordCashDrop = async () => {
    if (!user || !currentSession || !dropForm.amount) return;

    try {
      const amount = parseFloat(dropForm.amount);
      
      // Record cash drop operation
      await supabase
        .from("cash_drawer_operations")
        .insert({
          business_id: currentSession.business_id,
          store_id: storeId,
          user_id: user.id,
          operation_type: "cash_drop",
          amount: amount,
          till_session_id: currentSession.id,
          notes: dropForm.notes || "Cash drop"
        });

      // Update till session
      await supabase
        .from("till_sessions")
        .update({
          total_cash_drops: currentSession.total_cash_drops + amount
        })
        .eq("id", currentSession.id);

      setDropForm({ amount: "", notes: "" });
      setShowCashDrop(false);
      fetchCurrentSession();
      fetchRecentOperations();

      toast({
        title: "Cash Drop Recorded",
        description: `$${amount.toFixed(2)} removed from drawer`,
      });
    } catch (error: any) {
      console.error("Error recording cash drop:", error);
      toast({
        title: "Error",
        description: "Failed to record cash drop",
        variant: "destructive",
      });
    }
  };

  const recordTillCount = async () => {
    if (!user || !currentSession || !countForm.amount) return;

    try {
      const amount = parseFloat(countForm.amount);
      const expectedCash = currentSession.opening_cash + currentSession.total_cash_sales - currentSession.total_cash_drops;
      const variance = amount - expectedCash;

      await supabase
        .from("cash_drawer_operations")
        .insert({
          business_id: currentSession.business_id,
          store_id: storeId,
          user_id: user.id,
          operation_type: "till_count",
          amount: amount,
          expected_amount: expectedCash,
          variance: variance,
          till_session_id: currentSession.id,
          notes: countForm.notes || "Till count"
        });

      setCountForm({ amount: "", notes: "" });
      setShowCashCount(false);
      fetchRecentOperations();

      if (Math.abs(variance) > 5) {
        toast({
          title: "Count Variance Detected",
          description: `Expected: $${expectedCash.toFixed(2)}, Counted: $${amount.toFixed(2)}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Till Count Recorded",
          description: "Cash count matches expected amount",
        });
      }
    } catch (error: any) {
      console.error("Error recording till count:", error);
      toast({
        title: "Error",
        description: "Failed to record till count",
        variant: "destructive",
      });
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case "open": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "close": return <Clock className="h-4 w-4 text-blue-500" />;
      case "cash_drop": return <DollarSign className="h-4 w-4 text-orange-500" />;
      case "till_count": return <Calculator className="h-4 w-4 text-purple-500" />;
      case "no_sale": return <Receipt className="h-4 w-4 text-gray-500" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading cash drawer...</div>
        </CardContent>
      </Card>
    );
  }

  const expectedCash = currentSession 
    ? currentSession.opening_cash + currentSession.total_cash_sales - currentSession.total_cash_drops
    : 0;

  return (
    <div className="space-y-6">
      {/* Current Session Status */}
      {currentSession ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Active Till Session
            </CardTitle>
            <CardDescription>
              Started {formatDistanceToNow(new Date(currentSession.session_start), { addSuffix: true })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${currentSession.opening_cash.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Opening Cash</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  ${currentSession.total_sales.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Total Sales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  ${currentSession.total_cash_drops.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Cash Drops</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ${expectedCash.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Expected Cash</div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                onClick={() => setShowCashCount(true)}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Count Cash
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCashDrop(true)}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Cash Drop
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setShowCashCount(true)}
              >
                <Clock className="h-4 w-4 mr-2" />
                Close Till
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Till Session</CardTitle>
            <CardDescription>Start a new till session to begin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="opening_cash">Opening Cash Amount</Label>
                <Input
                  id="opening_cash"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  onChange={(e) => {
                    if (e.target.value && parseFloat(e.target.value) >= 0) {
                      const amount = parseFloat(e.target.value);
                      e.target.onkeydown = (event) => {
                        if (event.key === "Enter") {
                          startTillSession(amount);
                        }
                      };
                    }
                  }}
                />
              </div>
              <Button 
                onClick={() => {
                  const input = document.getElementById("opening_cash") as HTMLInputElement;
                  if (input?.value) {
                    startTillSession(parseFloat(input.value));
                  }
                }}
                className="mt-6"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Start Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cash Count Modal */}
      {showCashCount && (
        <Card>
          <CardHeader>
            <CardTitle>
              {currentSession?.status === "active" ? "Count Cash" : "Close Till"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cash_amount">Cash Amount</Label>
              <Input
                id="cash_amount"
                type="number"
                step="0.01"
                value={countForm.amount}
                onChange={(e) => setCountForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={countForm.notes}
                onChange={(e) => setCountForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any notes about the count..."
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={currentSession?.status === "active" ? recordTillCount : () => closeTillSession(parseFloat(countForm.amount))}
                disabled={!countForm.amount}
              >
                {currentSession?.status === "active" ? "Record Count" : "Close Till"}
              </Button>
              <Button variant="outline" onClick={() => setShowCashCount(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cash Drop Modal */}
      {showCashDrop && (
        <Card>
          <CardHeader>
            <CardTitle>Record Cash Drop</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="drop_amount">Amount to Remove</Label>
              <Input
                id="drop_amount"
                type="number"
                step="0.01"
                value={dropForm.amount}
                onChange={(e) => setDropForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="drop_notes">Reason</Label>
              <Textarea
                id="drop_notes"
                value={dropForm.notes}
                onChange={(e) => setDropForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Reason for cash drop..."
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={recordCashDrop} disabled={!dropForm.amount}>
                Record Drop
              </Button>
              <Button variant="outline" onClick={() => setShowCashDrop(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Operations</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOperations.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No recent operations
            </div>
          ) : (
            <div className="space-y-3">
              {recentOperations.map((operation) => (
                <div key={operation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getOperationIcon(operation.operation_type)}
                    <div>
                      <div className="font-medium capitalize">
                        {operation.operation_type.replace("_", " ")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(operation.created_at), { addSuffix: true })}
                      </div>
                      {operation.notes && (
                        <div className="text-sm text-muted-foreground">{operation.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${operation.amount.toFixed(2)}</div>
                    {operation.variance !== null && operation.variance !== 0 && (
                      <Badge variant={Math.abs(operation.variance) > 5 ? "destructive" : "secondary"}>
                        Variance: ${operation.variance.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};