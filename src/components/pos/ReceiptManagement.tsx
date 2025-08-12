import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { EditOrderModal } from "./EditOrderModal";
import { ActivityLogsModal } from "./ActivityLogsModal";
import {
  Activity,
  CalendarIcon,
  DollarSign,
  Edit,
  Receipt as ReceiptIcon,
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
import {
  GET_RECEIPT_STATS,
  GET_RECEIPTS,
  PosSession,
  Query,
  QueryGetReceiptsArgs,
  QueryGetReceiptStatsArgs,
  ReceiptStatus,
  Receipt,
  UserRole,
} from "@/graphql";
import { useQuery } from "@apollo/client";
import Pagination from "@/components/ui/pagination.tsx";
import { useDebounce } from "@/hooks/useDebounce.ts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { cn } from "@/lib/utils.ts";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar.tsx";

export const ReceiptManagement = () => {
  const { user } = useAuth();
  const session = PosSession();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ReceiptStatus | "all">(
    "all",
  );
  const [selectedOrder, setSelectedOrder] = useState<Receipt | null>(null);
  const [page, setPage] = useState<number>(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedOrderForLogs, setSelectedOrderForLogs] = useState<
    string | null
  >(null);
  const {
    data: receiptData,
    loading: receiptsLoading,
    refetch: refetchReceipts,
  } = useQuery<Query, QueryGetReceiptsArgs>(GET_RECEIPTS, {
    variables: {
      storeId: session.store.id,
      pagination: { page, take: 10 },
      filters: {
        status: selectedStatus === "all" ? null : selectedStatus,
        search: debouncedSearch,
        date: selectedDate,
      },
    },
  });
  const {
    data: statsData,
    loading: statsLoading,
    refetch: refetchStats,
  } = useQuery<Query, QueryGetReceiptStatsArgs>(GET_RECEIPT_STATS, {
    variables: { storeId: session.store.id },
  });

  // Check permissions
  const canEdit =
    user.role === UserRole.BusinessOwner || user.role === UserRole.Manager;

  const canView =
    user.role === UserRole.BusinessOwner ||
    user.role === UserRole.Manager ||
    user.role === UserRole.Office;

  const handleEditOrder = (order: Receipt) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  if (!canView) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <ReceiptIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Search</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Order number, customer, or salesperson..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="h-4 w-4" />
              </div>
            </div>

            <div>
              <Label>Date</Label>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(new Date(selectedDate), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate ? new Date(selectedDate) : undefined}
                    onSelect={(date) =>
                      setSelectedDate(date === selectedDate ? "" : date)
                    }
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={ReceiptStatus.Completed}>
                    Completed
                  </SelectItem>
                  <SelectItem value={ReceiptStatus.Pending}>Pending</SelectItem>
                  <SelectItem value={ReceiptStatus.Cancelled}>
                    Cancelled
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {statsData?.getReceiptStats?.totalCount}
              </div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                $
                {Number(statsData?.getReceiptStats?.totalSales ?? 0).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Sales</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {statsData?.getReceiptStats?.totalCompleted}
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
            {receiptsLoading ? (
              <div className="text-center py-8">Loading orders...</div>
            ) : !receiptData?.getReceipts?.data?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                No orders found
              </div>
            ) : (
              <>
                {receiptData?.getReceipts?.data.map((order) => (
                  <Card
                    key={order.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <ReceiptIcon className="h-5 w-5 text-primary mt-1" />

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold">
                                {order.receipt_number}
                              </span>
                              <Badge
                                variant={
                                  order.status === ReceiptStatus.Completed
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
                                  {order.cashier?.full_name || "Unknown"}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <CalendarIcon className="h-3 w-3" />
                                  Date
                                </div>
                                <div className="font-medium">
                                  {new Date(
                                    order.created_at,
                                  ).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(
                                    order.created_at,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <DollarSign className="h-3 w-3" />
                                  Total
                                </div>
                                <div className="font-bold text-lg text-success">
                                  ${Number(order.grand_total).toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground capitalize">
                                  {order.payment_methods?.length > 1
                                    ? `${order.payment_methods?.length} payment methods used`
                                    : order.payment_methods[0].type}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
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
                ))}

                <Pagination
                  count={receiptData?.getReceipts?.count}
                  page={page}
                  setPage={setPage}
                />
              </>
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
          refetchReceipts();
          refetchStats();
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
