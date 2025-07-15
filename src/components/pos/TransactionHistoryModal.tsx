import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, History, Receipt, RefreshCw, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Transaction {
  id: string;
  transaction_number: string;
  transaction_type: 'sale' | 'refund';
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  customer_id?: string;
  customers?: {
    first_name: string;
    last_name: string;
    phone: string;
  };
}

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionHistoryModal = ({
  isOpen,
  onClose
}: TransactionHistoryModalProps) => {
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'refund'>('all');
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select(`
          id,
          order_number,
          total,
          payment_method,
          status,
          created_at,
          customer_id,
          customers(first_name, last_name, phone)
        `)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(50);

      // Apply date filter if selected
      if (selectedDate) {
        const startDate = new Date(selectedDate);
        const endDate = new Date(selectedDate);
        endDate.setDate(endDate.getDate() + 1);
        
        query = query
          .gte("created_at", startDate.toISOString())
          .lt("created_at", endDate.toISOString());
      }

      const { data: ordersData, error: ordersError } = await query;
      if (ordersError) throw ordersError;

      // Fetch refunds
      let refundQuery = supabase
        .from("refunds")
        .select(`
          id,
          refund_number,
          total_refunded,
          payment_method,
          status,
          created_at,
          customer_id,
          customers(first_name, last_name, phone)
        `)
        .eq("status", "processed")
        .order("created_at", { ascending: false })
        .limit(50);

      if (selectedDate) {
        const startDate = new Date(selectedDate);
        const endDate = new Date(selectedDate);
        endDate.setDate(endDate.getDate() + 1);
        
        refundQuery = refundQuery
          .gte("created_at", startDate.toISOString())
          .lt("created_at", endDate.toISOString());
      }

      const { data: refundsData, error: refundsError } = await refundQuery;
      if (refundsError) throw refundsError;

      // Combine and format data
      const formattedOrders: Transaction[] = (ordersData || []).map(order => ({
        id: order.id,
        transaction_number: order.order_number,
        transaction_type: 'sale' as const,
        amount: order.total,
        payment_method: order.payment_method,
        status: order.status,
        created_at: order.created_at,
        customer_id: order.customer_id,
        customers: order.customers
      }));

      const formattedRefunds: Transaction[] = (refundsData || []).map(refund => ({
        id: refund.id,
        transaction_number: refund.refund_number,
        transaction_type: 'refund' as const,
        amount: -refund.total_refunded,
        payment_method: refund.payment_method,
        status: refund.status,
        created_at: refund.created_at,
        customer_id: refund.customer_id,
        customers: refund.customers
      }));

      // Combine and sort by date
      const allTransactions = [...formattedOrders, ...formattedRefunds]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTransactions(allTransactions);

    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchTerm || 
      transaction.transaction_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.customers?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.customers?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.customers?.phone?.includes(searchTerm));
    
    const matchesType = filterType === 'all' || transaction.transaction_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getTotalSales = () => {
    return filteredTransactions
      .filter(t => t.transaction_type === 'sale')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalRefunds = () => {
    return Math.abs(filteredTransactions
      .filter(t => t.transaction_type === 'refund')
      .reduce((sum, t) => sum + t.amount, 0));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Search</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Transaction number, customer name, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outline" onClick={fetchTransactions} disabled={loading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Type</Label>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="sale">Sales</SelectItem>
                  <SelectItem value="refund">Refunds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
            </div>

            <Button variant="outline" onClick={fetchTransactions} disabled={loading}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">${getTotalSales().toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Total Sales</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">${getTotalRefunds().toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Total Refunds</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">${(getTotalSales() - getTotalRefunds()).toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Net Sales</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction List */}
          <div className="space-y-2 max-h-96 overflow-auto">
            {loading ? (
              <div className="text-center py-8">Loading transactions...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {transaction.transaction_type === 'sale' ? (
                          <Receipt className="h-4 w-4 text-success" />
                        ) : (
                          <RefreshCw className="h-4 w-4 text-destructive" />
                        )}
                        
                        <div>
                          <div className="font-medium">{transaction.transaction_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.customers 
                              ? `${transaction.customers.first_name} ${transaction.customers.last_name}`
                              : "Walk-in Customer"
                            }
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-medium ${
                          transaction.transaction_type === 'sale' ? 'text-success' : 'text-destructive'
                        }`}>
                          ${Math.abs(transaction.amount).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()} {' '}
                          {new Date(transaction.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Badge variant={transaction.transaction_type === 'sale' ? 'default' : 'destructive'}>
                          {transaction.transaction_type}
                        </Badge>
                        <Badge variant="outline">
                          {transaction.payment_method}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};