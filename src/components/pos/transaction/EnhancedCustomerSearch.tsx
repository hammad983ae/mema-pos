import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Search, Plus, AlertTriangle, MapPin, Phone, Mail } from "lucide-react";
import { CustomerFormDialog } from "@/components/shared/CustomerFormDialog";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  loyalty_points: number;
  address_line_1?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
}

interface CustomerSearchProps {
  customer: Customer | null;
  onCustomerFound: (customer: Customer | null) => void;
  businessId: string;
  requiresShipping?: boolean;
}

export const EnhancedCustomerSearch = ({ 
  customer, 
  onCustomerFound, 
  businessId, 
  requiresShipping = false 
}: CustomerSearchProps) => {
  const { toast } = useToast();
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const searchCustomer = async () => {
    if (!customerPhone.trim()) return;

    try {
      setIsSearching(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("phone", customerPhone.trim())
        .eq("business_id", businessId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        onCustomerFound(data);
        toast({
          title: "Customer Found",
          description: `Welcome back, ${data.first_name} ${data.last_name}!`,
        });
      } else {
        onCustomerFound(null);
        toast({
          title: "Customer Not Found",
          description: "No customer found with this phone number.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error searching customer:", error);
      toast({
        title: "Error",
        description: "Failed to search customer.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleCustomerCreated = (customer: Customer) => {
    onCustomerFound(customer);
    setIsCreateDialogOpen(false);
    toast({
      title: "Customer Created",
      description: `Customer ${customer.first_name} ${customer.last_name} has been added.`,
    });
  };

  const hasShippingAddress = (customer: Customer) => {
    return customer.address_line_1 && customer.city && customer.state_province && customer.postal_code;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <Label>Customer Information</Label>
            {requiresShipping && (
              <Badge variant="outline" className="text-xs">
                Required for shipping
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Enter phone number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchCustomer()}
            />
            <Button 
              onClick={searchCustomer} 
              disabled={!customerPhone.trim() || isSearching}
              size="sm"
            >
              <Search className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
          
          {/* Customer Display */}
          {customer && (
            <div className="bg-muted p-3 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{customer.first_name} {customer.last_name}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    {customer.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>{customer.email}</span>
                      </div>
                    )}
                  </div>
                  
                  {hasShippingAddress(customer) ? (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {customer.address_line_1}, {customer.city}, {customer.state_province} {customer.postal_code}
                      </span>
                    </div>
                  ) : requiresShipping && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span>No shipping address on file</span>
                    </div>
                  )}
                </div>
                
                {customer.loyalty_points > 0 && (
                  <Badge variant="secondary">
                    {customer.loyalty_points} pts
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* Shipping Validation Warning */}
          {requiresShipping && !customer && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                A customer must be selected for orders with shipping items. Search for an existing customer or create a new one.
              </AlertDescription>
            </Alert>
          )}
          
          {requiresShipping && customer && !hasShippingAddress(customer) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This customer doesn't have a complete shipping address. Please update their profile before proceeding.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>

      {/* Customer Creation Dialog */}
      <CustomerFormDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCustomerCreated={handleCustomerCreated}
        businessId={businessId}
        requiresShipping={requiresShipping}
        simplified={false}
      />
    </Card>
  );
};