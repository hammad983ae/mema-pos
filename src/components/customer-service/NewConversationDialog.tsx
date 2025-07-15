import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Search, User, Plus } from "lucide-react";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

interface NewConversationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (conversationId: string) => void;
}

export const NewConversationDialog = ({ isOpen, onClose, onSuccess }: NewConversationDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    priority: "medium",
    category: "auto-detect",
    initialMessage: ""
  });

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      // Get user's business
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      const { data, error } = await supabase
        .from("customers")
        .select("id, first_name, last_name, email, phone")
        .eq("business_id", membershipData.business_id)
        .order("first_name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
    }
  };

  const filteredCustomers = customers.filter(customer => 
    `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  const createConversation = async () => {
    if (!selectedCustomer || !formData.initialMessage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a customer and enter an initial message",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get user's business
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) throw new Error("Business context not found");

      // Auto-categorize the message using AI
      const categorizationResponse = await supabase.functions.invoke('ai-customer-service', {
        body: {
          action: 'categorize',
          message: formData.initialMessage,
        }
      });

      let aiCategory = formData.category;
      let aiPriority = formData.priority;

      if (!categorizationResponse.error && categorizationResponse.data) {
        aiCategory = categorizationResponse.data.category || formData.category;
        aiPriority = categorizationResponse.data.priority || formData.priority;
      }

      // Create conversation
      const { data: conversation, error: conversationError } = await supabase
        .from("customer_service_conversations")
        .insert({
          customer_id: selectedCustomer.id,
          business_id: membershipData.business_id,
          priority: aiPriority,
          category: aiCategory,
          assigned_to: user?.id,
        })
        .select()
        .single();

      if (conversationError) throw conversationError;

      // Add initial message
      await supabase.from("chat_messages").insert({
        conversation_id: conversation.id,
        content: formData.initialMessage,
        sender_type: 'customer',
        sender_id: selectedCustomer.id,
      });

      toast({
        title: "Conversation Created",
        description: `New conversation started with ${selectedCustomer.first_name} ${selectedCustomer.last_name}`,
      });

      onSuccess(conversation.id);
      handleClose();
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCustomer(null);
    setSearchTerm("");
    setFormData({
      priority: "medium",
      category: "auto-detect",
      initialMessage: ""
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Start New Customer Service Conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Selection */}
          <div className="space-y-3">
            <Label>Select Customer</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            {searchTerm && (
              <div className="max-h-40 overflow-y-auto border rounded-lg">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className={`p-3 cursor-pointer hover:bg-muted ${
                      selectedCustomer?.id === customer.id ? 'bg-primary/10 border-primary' : ''
                    }`}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {customer.first_name} {customer.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {customer.email}
                        </p>
                      </div>
                      {customer.phone && (
                        <p className="text-sm text-muted-foreground">
                          {customer.phone}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredCustomers.length === 0 && searchTerm && (
                  <div className="p-3 text-center text-muted-foreground">
                    No customers found matching "{searchTerm}"
                  </div>
                )}
              </div>
            )}
            
            {selectedCustomer && (
              <div className="p-3 bg-primary/10 rounded-lg border">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({selectedCustomer.email})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Conversation Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Category (Optional)</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto-detect">Auto-detect</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="shipping">Shipping</SelectItem>
                  <SelectItem value="returns">Returns</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="compliment">Compliment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Initial Message */}
          <div>
            <Label>Initial Message</Label>
            <Textarea
              placeholder="Enter the customer's initial message or inquiry..."
              value={formData.initialMessage}
              onChange={(e) => setFormData({...formData, initialMessage: e.target.value})}
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              AI will automatically analyze this message to suggest category and priority
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={createConversation} 
              disabled={loading || !selectedCustomer || !formData.initialMessage.trim()}
            >
              {loading ? "Creating..." : "Start Conversation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};