export interface Discount {
  id: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  minimum_purchase_amount: number;
  maximum_discount_amount?: number;
  requires_manager_override: boolean;
  usage_limit?: number;
  usage_count: number;
  start_date: string;
  end_date?: string;
  is_stackable: boolean;
  status: 'active' | 'inactive' | 'expired';
}

export interface CouponCode {
  id: string;
  code: string;
  discount_id: string;
  usage_limit?: number;
  usage_count: number;
  is_single_use: boolean;
  discounts: Discount;
}

export interface AppliedDiscount {
  discount: Discount;
  couponCode?: CouponCode;
  discountAmount: number;
  managerOverride: boolean;
  overrideReason?: string;
}