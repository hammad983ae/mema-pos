import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Search } from "lucide-react";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  loyalty_points: number;
}

interface CustomerSearchProps {
  customer: Customer | null;
  onCustomerFound: (customer: Customer | null) => void;
}

export const CustomerSearch = ({ customer, onCustomerFound }: CustomerSearchProps) => {
  const { toast } = useToast();
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const searchCustomer = async () => {
    if (!customerPhone.trim()) return;

    try {
      setIsSearching(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("phone", customerPhone.trim())
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
          description: "This will be processed as a walk-in customer.",
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

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <Label>Customer Information</Label>
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
          </div>
          
          {customer && (
            <div className="bg-muted p-3 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{customer.first_name} {customer.last_name}</p>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  {customer.email && (
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
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
        </div>
      </CardContent>
    </Card>
  );
};