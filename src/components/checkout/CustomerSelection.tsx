import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  User,
  Plus,
  X,
  MapPin,
  Phone,
  Mail,
  UserPlus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_CUSTOMER,
  Customer,
  GET_CUSTOMERS,
  Mutation,
  MutationCreateCustomerArgs,
  Query,
  QueryGetCustomersArgs,
} from "@/graphql";
import { showSuccess } from "@/hooks/useToastMessages.tsx";
import { useDebounce } from "@/hooks/useDebounce.ts";

interface CustomerSelectionProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
}

interface NewCustomerForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  notes: string;
}

export const CustomerSelection = ({
  selectedCustomer,
  onSelectCustomer,
}: CustomerSelectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [createCustomer, { loading: creating }] = useMutation<
    Mutation,
    MutationCreateCustomerArgs
  >(CREATE_CUSTOMER);
  const { data, loading, refetch } = useQuery<Query, QueryGetCustomersArgs>(
    GET_CUSTOMERS,
    {
      fetchPolicy: "network-only",
      variables: {
        pagination: { page: 1, take: 10 },
        filters: { search: debouncedSearch },
      },
    },
  );

  const [newCustomer, setNewCustomer] = useState<NewCustomerForm>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state_province: "",
    postal_code: "",
    country: "United States",
    notes: "",
  });

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    setIsOpen(false);
    setSearchTerm("");
    setShowAddForm(false);
  };

  const [isGuestMode, setIsGuestMode] = useState(
    localStorage.getItem("guest_checkout") === "true",
  );

  const handleClearCustomer = () => {
    localStorage.removeItem("guest_checkout");
    setIsGuestMode(false);
    onSelectCustomer(null);
  };

  const handleGuestCheckout = () => {
    console.log("Guest checkout clicked");
    localStorage.setItem("guest_checkout", "true");
    setIsGuestMode(true);
    onSelectCustomer(null);
  };

  const hasShippingAddress = (customer: Customer) => {
    return (
      customer.address_line_1 &&
      customer.city &&
      customer.state_province &&
      customer.postal_code
    );
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.first_name || !newCustomer.last_name) {
      toast({
        title: "Error",
        description: "First name and last name are required",
        variant: "destructive",
      });
      return;
    }

    createCustomer({
      variables: {
        input: newCustomer,
      },
    }).then((res) => {
      showSuccess("Customer added successfully");
      onSelectCustomer(res.data.createCustomer);

      setNewCustomer({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state_province: "",
        postal_code: "",
        country: "United States",
        notes: "",
      });
      setShowAddForm(false);
      setIsOpen(false);

      refetch();
    });
  };

  return (
    <div className="space-y-4">
      {selectedCustomer ? (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </span>
                  {!!selectedCustomer.loyalty_points &&
                    selectedCustomer.loyalty_points > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedCustomer.loyalty_points} pts
                      </Badge>
                    )}
                </div>

                <div className="space-y-1 mt-2">
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  )}
                  {hasShippingAddress(selectedCustomer) ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {selectedCustomer.address_line_1},{" "}
                        {selectedCustomer.city},{" "}
                        {selectedCustomer.state_province}{" "}
                        {selectedCustomer.postal_code}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <MapPin className="h-4 w-4" />
                      <span>No shipping address on file</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCustomer}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ) : isGuestMode ? (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg text-green-600">
                    Guest Customer
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-green-100 text-green-700"
                  >
                    No account required
                  </Badge>
                </div>

                <div className="space-y-1 mt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>No email on file</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>No shipping address required</span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCustomer}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="justify-start h-12">
                <Search className="h-4 w-4 mr-2" />
                Select Customer
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {showAddForm ? "Add New Customer" : "Select Customer"}
                </DialogTitle>
              </DialogHeader>

              {!showAddForm ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12"
                      />
                    </div>
                    <Button
                      onClick={() => setShowAddForm(true)}
                      className="h-12 px-4"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add New
                    </Button>
                  </div>

                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading customers...
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {data?.getCustomers?.data?.map((customer) => (
                        <Card
                          key={customer.id}
                          className="p-4 cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">
                                  {customer.first_name} {customer.last_name}
                                </span>
                                {!!customer.loyalty_points &&
                                  customer.loyalty_points > 0 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {customer.loyalty_points} pts
                                    </Badge>
                                  )}
                                {!hasShippingAddress(customer) && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-amber-600 border-amber-600"
                                  >
                                    No address
                                  </Badge>
                                )}
                              </div>

                              <div className="text-sm text-muted-foreground">
                                {customer.email && (
                                  <span>{customer.email}</span>
                                )}
                                {customer.email && customer.phone && (
                                  <span className="mx-2">•</span>
                                )}
                                {customer.phone && (
                                  <span>{customer.phone}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}

                      {data?.getCustomers?.data?.length === 0 && searchTerm && (
                        <div className="text-center py-8 text-muted-foreground">
                          <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No customers found for "{searchTerm}"</p>
                          <Button
                            variant="outline"
                            onClick={() => setShowAddForm(true)}
                            className="mt-3"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add New Customer
                          </Button>
                        </div>
                      )}

                      {data?.getCustomers?.data?.length === 0 &&
                        !searchTerm && (
                          <div className="text-center py-8 text-muted-foreground">
                            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No customers found</p>
                            <Button
                              variant="outline"
                              onClick={() => setShowAddForm(true)}
                              className="mt-3"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add First Customer
                            </Button>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        value={newCustomer.first_name}
                        onChange={(e) =>
                          setNewCustomer((prev) => ({
                            ...prev,
                            first_name: e.target.value,
                          }))
                        }
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        value={newCustomer.last_name}
                        onChange={(e) =>
                          setNewCustomer((prev) => ({
                            ...prev,
                            last_name: e.target.value,
                          }))
                        }
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) =>
                          setNewCustomer((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="Enter email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newCustomer.phone}
                        onChange={(e) =>
                          setNewCustomer((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address_line_1">Address Line 1</Label>
                    <Input
                      id="address_line_1"
                      value={newCustomer.address_line_1}
                      onChange={(e) =>
                        setNewCustomer((prev) => ({
                          ...prev,
                          address_line_1: e.target.value,
                        }))
                      }
                      placeholder="Enter street address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address_line_2">Address Line 2</Label>
                    <Input
                      id="address_line_2"
                      value={newCustomer.address_line_2}
                      onChange={(e) =>
                        setNewCustomer((prev) => ({
                          ...prev,
                          address_line_2: e.target.value,
                        }))
                      }
                      placeholder="Apt, suite, etc. (optional)"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={newCustomer.city}
                        onChange={(e) =>
                          setNewCustomer((prev) => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                        placeholder="Enter city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state_province">State/Province</Label>
                      <Input
                        id="state_province"
                        value={newCustomer.state_province}
                        onChange={(e) =>
                          setNewCustomer((prev) => ({
                            ...prev,
                            state_province: e.target.value,
                          }))
                        }
                        placeholder="Enter state"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={newCustomer.postal_code}
                        onChange={(e) =>
                          setNewCustomer((prev) => ({
                            ...prev,
                            postal_code: e.target.value,
                          }))
                        }
                        placeholder="Enter postal code"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={newCustomer.country}
                      onChange={(e) =>
                        setNewCustomer((prev) => ({
                          ...prev,
                          country: e.target.value,
                        }))
                      }
                      placeholder="Enter country"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newCustomer.notes}
                      onChange={(e) =>
                        setNewCustomer((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Additional notes about the customer"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddCustomer} loading={creating}>
                      Add Customer
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="justify-start h-12"
            onClick={handleGuestCheckout}
          >
            <User className="h-4 w-4 mr-2" />
            Guest Checkout
          </Button>
        </div>
      )}
    </div>
  );
};
