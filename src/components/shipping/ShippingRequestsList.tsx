import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  FileText,
  Eye,
  Edit3,
  Calendar,
  Search,
  Filter,
  Download,
  Plus
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

interface ShippingRequest {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  items_description: string;
  estimated_value: number;
  priority: string;
  shipping_method: string;
  status: string;
  tracking_number: string;
  carrier: string;
  shipping_cost: number;
  notes: string;
  special_instructions: string;
  processed_by: string;
  processed_at: string;
  shipped_at: string;
  delivered_at: string;
  created_at: string;
  updated_at: string;
  employee: {
    full_name: string;
  };
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    description: string;
  }>;
}

interface ShippingRequestsListProps {
  userRole?: string;
  onCreateRequest?: () => void;
}

const ShippingRequestsList = ({ userRole, onCreateRequest }: ShippingRequestsListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ShippingRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ShippingRequest | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    status: "",
    tracking_number: "",
    carrier: "",
    shipping_cost: "",
    notes: ""
  });

  const isOfficeStaff = userRole && ['business_owner', 'manager', 'office'].includes(userRole);

  useEffect(() => {
    if (user) {
      fetchShippingRequests();
    }
  }, [user]);

  const fetchShippingRequests = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from("shipping_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;

      // Fetch items and employee details for each request
      const requestsWithItems = await Promise.all(
        (requestsData || []).map(async (request) => {
          // Fetch items
          const { data: items, error: itemsError } = await supabase
            .from("shipping_request_items")
            .select("*")
            .eq("shipping_request_id", request.id);

          // Fetch employee details
          const { data: employee, error: employeeError } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", request.employee_id)
            .maybeSingle();

          if (itemsError) {
            console.error("Error fetching items:", itemsError);
          }
          if (employeeError) {
            console.error("Error fetching employee:", employeeError);
          }

          return { 
            ...request, 
            employee: { full_name: employee?.full_name || "Unknown" },
            items: items || [] 
          };
        })
      );

      setRequests(requestsWithItems);
    } catch (error) {
      console.error("Error fetching shipping requests:", error);
      toast({
        title: "Error",
        description: "Failed to load shipping requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "approved": return "bg-blue-500";
      case "processing": return "bg-orange-500";
      case "shipped": return "bg-green-500";
      case "delivered": return "bg-success";
      case "cancelled": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "secondary";
      case "standard": return "outline";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedRequest || !isOfficeStaff) return;

    try {
      const updates: any = {
        status: editFormData.status,
        notes: editFormData.notes,
        processed_by: user?.id,
        processed_at: new Date().toISOString()
      };

      if (editFormData.tracking_number) {
        updates.tracking_number = editFormData.tracking_number;
      }
      if (editFormData.carrier) {
        updates.carrier = editFormData.carrier;
      }
      if (editFormData.shipping_cost) {
        updates.shipping_cost = parseFloat(editFormData.shipping_cost);
      }
      if (editFormData.status === "shipped") {
        updates.shipped_at = new Date().toISOString();
      }
      if (editFormData.status === "delivered") {
        updates.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("shipping_requests")
        .update(updates)
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast({
        title: "Request Updated",
        description: "Shipping request has been updated successfully.",
      });

      setIsEditDialogOpen(false);
      fetchShippingRequests();
    } catch (error) {
      console.error("Error updating shipping request:", error);
      toast({
        title: "Error",
        description: "Failed to update shipping request",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (request: ShippingRequest) => {
    setSelectedRequest(request);
    setEditFormData({
      status: request.status,
      tracking_number: request.tracking_number || "",
      carrier: request.carrier || "",
      shipping_cost: request.shipping_cost?.toString() || "",
      notes: request.notes || ""
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading shipping requests...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isOfficeStaff ? "All Shipping Requests" : "My Shipping Requests"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="mb-4">No shipping requests found</p>
              <Button 
                onClick={() => {
                  console.log("Create request button clicked");
                  onCreateRequest?.();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Request
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 border rounded-lg hover:shadow-card transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <Badge variant={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          #{request.id.slice(0, 8)}
                        </span>
                      </div>
                      {isOfficeStaff && (
                        <p className="text-sm text-muted-foreground">
                          Requested by: {request.employee?.full_name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isOfficeStaff && request.status !== "delivered" && request.status !== "cancelled" && (
                        <Button
                          onClick={() => openEditDialog(request)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Update
                        </Button>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Shipping Request Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            {/* Status and Tracking */}
                            <div className="flex items-center gap-4">
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                              {request.tracking_number && (
                                <div className="flex items-center gap-2">
                                  <Truck className="h-4 w-4" />
                                  <span className="font-mono text-sm">{request.tracking_number}</span>
                                </div>
                              )}
                            </div>

                            {/* Customer Info */}
                            <div>
                              <h4 className="font-semibold mb-2">Customer Information</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span>{request.customer_name}</span>
                                </div>
                                {request.customer_email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    <span>{request.customer_email}</span>
                                  </div>
                                )}
                                {request.customer_phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{request.customer_phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Shipping Address */}
                            <div>
                              <h4 className="font-semibold mb-2">Shipping Address</h4>
                              <div className="flex items-start gap-2 text-sm">
                                <MapPin className="h-4 w-4 mt-0.5" />
                                <div>
                                  <p>{request.shipping_address}</p>
                                  <p>{request.city}, {request.state} {request.zip_code}</p>
                                  <p>{request.country}</p>
                                </div>
                              </div>
                            </div>

                            {/* Items */}
                            <div>
                              <h4 className="font-semibold mb-2">Items to Ship</h4>
                              <div className="space-y-2">
                                {request.items.map((item) => (
                                  <div key={item.id} className="p-3 bg-muted rounded-lg">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-medium">{item.product_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                          Quantity: {item.quantity}
                                        </p>
                                        {item.description && (
                                          <p className="text-sm text-muted-foreground">
                                            {item.description}
                                          </p>
                                        )}
                                      </div>
                                      {item.unit_price > 0 && (
                                        <div className="text-right">
                                          <p className="font-medium">${item.total_price.toFixed(2)}</p>
                                          <p className="text-sm text-muted-foreground">
                                            ${item.unit_price.toFixed(2)} each
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Notes and Instructions */}
                            {(request.notes || request.special_instructions) && (
                              <div>
                                <h4 className="font-semibold mb-2">Notes & Instructions</h4>
                                {request.notes && (
                                  <div className="mb-2">
                                    <p className="text-sm font-medium">Notes:</p>
                                    <p className="text-sm text-muted-foreground">{request.notes}</p>
                                  </div>
                                )}
                                {request.special_instructions && (
                                  <div>
                                    <p className="text-sm font-medium">Special Instructions:</p>
                                    <p className="text-sm text-muted-foreground">{request.special_instructions}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Timestamps */}
                            <div>
                              <h4 className="font-semibold mb-2">Timeline</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>Created: {format(new Date(request.created_at), "PPp")}</span>
                                </div>
                                {request.processed_at && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>Processed: {format(new Date(request.processed_at), "PPp")}</span>
                                  </div>
                                )}
                                {request.shipped_at && (
                                  <div className="flex items-center gap-2">
                                    <Truck className="h-4 w-4" />
                                    <span>Shipped: {format(new Date(request.shipped_at), "PPp")}</span>
                                  </div>
                                )}
                                {request.delivered_at && (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Delivered: {format(new Date(request.delivered_at), "PPp")}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Customer</p>
                      <p className="font-medium">{request.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Destination</p>
                      <p className="font-medium">{request.city}, {request.state}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Items</p>
                      <p className="font-medium">{request.items_description}</p>
                    </div>
                  </div>

                  {request.estimated_value > 0 && (
                    <div className="mt-2">
                      <Badge variant="outline">
                        Est. Value: ${request.estimated_value.toFixed(2)}
                      </Badge>
                    </div>
                  )}

                  {request.tracking_number && (
                    <div className="mt-2 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-success" />
                      <span className="text-sm">Tracking: {request.tracking_number}</span>
                      {request.carrier && (
                        <Badge variant="outline">{request.carrier}</Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog for Office Staff */}
      {isOfficeStaff && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Shipping Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={editFormData.status} onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tracking_number">Tracking Number</Label>
                <Input
                  id="tracking_number"
                  value={editFormData.tracking_number}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, tracking_number: e.target.value }))}
                  placeholder="Enter tracking number"
                />
              </div>

              <div>
                <Label htmlFor="carrier">Carrier</Label>
                <Input
                  id="carrier"
                  value={editFormData.carrier}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, carrier: e.target.value }))}
                  placeholder="UPS, FedEx, USPS, etc."
                />
              </div>

              <div>
                <Label htmlFor="shipping_cost">Shipping Cost</Label>
                <Input
                  id="shipping_cost"
                  type="number"
                  step="0.01"
                  value={editFormData.shipping_cost}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, shipping_cost: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add processing notes..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleStatusUpdate}>
                  Update Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ShippingRequestsList;