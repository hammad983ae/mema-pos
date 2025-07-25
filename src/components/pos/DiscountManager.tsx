import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Percent, Tag, Crown, Shield, Gift, X } from "lucide-react";
import { Discount, CouponCode, AppliedDiscount } from "@/types/discount";
import { useAuth } from "@/hooks/useAuth.tsx";
import { UserRole } from "@/graphql";

interface DiscountManagerProps {
  subtotal: number;
  appliedDiscounts: AppliedDiscount[];
  onDiscountApplied: (discount: AppliedDiscount) => void;
  onDiscountRemoved: (discountId: string) => void;
  businessId: string;
  customerId?: string;
  loyaltyPoints?: number;
}

export const DiscountManager = ({
  subtotal,
  appliedDiscounts,
  onDiscountApplied,
  onDiscountRemoved,
  businessId,
  customerId,
  loyaltyPoints = 0,
}: DiscountManagerProps) => {
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState("");
  const [availableDiscounts, setAvailableDiscounts] = useState<Discount[]>([]);
  const [loyaltyDiscounts, setLoyaltyDiscounts] = useState<any[]>([]);
  const [showManagerOverride, setShowManagerOverride] = useState<string | null>(
    null,
  );
  const [overrideReason, setOverrideReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isManager =
    user.role === UserRole.BusinessOwner || user.role === UserRole.Manager;

  useEffect(() => {
    fetchAvailableDiscounts();
    if (customerId) {
      fetchLoyaltyDiscounts();
    }
  }, [businessId, customerId]);

  const fetchAvailableDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .eq("business_id", businessId)
        .eq("status", "active")
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);

      if (error) throw error;
      setAvailableDiscounts(data || []);
    } catch (error) {
      console.error("Error fetching discounts:", error);
    }
  };

  const fetchLoyaltyDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from("loyalty_discounts")
        .select(
          `
          *,
          discounts (*)
        `,
        )
        .eq("business_id", businessId)
        .eq("customer_id", customerId)
        .eq("is_used", false)
        .lte("points_required", loyaltyPoints);

      if (error) throw error;
      setLoyaltyDiscounts(data || []);
    } catch (error) {
      console.error("Error fetching loyalty discounts:", error);
    }
  };

  const calculateDiscountAmount = (
    discount: Discount,
    amount: number,
  ): number => {
    if (discount.discount_type === "percentage") {
      const discountAmount = (amount * discount.discount_value) / 100;
      return discount.maximum_discount_amount
        ? Math.min(discountAmount, discount.maximum_discount_amount)
        : discountAmount;
    } else {
      return Math.min(discount.discount_value, amount);
    }
  };

  const validateDiscount = (discount: Discount): string | null => {
    if (subtotal < discount.minimum_purchase_amount) {
      return `Minimum purchase amount of $${discount.minimum_purchase_amount} required`;
    }

    if (appliedDiscounts.some((ad) => ad.discount.id === discount.id)) {
      return "This discount has already been applied";
    }

    return null;
  };

  const applyCouponCode = async () => {
    if (!couponCode.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupon_codes")
        .select(
          `
          *,
          discounts (*)
        `,
        )
        .eq("business_id", businessId)
        .eq("code", couponCode.toUpperCase())
        .single();

      if (error || !data) {
        toast({
          title: "Invalid Code",
          description: "Coupon code not found or expired",
          variant: "destructive",
        });
        return;
      }

      const discount = data.discounts as Discount;
      const validationError = validateDiscount(discount);

      if (validationError) {
        toast({
          title: "Cannot Apply Discount",
          description: validationError,
          variant: "destructive",
        });
        return;
      }

      if (discount.requires_manager_override && !isManager) {
        setShowManagerOverride(discount.id);
        return;
      }

      const discountAmount = calculateDiscountAmount(discount, subtotal);

      onDiscountApplied({
        discount,
        couponCode: data,
        discountAmount,
        managerOverride: false,
      });

      setCouponCode("");
      toast({
        title: "Discount Applied",
        description: `${discount.name} has been applied`,
      });
    } catch (error) {
      console.error("Error applying coupon code:", error);
      toast({
        title: "Error",
        description: "Failed to apply coupon code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyManagerOverride = (discountId: string) => {
    const discount = availableDiscounts.find((d) => d.id === discountId);
    if (!discount) return;

    const discountAmount = calculateDiscountAmount(discount, subtotal);

    onDiscountApplied({
      discount,
      discountAmount,
      managerOverride: true,
      overrideReason,
    });

    setShowManagerOverride(null);
    setOverrideReason("");
    toast({
      title: "Manager Override Applied",
      description: `${discount.name} has been applied with manager override`,
    });
  };

  const applyLoyaltyDiscount = async (loyaltyDiscountId: string) => {
    const loyaltyDiscount = loyaltyDiscounts.find(
      (ld) => ld.id === loyaltyDiscountId,
    );
    if (!loyaltyDiscount) return;

    const discount = loyaltyDiscount.discounts as Discount;
    const validationError = validateDiscount(discount);

    if (validationError) {
      toast({
        title: "Cannot Apply Discount",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    const discountAmount = calculateDiscountAmount(discount, subtotal);

    onDiscountApplied({
      discount,
      discountAmount,
      managerOverride: false,
    });

    // Mark loyalty discount as used
    await supabase
      .from("loyalty_discounts")
      .update({
        is_used: true,
        used_date: new Date().toISOString(),
      })
      .eq("id", loyaltyDiscountId);

    fetchLoyaltyDiscounts();
    toast({
      title: "Loyalty Reward Applied",
      description: `${discount.name} has been applied using loyalty points`,
    });
  };

  const totalDiscountAmount = appliedDiscounts.reduce(
    (sum, ad) => sum + ad.discountAmount,
    0,
  );

  return (
    <div className="space-y-4">
      {/* Applied Discounts */}
      {appliedDiscounts.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Applied Discounts</Label>
          {appliedDiscounts.map((appliedDiscount) => (
            <div
              key={appliedDiscount.discount.id}
              className="flex items-center justify-between p-2 bg-success/10 border border-success/20 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                {appliedDiscount.managerOverride ? (
                  <Shield className="h-4 w-4 text-warning" />
                ) : appliedDiscount.couponCode ? (
                  <Tag className="h-4 w-4 text-success" />
                ) : (
                  <Gift className="h-4 w-4 text-primary" />
                )}
                <div>
                  <div className="text-sm font-medium">
                    {appliedDiscount.discount.name}
                  </div>
                  {appliedDiscount.managerOverride && (
                    <div className="text-xs text-warning">Manager Override</div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-success">
                  -${appliedDiscount.discountAmount.toFixed(2)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDiscountRemoved(appliedDiscount.discount.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Coupon Code Input */}
      <div className="space-y-2">
        <Label htmlFor="coupon-code">Coupon Code</Label>
        <div className="flex space-x-2">
          <Input
            id="coupon-code"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === "Enter" && applyCouponCode()}
          />
          <Button
            onClick={applyCouponCode}
            disabled={!couponCode.trim() || isLoading}
            size="sm"
          >
            <Tag className="h-4 w-4 mr-2" />
            Apply
          </Button>
        </div>
      </div>

      {/* Loyalty Rewards */}
      {loyaltyDiscounts.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center">
            <Crown className="h-4 w-4 mr-2 text-primary" />
            Available Loyalty Rewards ({loyaltyPoints} points)
          </Label>
          {loyaltyDiscounts.map((loyaltyDiscount) => (
            <Card key={loyaltyDiscount.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">
                    {loyaltyDiscount.discounts.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {loyaltyDiscount.points_required} points required
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => applyLoyaltyDiscount(loyaltyDiscount.id)}
                  className="h-8"
                >
                  Redeem
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Manager Override Dialog */}
      <AlertDialog
        open={!!showManagerOverride}
        onOpenChange={() => setShowManagerOverride(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Manager Override Required</AlertDialogTitle>
            <AlertDialogDescription>
              This discount requires manager approval. Please provide a reason
              for the override.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="override-reason">Override Reason</Label>
            <Input
              id="override-reason"
              placeholder="Enter reason for override"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                showManagerOverride && applyManagerOverride(showManagerOverride)
              }
              disabled={!overrideReason.trim()}
            >
              Apply Override
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discount Summary */}
      {totalDiscountAmount > 0 && (
        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm font-medium">
            <span>Total Discounts:</span>
            <span className="text-success">
              -${totalDiscountAmount.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
