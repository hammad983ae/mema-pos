import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Trash2, Upload, FileText, X, MapPin, CheckCircle } from "lucide-react";

interface ShippingItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  description: string;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

const ShippingRequestForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [businessId, setBusinessId] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    shipping_address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "United States",
    priority: "standard",
    shipping_method: "ground",
    notes: "",
    special_instructions: ""
  });

  const [items, setItems] = useState<ShippingItem[]>([{
    id: "1",
    product_name: "",
    quantity: 1,
    unit_price: 0,
    description: ""
  }]);

  useEffect(() => {
    if (user) {
      fetchCustomers();
      getUserBusinessId();
    }
  }, [user]);

  const getUserBusinessId = async () => {
    try {
      const { data: context, error } = await supabase.rpc('get_user_business_context');
      
      if (error) throw error;
      
      if (context && context.length > 0) {
        setBusinessId(context[0].business_id || null);
      } else {
        setBusinessId(null);
      }
    } catch (error) {
      console.error("Error fetching business ID:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, first_name, last_name, email, phone")
        .order("first_name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        customer_name: `${customer.first_name} ${customer.last_name}`,
        customer_email: customer.email || "",
        customer_phone: customer.phone || ""
      }));
    }
  };

  const addItem = () => {
    const newItem: ShippingItem = {
      id: Date.now().toString(),
      product_name: "",
      quantity: 1,
      unit_price: 0,
      description: ""
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof ShippingItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setUploadedFiles(prev => [...prev, ...fileArray]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddressSearch = async (address: string) => {
    if (address.length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    // Simple address suggestions (in a real app, you'd use Google Maps or similar API)
    const mockSuggestions = [
      `${address} Street, New York, NY`,
      `${address} Avenue, Los Angeles, CA`,
      `${address} Boulevard, Chicago, IL`,
      `${address} Drive, Houston, TX`,
      `${address} Road, Phoenix, AZ`
    ];
    
    setAddressSuggestions(mockSuggestions);
    setShowAddressSuggestions(true);
  };

  const selectAddressSuggestion = (suggestion: string) => {
    const parts = suggestion.split(', ');
    if (parts.length >= 3) {
      const streetAddress = parts[0];
      const city = parts[1];
      const stateZip = parts[2].split(' ');
      const state = stateZip[0];
      const zip = stateZip[1] || '';

      setFormData(prev => ({
        ...prev,
        shipping_address: streetAddress,
        city: city,
        state: state,
        zip_code: zip
      }));
    }
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
  };

  const uploadDocuments = async (shippingRequestId: string) => {
    const uploadPromises = uploadedFiles.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${shippingRequestId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('shipping-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save document record
      const { error: docError } = await supabase
        .from('shipping_documents')
        .insert({
          shipping_request_id: shippingRequestId,
          document_type: 'receipt',
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user?.id
        });

      if (docError) throw docError;
    });

    await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted", { user, businessId, formData });
    if (!user || !businessId) {
      console.error("Missing user or businessId", { user, businessId });
      toast({
        title: "Error",
        description: "User authentication or business information missing. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create shipping request
      const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const itemsDescription = items.map(item => 
        `${item.product_name} (${item.quantity}x)`
      ).join(", ");

      const { data: shippingRequest, error: requestError } = await supabase
        .from("shipping_requests")
        .insert({
          business_id: businessId,
          employee_id: user.id,
          customer_id: formData.customer_id || null,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          shipping_address: formData.shipping_address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          country: formData.country,
          items_description: itemsDescription,
          estimated_value: totalValue,
          priority: formData.priority,
          shipping_method: formData.shipping_method,
          notes: formData.notes,
          special_instructions: formData.special_instructions
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Create shipping items
      const itemsData = items.map(item => ({
        shipping_request_id: shippingRequest.id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        description: item.description
      }));

      const { error: itemsError } = await supabase
        .from("shipping_request_items")
        .insert(itemsData);

      if (itemsError) throw itemsError;

      // Upload documents if any
      if (uploadedFiles.length > 0) {
        await uploadDocuments(shippingRequest.id);
      }

      setShowSuccessModal(true);

      // Reset form
      setFormData({
        customer_id: "",
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        shipping_address: "",
        city: "",
        state: "",
        zip_code: "",
        country: "United States",
        priority: "standard",
        shipping_method: "ground",
        notes: "",
        special_instructions: ""
      });
      setItems([{
        id: "1",
        product_name: "",
        quantity: 1,
        unit_price: 0,
        description: ""
      }]);
      setUploadedFiles([]);

    } catch (error) {
      console.error("Error submitting shipping request:", error);
      toast({
        title: "Error",
        description: "Failed to submit shipping request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Create Shipping Request
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer">Select Customer (Optional)</Label>
                <Select onValueChange={handleCustomerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose existing customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.first_name} {customer.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customer_email">Customer Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customer_phone">Customer Phone</Label>
              <Input
                id="customer_phone"
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
              />
            </div>
          </div>

          <Separator />

          {/* Shipping Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Shipping Address</h3>
            
            <div className="relative">
              <Label htmlFor="shipping_address">Street Address *</Label>
              <div className="relative">
                <Input
                  id="shipping_address"
                  value={formData.shipping_address}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, shipping_address: e.target.value }));
                    handleAddressSearch(e.target.value);
                  }}
                  onFocus={() => formData.shipping_address.length >= 3 && setShowAddressSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                  required
                  className="pr-10"
                />
                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              
              {showAddressSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg">
                  {addressSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-muted"
                      onClick={() => selectAddressSuggestion(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="zip_code">ZIP Code *</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              />
            </div>
          </div>

          <Separator />

          {/* Items to Ship */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Items to Ship</h3>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={item.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Item {index + 1}</span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Product Name *</Label>
                    <Input
                      value={item.product_name}
                      onChange={(e) => updateItem(item.id, "product_name", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    placeholder="Additional details about this item..."
                  />
                </div>

                {item.unit_price > 0 && (
                  <div className="text-right">
                    <Badge variant="secondary">
                      Total: ${(item.quantity * item.unit_price).toFixed(2)}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator />

          {/* Shipping Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Shipping Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="shipping_method">Shipping Method</Label>
                <Select value={formData.shipping_method} onValueChange={(value) => setFormData(prev => ({ ...prev, shipping_method: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="ground">Ground</SelectItem>
                    <SelectItem value="express">Express</SelectItem>
                    <SelectItem value="overnight">Overnight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* File Attachments */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Attachments</h3>
            
            <div>
              <Label htmlFor="documents">Upload Receipts/Photos</Label>
              <div className="mt-2">
                <Input
                  id="documents"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                />
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Files:</Label>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeFile(index)}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional information..."
              />
            </div>

            <div>
              <Label htmlFor="special_instructions">Special Instructions</Label>
              <Textarea
                id="special_instructions"
                value={formData.special_instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, special_instructions: e.target.value }))}
                placeholder="Fragile, signature required, etc."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? "Submitting..." : "Submit Shipping Request"}
            </Button>
          </div>
        </form>
      </CardContent>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Shipping Request Submitted!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Your shipping request has been submitted successfully. The office team will review and process it shortly.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              You'll receive updates via email and in your dashboard
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowSuccessModal(false)}>
                Got it!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ShippingRequestForm;