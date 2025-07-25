import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EditOrderModal } from "./EditOrderModal";
import { ActivityLogsModal } from "./ActivityLogsModal";
import {
  Activity,
  Calendar,
  DollarSign,
  Edit,
  Eye,
  Filter,
  Receipt,
  Search,
  User,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole } from "@/graphql";

interface Order {
  id: string;
  order_number: string;
  total: number;
  payment_method: string;
  created_at: string;
  customer_id: string;
  user_id: string;
  status: string;
  notes: string;
  customers?: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface ReceiptManagementProps {}

export const ReceiptManagement = ({}: ReceiptManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedOrderForLogs, setSelectedOrderForLogs] = useState<
    string | null
  >(null);

  // Check permissions
  const canEdit =
    user.role === UserRole.BusinessOwner || user.role === UserRole.Manager;
  const canView =
    user.role === UserRole.BusinessOwner ||
    user.role === UserRole.Manager ||
    user.role === UserRole.Office;

  useEffect(() => {
    if (canView) {
      fetchOrders();
    }
  }, [canView]);

  const fetchOrders = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select(
          `
          id,
          order_number,
          total,
          payment_method,
          created_at,
          customer_id,
          user_id,
          status,
          notes
        `,
        )
        .order("created_at", { ascending: false })
        .limit(100);

      // Apply date filter if selected
      if (selectedDate) {
        const startDate = new Date(selectedDate);
        const endDate = new Date(selectedDate);
        endDate.setDate(endDate.getDate() + 1);

        query = query
          .gte("created_at", startDate.toISOString())
          .lt("created_at", endDate.toISOString());
      }

      // Apply status filter
      if (selectedStatus !== "all") {
        query = query.eq("status", selectedStatus);
      }

      const { data: ordersData, error } = await query;

      if (error) throw error;

      // Fetch related data separately
      const orders = ordersData || [];

      // Get customers
      const customerIds = [
        ...new Set(orders.map((o) => o.customer_id).filter(Boolean)),
      ];
      const { data: customersData } =
        customerIds.length > 0
          ? await supabase
              .from("customers")
              .select("id, first_name, last_name, phone, email")
              .in("id", customerIds)
          : { data: null };

      // Get user profiles
      const userIds = [...new Set(orders.map((o) => o.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      // Map related data to orders
      const ordersWithData = orders.map((order) => ({
        ...order,
        customers:
          customersData?.find((c) => c.id === order.customer_id) || null,
        profiles:
          profilesData?.find((p) => p.user_id === order.user_id) || null,
      }));

      setOrders(ordersWithData);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchTerm ||
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customers?.first_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      order.customers?.last_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      order.customers?.phone?.includes(searchTerm) ||
      order.profiles?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const handleViewLogs = (orderId: string) => {
    setSelectedOrderForLogs(orderId);
    setIsActivityModalOpen(true);
  };

  const getTotalSales = () => {
    return filteredOrders
      .filter((order) => order.status === "completed")
      .reduce((sum, order) => sum + order.total, 0);
  };

  if (!canView) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don't have permission to view receipt management.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Receipt Management</h2>
          <p className="text-muted-foreground">
            Search and manage orders and receipts
          </p>
        </div>
        <Button onClick={() => setIsActivityModalOpen(true)} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          View All Activity
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Search</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Order number, customer, or salesperson..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={fetchOrders}
                  disabled={loading}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Actions</Label>
              <Button
                onClick={fetchOrders}
                disabled={loading}
                className="w-full mt-1"
              >
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{filteredOrders.length}</div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                ${getTotalSales().toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Sales</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {filteredOrders.filter((o) => o.status === "completed").length}
              </div>
              <div className="text-sm text-muted-foreground">
                Completed Orders
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Orders & Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No orders found
              </div>
            ) : (
              filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <Receipt className="h-5 w-5 text-primary mt-1" />

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold">
                              {order.order_number}
                            </span>
                            <Badge
                              variant={
                                order.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {order.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <User className="h-3 w-3" />
                                Customer
                              </div>
                              <div className="font-medium">
                                {order.customers
                                  ? `${order.customers.first_name} ${order.customers.last_name}`
                                  : "Walk-in Customer"}
                              </div>
                              {order.customers?.phone && (
                                <div className="text-xs text-muted-foreground">
                                  {order.customers.phone}
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <User className="h-3 w-3" />
                                Salesperson
                              </div>
                              <div className="font-medium">
                                {order.profiles?.full_name || "Unknown"}
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Date
                              </div>
                              <div className="font-medium">
                                {new Date(
                                  order.created_at,
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <DollarSign className="h-3 w-3" />
                                Total
                              </div>
                              <div className="font-bold text-lg text-success">
                                ${order.total.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {order.payment_method}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewLogs(order.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {canEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditOrder(order)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Order Modal */}
      <EditOrderModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onOrderUpdated={() => {
          fetchOrders();
          setSelectedOrder(null);
        }}
      />

      {/* Activity Logs Modal */}
      <ActivityLogsModal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false);
          setSelectedOrderForLogs(null);
        }}
        entityId={selectedOrderForLogs || undefined}
        entityType={selectedOrderForLogs ? "order" : undefined}
      />
    </div>
  );
};
