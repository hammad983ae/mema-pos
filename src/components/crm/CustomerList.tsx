import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { PosAuthDialog } from "@/components/auth/PosAuthDialog";
import {
  Calendar,
  DollarSign,
  Edit,
  Eye,
  Filter,
  Gift,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import {
  Customer,
  DELETE_CUSTOMER,
  GET_CUSTOMERS,
  Mutation,
  MutationDeleteCustomerArgs,
  Query,
  QueryGetCustomersArgs,
  UserRole,
} from "@/graphql";
import { useMutation, useQuery } from "@apollo/client";
import { useDebounce } from "@/hooks/useDebounce.ts";
import { showSuccess } from "@/hooks/useToastMessages.tsx";
import Pagination from "@/components/ui/pagination.tsx";

interface CustomerListProps {
  onSelectCustomer: (customerId: string) => void;
  onEditCustomer: (customerId: string) => void;
  onAddCustomer: () => void;
  refreshTrigger?: number;
}

export const CustomerList = ({
  onSelectCustomer,
  onEditCustomer,
  onAddCustomer,
  refreshTrigger,
}: CustomerListProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("last_visit_date");
  const [filterBy, setFilterBy] = useState("all");
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authAction, setAuthAction] = useState<() => void>(() => {});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [deleteCustomer, { loading: deleting }] = useMutation<
    Mutation,
    MutationDeleteCustomerArgs
  >(DELETE_CUSTOMER);
  const { data, loading, refetch } = useQuery<Query, QueryGetCustomersArgs>(
    GET_CUSTOMERS,
    {
      fetchPolicy: "network-only",
      variables: {
        pagination: { page, take: 10 },
        filters: {
          search: debouncedSearch,
          filter_by: filterBy === "all" ? null : filterBy,
          sort_by: sortBy,
        },
      },
    },
  );

  useEffect(() => {
    if (page !== 1) setPage(1);
    else refetch();
  }, [refreshTrigger]);

  useEffect(() => {
    if (page !== 1) setPage(1);
  }, [debouncedSearch, sortBy, filterBy]);

  const requiresAuth = (action: () => void) => {
    // If user is business owner, allow without additional auth
    if (user.role === UserRole.BusinessOwner) {
      action();
      return;
    }

    // For other roles, require authentication
    setAuthAction(() => action);
    setShowAuthDialog(true);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    deleteCustomer({ variables: { id: customerId } }).then(() => {
      showSuccess("Customer deleted successfully");
      refetch();
    });
  };

  const confirmDeleteCustomer = (customerId: string) => {
    setCustomerToDelete(customerId);
    setShowDeleteDialog(true);
  };

  const getCustomerStatus = (customer: Customer) => {
    const now = new Date();
    const lastVisit = customer.last_visit_date
      ? new Date(customer.last_visit_date)
      : null;

    if (!lastVisit) return { status: "new", color: "bg-blue-500" };

    const daysSinceLastVisit = Math.floor(
      (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceLastVisit <= 30)
      return { status: "active", color: "bg-green-500" };
    if (daysSinceLastVisit <= 90)
      return { status: "regular", color: "bg-yellow-500" };
    return { status: "inactive", color: "bg-red-500" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading customers...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterBy} onValueChange={setFilterBy}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            <SelectItem value="recent">Recent Visits</SelectItem>
            <SelectItem value="high_value">High Value</SelectItem>
            <SelectItem value="loyalty">Loyalty Members</SelectItem>
            <SelectItem value="birthdays">This Month's Birthdays</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last_visit_date">Last Visit</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="total_spent">Total Spent</SelectItem>
            <SelectItem value="visit_count">Visit Count</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customer Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Visits</TableHead>
              <TableHead>Last Visit</TableHead>
              <TableHead>Loyalty Points</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.getCustomers?.data?.map((customer) => {
              const status = getCustomerStatus(customer);
              const customerName = `${customer.first_name} ${customer.last_name}`;

              return (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {customer.first_name?.charAt(0)}
                            {customer.last_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full ${status.color}`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{customerName}</p>
                        {customer.skin_type && (
                          <Badge variant="outline" className="text-xs">
                            {customer.skin_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {customer.email && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="h-3 w-3 mr-1" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="h-3 w-3 mr-1" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {status.status}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                      <span className="font-medium">
                        ${Number(customer.total_spent || 0).toFixed(2)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-blue-500 mr-1" />
                      <span>{customer.visit_count || 0}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm">
                      {customer.last_visit_date
                        ? format(
                            new Date(customer.last_visit_date),
                            "MMM dd, yyyy",
                          )
                        : "Never"}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center">
                      <Gift className="h-4 w-4 text-purple-500 mr-1" />
                      <span>{customer.loyalty_points || 0}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCustomer(customer.id);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              requiresAuth(() => onEditCustomer(customer.id));
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Customer
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              requiresAuth(() =>
                                confirmDeleteCustomer(customer.id),
                              );
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Customer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Pagination
          count={data?.getCustomers?.count}
          page={page}
          setPage={setPage}
        />

        {data?.getCustomers?.data?.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <p className="mb-2">No customers found</p>
          </div>
        )}
      </Card>

      {/* Authentication Dialog */}
      <PosAuthDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        onSuccess={() => {
          setShowAuthDialog(false);
          authAction();
        }}
        title="Authentication Required"
        description="Please enter your credentials to modify customer data"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={() => {
                if (customerToDelete) {
                  handleDeleteCustomer(customerToDelete);
                }
                setShowDeleteDialog(false);
                setCustomerToDelete(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
