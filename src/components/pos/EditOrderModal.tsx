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
import { useAuth } from "@/hooks/useAuth";
import { Edit, Trash2, User, DollarSign, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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

interface Employee {
  user_id: string;
  full_name: string;
  email: string;
}

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onOrderUpdated: () => void;
}

export const EditOrderModal = ({
  isOpen,
  onClose,
  order,
  onOrderUpdated
}: EditOrderModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState({
    user_id: '',
    customer_id: '',
    total: 0,
    notes: '',
    status: 'completed'
  });

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      if (order) {
        setFormData({
          user_id: order.user_id,
          customer_id: order.customer_id || '',
          total: order.total,
          notes: order.notes || '',
          status: order.status
        });
      }
    }
  }, [isOpen, order]);

  const fetchEmployees = async () => {
    try {
      // Get business context
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      // Get all employees in the business
      const { data: employeeData } = await supabase
        .from("user_business_memberships")
        .select("user_id")
        .eq("business_id", membershipData.business_id)
        .eq("is_active", true);

      if (employeeData) {
        const userIds = employeeData.map(emp => emp.user_id);
        
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", userIds);

        const formattedEmployees = profilesData?.map(profile => ({
          user_id: profile.user_id,
          full_name: profile.full_name || 'Unknown',
          email: profile.email || ''
        })) || [];
        
        setEmployees(formattedEmployees);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleSave = async () => {
    if (!order || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          user_id: formData.user_id,
          total: formData.total,
          notes: formData.notes,
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq("id", order.id);

      if (error) throw error;

      toast({
        title: "Order Updated",
        description: `Order ${order.order_number} has been updated successfully.`,
      });

      onOrderUpdated();
      onClose();

    } catch (error: any) {
      console.error("Error updating order:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!order || !user) return;

    if (!confirm(`Are you sure you want to delete order ${order.order_number}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      if (error) throw error;

      toast({
        title: "Order Deleted",
        description: `Order ${order.order_number} has been deleted.`,
      });

      onOrderUpdated();
      onClose();

    } catch (error: any) {
      console.error("Error deleting order:", error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Order - {order.order_number}
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ← Back
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Order Number:</span>
                  <div>{order.order_number}</div>
                </div>
                <div>
                  <span className="font-medium">Date:</span>
                  <div>{new Date(order.created_at).toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="font-medium">Customer:</span>
                  <div>
                    {order.customers 
                      ? `${order.customers.first_name} ${order.customers.last_name}`
                      : "Walk-in Customer"
                    }
                  </div>
                </div>
                <div>
                  <span className="font-medium">Payment Method:</span>
                  <div className="capitalize">{order.payment_method}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <div className="space-y-4">
            <div>
              <Label>Assigned Salesperson</Label>
              <Select value={formData.user_id} onValueChange={(value) => setFormData({...formData, user_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select salesperson" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.user_id} value={employee.user_id}>
                      {employee.full_name} ({employee.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Total Amount</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={formData.total}
                  onChange={(e) => setFormData({...formData, total: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Order
            </Button>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};