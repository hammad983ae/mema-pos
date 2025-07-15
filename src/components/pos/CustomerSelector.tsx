import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, User, Plus, X, MapPin, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address_line_1: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  loyalty_points: number | null;
}

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  businessId: string;
}

export const CustomerSelector = ({ selectedCustomer, onSelectCustomer, businessId }: CustomerSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && businessId) {
      fetchCustomers();
    }
  }, [isOpen, businessId]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchTerm)
    );
  });

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClearCustomer = () => {
    onSelectCustomer(null);
  };

  const hasShippingAddress = (customer: Customer) => {
    return customer.address_line_1 && customer.city && customer.state_province && customer.postal_code;
  };

  return (
    <div className="space-y-2">
      <Label>Customer</Label>
      
      {selectedCustomer ? (
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </span>
                  {selectedCustomer.loyalty_points && selectedCustomer.loyalty_points > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedCustomer.loyalty_points} pts
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  )}
                </div>
                
                {hasShippingAddress(selectedCustomer) ? (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {selectedCustomer.address_line_1}, {selectedCustomer.city}, {selectedCustomer.state_province} {selectedCustomer.postal_code}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                    <MapPin className="h-3 w-3" />
                    <span>No shipping address on file</span>
                  </div>
                )}
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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Plus className="h-4 w-4 mr-2" />
              Select Customer
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Select Customer</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading customers...
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredCustomers.map((customer) => (
                    <Card
                      key={customer.id}
                      className="p-3 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {customer.first_name} {customer.last_name}
                            </span>
                            {customer.loyalty_points && customer.loyalty_points > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {customer.loyalty_points} pts
                              </Badge>
                            )}
                            {!hasShippingAddress(customer) && (
                              <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                                No address
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            {customer.email && <span>{customer.email}</span>}
                            {customer.email && customer.phone && <span className="mx-2">•</span>}
                            {customer.phone && <span>{customer.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {filteredCustomers.length === 0 && searchTerm && (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No customers found for "{searchTerm}"</p>
                      <p className="text-xs mt-1">Try a different search term</p>
                    </div>
                  )}
                  
                  {filteredCustomers.length === 0 && !searchTerm && (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No customers found</p>
                      <p className="text-xs mt-1">Add customers in the CRM section</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};