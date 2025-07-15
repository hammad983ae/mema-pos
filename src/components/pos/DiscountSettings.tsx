import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
// Date picker functionality will use regular input
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Percent, Tag, Plus, Edit, Trash2, Copy } from "lucide-react";
import { Discount, CouponCode } from "@/types/discount";

interface DiscountSettingsProps {
  businessId: string;
}

export const DiscountSettings = ({ businessId }: DiscountSettingsProps) => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [couponCodes, setCouponCodes] = useState<CouponCode[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [selectedDiscountForCoupon, setSelectedDiscountForCoupon] = useState<string>("");
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: string;
    minimum_purchase_amount: string;
    maximum_discount_amount: string;
    usage_limit: string;
    start_date: Date;
    end_date: Date | null;
    requires_manager_override: boolean;
    is_stackable: boolean;
    status: 'active' | 'inactive' | 'expired';
  }>({
    name: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    minimum_purchase_amount: "0",
    maximum_discount_amount: "",
    usage_limit: "",
    start_date: new Date(),
    end_date: null,
    requires_manager_override: false,
    is_stackable: false,
    status: "active"
  });

  const [couponFormData, setCouponFormData] = useState({
    code: "",
    usage_limit: "",
    is_single_use: false
  });

  useEffect(() => {
    fetchDiscounts();
    fetchCouponCodes();
  }, [businessId]);

  const fetchDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscounts(data || []);
    } catch (error) {
      console.error('Error fetching discounts:', error);
      toast({
        title: "Error",
        description: "Failed to load discounts",
        variant: "destructive"
      });
    }
  };

  const fetchCouponCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('coupon_codes')
        .select(`
          *,
          discounts (*)
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCouponCodes(data || []);
    } catch (error) {
      console.error('Error fetching coupon codes:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      minimum_purchase_amount: "0",
      maximum_discount_amount: "",
      usage_limit: "",
      start_date: new Date(),
      end_date: null,
      requires_manager_override: false,
      is_stackable: false,
      status: "active"
    });
    setEditingDiscount(null);
  };

  const handleSaveDiscount = async () => {
    try {
      const discountData = {
        business_id: businessId,
        name: formData.name,
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        minimum_purchase_amount: parseFloat(formData.minimum_purchase_amount),
        maximum_discount_amount: formData.maximum_discount_amount ? parseFloat(formData.maximum_discount_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        start_date: formData.start_date.toISOString(),
        end_date: formData.end_date?.toISOString() || null,
        requires_manager_override: formData.requires_manager_override,
        is_stackable: formData.is_stackable,
        status: formData.status,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      let error;
      if (editingDiscount) {
        ({ error } = await supabase
          .from('discounts')
          .update(discountData)
          .eq('id', editingDiscount.id));
      } else {
        ({ error } = await supabase
          .from('discounts')
          .insert(discountData));
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Discount ${editingDiscount ? 'updated' : 'created'} successfully`
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchDiscounts();
    } catch (error) {
      console.error('Error saving discount:', error);
      toast({
        title: "Error",
        description: "Failed to save discount",
        variant: "destructive"
      });
    }
  };

  const handleCreateCoupon = async () => {
    try {
      const { error } = await supabase
        .from('coupon_codes')
        .insert({
          business_id: businessId,
          discount_id: selectedDiscountForCoupon,
          code: couponFormData.code.toUpperCase(),
          usage_limit: couponFormData.usage_limit ? parseInt(couponFormData.usage_limit) : null,
          is_single_use: couponFormData.is_single_use
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Coupon code created successfully"
      });

      setIsCouponDialogOpen(false);
      setCouponFormData({ code: "", usage_limit: "", is_single_use: false });
      setSelectedDiscountForCoupon("");
      fetchCouponCodes();
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast({
        title: "Error",
        description: "Failed to create coupon code",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDiscount = async (discountId: string) => {
    try {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', discountId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Discount deleted successfully"
      });

      fetchDiscounts();
    } catch (error) {
      console.error('Error deleting discount:', error);
      toast({
        title: "Error",
        description: "Failed to delete discount",
        variant: "destructive"
      });
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCouponFormData(prev => ({ ...prev, code: result }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Discount Management</h2>
        <div className="flex gap-2">
          <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Tag className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Coupon Code</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Discount</Label>
                  <Select value={selectedDiscountForCoupon} onValueChange={setSelectedDiscountForCoupon}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a discount" />
                    </SelectTrigger>
                    <SelectContent>
                      {discounts.filter(d => d.status === 'active').map(discount => (
                        <SelectItem key={discount.id} value={discount.id}>
                          {discount.name} ({discount.discount_type === 'percentage' ? `${discount.discount_value}%` : `$${discount.discount_value}`})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Coupon Code</Label>
                  <div className="flex gap-2">
                    <Input
                      value={couponFormData.code}
                      onChange={(e) => setCouponFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="Enter code"
                    />
                    <Button type="button" variant="outline" onClick={generateRandomCode}>
                      Generate
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Usage Limit (optional)</Label>
                  <Input
                    type="number"
                    value={couponFormData.usage_limit}
                    onChange={(e) => setCouponFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                    placeholder="Unlimited"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={couponFormData.is_single_use}
                    onCheckedChange={(checked) => setCouponFormData(prev => ({ ...prev, is_single_use: checked }))}
                  />
                  <Label>Single use only</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCouponDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateCoupon}
                    disabled={!selectedDiscountForCoupon || !couponFormData.code}
                  >
                    Create Coupon
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Discount
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingDiscount ? 'Edit' : 'Create'} Discount</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Discount Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Summer Sale"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={formData.discount_type} onValueChange={(value: 'percentage' | 'fixed_amount') => setFormData(prev => ({ ...prev, discount_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Discount description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Discount Value</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.discount_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_value: e.target.value }))}
                      placeholder={formData.discount_type === 'percentage' ? '10' : '5.00'}
                    />
                  </div>
                  <div>
                    <Label>Minimum Purchase</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.minimum_purchase_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, minimum_purchase_amount: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max Discount Amount (optional)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.maximum_discount_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, maximum_discount_amount: e.target.value }))}
                      placeholder="No limit"
                    />
                  </div>
                  <div>
                    <Label>Usage Limit (optional)</Label>
                    <Input
                      type="number"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.start_date.toISOString().split('T')[0]}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: new Date(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label>End Date (optional)</Label>
                    <Input
                      type="date"
                      value={formData.end_date?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value ? new Date(e.target.value) : null }))}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.requires_manager_override}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_manager_override: checked }))}
                    />
                    <Label>Requires Manager Override</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_stackable}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_stackable: checked }))}
                    />
                    <Label>Can Stack with Other Discounts</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveDiscount}
                    disabled={!formData.name || !formData.discount_value}
                  >
                    {editingDiscount ? 'Update' : 'Create'} Discount
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Discounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Discounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {discounts.map((discount) => (
              <div key={discount.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{discount.name}</h3>
                    <Badge variant={discount.status === 'active' ? 'default' : 'secondary'}>
                      {discount.status}
                    </Badge>
                    {discount.requires_manager_override && (
                      <Badge variant="outline">Manager Override</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{discount.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      {discount.discount_type === 'percentage' 
                        ? `${discount.discount_value}% off` 
                        : `$${discount.discount_value} off`}
                    </span>
                    <span>Min: ${discount.minimum_purchase_amount}</span>
                    {discount.usage_limit && (
                      <span>Used: {discount.usage_count}/{discount.usage_limit}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingDiscount(discount);
                      setFormData({
                        name: discount.name,
                        description: discount.description || "",
                        discount_type: discount.discount_type as 'percentage' | 'fixed_amount',
                        discount_value: discount.discount_value.toString(),
                        minimum_purchase_amount: discount.minimum_purchase_amount.toString(),
                        maximum_discount_amount: discount.maximum_discount_amount?.toString() || "",
                        usage_limit: discount.usage_limit?.toString() || "",
                        start_date: new Date(discount.start_date),
                        end_date: discount.end_date ? new Date(discount.end_date) : null,
                        requires_manager_override: discount.requires_manager_override,
                        is_stackable: discount.is_stackable,
                        status: discount.status as 'active' | 'inactive' | 'expired'
                      });
                      setIsCreateDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDiscount(discount.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coupon Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Coupon Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {couponCodes.map((coupon) => (
              <div key={coupon.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-medium">{coupon.code}</span>
                    <Badge variant="outline">{coupon.discounts.name}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {coupon.discounts.discount_type === 'percentage' 
                      ? `${coupon.discounts.discount_value}% off` 
                      : `$${coupon.discounts.discount_value} off`}
                    {coupon.usage_limit && ` • Used: ${coupon.usage_count}/${coupon.usage_limit}`}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(coupon.code)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};