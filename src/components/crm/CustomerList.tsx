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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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
import { UserRole } from "@/graphql";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  total_spent: number;
  visit_count: number;
  last_visit_date: string;
  loyalty_points: number;
  skin_type: string;
  skin_concerns: string[];
  created_at: string;
}

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
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("last_visit_date");
  const [filterBy, setFilterBy] = useState("all");
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authAction, setAuthAction] = useState<() => void>(() => {});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [user, refreshTrigger]);

  useEffect(() => {
    filterAndSortCustomers();
  }, [customers, searchQuery, sortBy, filterBy]);

  const fetchCustomers = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's business context
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("business_id", membershipData.business_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCustomers = () => {
    let filtered = [...customers];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (customer) =>
          `${customer.first_name} ${customer.last_name}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.phone?.includes(searchQuery),
      );
    }

    // Apply category filter
    switch (filterBy) {
      case "recent":
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(
          (customer) =>
            customer.last_visit_date &&
            new Date(customer.last_visit_date) > thirtyDaysAgo,
        );
        break;
      case "high_value":
        filtered = filtered.filter(
          (customer) => (customer.total_spent || 0) > 500,
        );
        break;
      case "loyalty":
        filtered = filtered.filter(
          (customer) => (customer.loyalty_points || 0) > 100,
        );
        break;
      case "birthdays":
        const today = new Date();
        const currentMonth = today.getMonth();
        filtered = filtered.filter((customer) => {
          if (!customer.date_of_birth) return false;
          const birthMonth = new Date(customer.date_of_birth).getMonth();
          return birthMonth === currentMonth;
        });
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return `${a.first_name} ${a.last_name}`.localeCompare(
            `${b.first_name} ${b.last_name}`,
          );
        case "total_spent":
          return (b.total_spent || 0) - (a.total_spent || 0);
        case "visit_count":
          return (b.visit_count || 0) - (a.visit_count || 0);
        case "last_visit_date":
        default:
          if (!a.last_visit_date && !b.last_visit_date) return 0;
          if (!a.last_visit_date) return 1;
          if (!b.last_visit_date) return -1;
          return (
            new Date(b.last_visit_date).getTime() -
            new Date(a.last_visit_date).getTime()
          );
      }
    });

    setFilteredCustomers(filtered);
  };

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
    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });

      // Refresh the customer list
      fetchCustomers();
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Management</h2>
          <p className="text-muted-foreground">
            {filteredCustomers.length} of {customers.length} customers
          </p>
        </div>
        <Button onClick={onAddCustomer}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

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
            {filteredCustomers.map((customer) => {
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
                        ${(customer.total_spent || 0).toFixed(2)}
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

        {filteredCustomers.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            {customers.length === 0 ? (
              <div>
                <p className="mb-2">No customers found</p>
                <Button variant="outline" onClick={onAddCustomer}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first customer
                </Button>
              </div>
            ) : (
              <p>No customers match your current filters</p>
            )}
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
