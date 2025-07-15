import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Check,
  Star,
  Clock,
  Shield,
  Zap,
  DollarSign,
  Calculator,
  Minus,
  Plus,
  HelpCircle,
  ChevronDown,
  Building2,
  Users,
  Sparkles
} from "lucide-react";

export const PricingSection = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);
  const [shopCount, setShopCount] = useState(1);
  const [staffCount, setStaffCount] = useState(5);

  // Base platform pricing per shop
  const basePlatformPrice = {
    monthly: 129,
    annual: 1317 // $109.75/month when paid annually
  };

  // Per additional staff pricing (after included 3)
  const staffPricing = {
    perStaff: {
      monthly: 10,
      annual: 102
    },
    bundle5: {
      monthly: 40,
      annual: 408
    }
  };

  const getStaffCost = (additionalStaff: number) => {
    if (additionalStaff <= 0) return 0;
    
    const bundles = Math.floor(additionalStaff / 5);
    const remaining = additionalStaff % 5;
    
    if (isAnnual) {
      return (bundles * staffPricing.bundle5.annual) + (remaining * staffPricing.perStaff.annual);
    } else {
      return (bundles * staffPricing.bundle5.monthly) + (remaining * staffPricing.perStaff.monthly);
    }
  };

  const calculateTotal = () => {
    const basePrice = isAnnual ? basePlatformPrice.annual : basePlatformPrice.monthly;
    const totalBasePrice = basePrice * shopCount;
    const additionalStaff = Math.max(0, staffCount - 3); // 3 staff included
    const totalStaffCost = getStaffCost(additionalStaff) * shopCount;
    
    return totalBasePrice + totalStaffCost;
  };

  const calculateMonthlyEquivalent = () => {
    if (isAnnual) {
      return Math.round(calculateTotal() / 12);
    }
    return calculateTotal();
  };

  const faqItems = [
    {
      question: "How does MemaPOS pricing work?",
      answer: "MemaPOS uses a simple per-shop + per-staff model. Each shop costs $129/month (or $109.75/month annually) and includes core POS, scheduling, analytics, inventory, CRM, and 3 staff accounts. Additional staff cost $10/month each, with bundle pricing available."
    },
    {
      question: "What's included with each shop license?",
      answer: "Every shop license includes the complete MemaPOS platform: POS system, appointment scheduling, customer CRM, inventory management, analytics dashboard, commission tracking, and 3 staff accounts. Perfect for skincare clinics, spas, and beauty retailers."
    },
    {
      question: "How does staff pricing work?",
      answer: "Each shop includes 3 staff accounts. Additional staff cost $10/month each or save with our 5-staff bundle at $40/month. Pricing scales automatically as you add team members through your dashboard."
    },
    {
      question: "What happens when I add or remove staff?",
      answer: "Staff billing adjusts automatically when you add or remove team members. Changes are prorated to your billing cycle, so you only pay for what you use. No penalties for scaling your team up or down."
    },
    {
      question: "How does the 14-day free trial work?",
      answer: "Start your free trial with 1 shop and up to 3 staff members - no credit card required. Test all features including POS, scheduling, inventory, and team management. Upgrade anytime during or after the trial."
    },
    {
      question: "Can I get a discount for multiple shops?",
      answer: "Yes! Our pricing scales perfectly for multi-location businesses. Each additional shop follows the same $129/month model. For 10+ locations, contact our sales team for enterprise pricing and additional discounts."
    },
    {
      question: "What about refunds and cancellations?",
      answer: "Cancel anytime with no penalties. Annual subscriptions can be refunded on a prorated basis within the first 30 days. We're confident MemaPOS will transform your skincare business operations."
    },
    {
      question: "How do mid-cycle changes work?",
      answer: "All plan changes are prorated automatically. Adding staff or shops? You'll be charged a prorated amount for the remainder of your billing cycle. Removing staff? You'll receive prorated credits on your next invoice."
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            <span>Premium POS for Skincare Professionals</span>
          </div>
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-br from-foreground via-primary to-accent bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Built for skincare clinics, spas, and beauty retailers. Pay per shop + scale with your team. 
            No hidden fees, no surprises.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-6 mt-10 p-2 bg-secondary/50 rounded-2xl max-w-sm mx-auto">
            <span className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all ${!isAnnual ? 'text-primary bg-background shadow-soft' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all ${isAnnual ? 'text-primary bg-background shadow-soft' : 'text-muted-foreground'}`}>
              Annual
            </span>
          </div>
          {isAnnual && (
            <Badge className="bg-success text-success-foreground mt-4 px-4 py-2">
              <Star className="h-3 w-3 mr-1" />
              Save 15% with Annual Billing
            </Badge>
          )}
        </div>

        {/* Pricing Calculator */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-card rounded-3xl border border-border/50 shadow-elegant p-8 mb-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Calculator className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Calculate Your Monthly Cost</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                MemaPOS Core: <span className="font-semibold text-primary">${isAnnual ? '109.75' : '129'}/month per shop</span> (includes 3 staff)
                <br />
                Additional Staff: <span className="font-semibold text-primary">$10/month each</span> or <span className="font-semibold text-success">$40/month for 5-staff bundle</span>
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Shop Counter */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <label className="font-semibold">Number of Shops</label>
                </div>
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShopCount(Math.max(1, shopCount - 1))}
                    disabled={shopCount <= 1}
                    className="w-12 h-12 rounded-xl"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="text-center bg-primary/5 rounded-2xl px-8 py-4 min-w-[120px]">
                    <div className="text-3xl font-bold text-primary mb-1">{shopCount}</div>
                    <div className="text-sm text-muted-foreground">Shop{shopCount > 1 ? 's' : ''}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShopCount(shopCount + 1)}
                    className="w-12 h-12 rounded-xl"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Staff Counter */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-primary" />
                  <label className="font-semibold">Total Staff Members</label>
                </div>
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setStaffCount(Math.max(3, staffCount - 1))}
                    disabled={staffCount <= 3}
                    className="w-12 h-12 rounded-xl"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="text-center bg-primary/5 rounded-2xl px-8 py-4 min-w-[120px]">
                    <div className="text-3xl font-bold text-primary mb-1">{staffCount}</div>
                    <div className="text-sm text-muted-foreground">Staff</div>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setStaffCount(staffCount + 1)}
                    className="w-12 h-12 rounded-xl"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Cost Breakdown */}
            <div className="bg-gradient-secondary rounded-2xl p-6 space-y-4">
              <h4 className="font-semibold text-lg mb-4">Cost Breakdown</h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span>MemaPOS Core ({shopCount} shop{shopCount > 1 ? 's' : ''} × ${isAnnual ? '109.75' : '129'}/month)</span>
                  <span className="font-semibold">${isAnnual ? Math.round(109.75 * shopCount) : (129 * shopCount)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Included staff (3 per shop)</span>
                  <span className="text-success font-semibold">FREE</span>
                </div>
                
                {staffCount > 3 && (
                  <div className="flex justify-between items-center">
                    <span>Additional staff ({Math.max(0, staffCount - 3)} × $10/month × {shopCount} shop{shopCount > 1 ? 's' : ''})</span>
                    <span className="font-semibold">${Math.max(0, staffCount - 3) * 10 * shopCount}</span>
                  </div>
                )}
                
                <Separator className="my-2" />
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total {isAnnual ? 'Monthly' : ''} Cost</span>
                  <span className="text-primary text-2xl">${calculateMonthlyEquivalent()}/month</span>
                </div>
                
                {isAnnual && (
                  <div className="text-center text-sm text-muted-foreground">
                    Billed annually: ${calculateTotal()}/year (15% savings)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Single Plan Card */}
        <div className="max-w-2xl mx-auto mb-16">
          <Card className="relative overflow-hidden border-primary shadow-glow bg-gradient-card ring-2 ring-primary/20">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary"></div>
            
            <CardHeader className="text-center pb-8">
              <Badge className="mb-4 bg-primary text-primary-foreground w-fit mx-auto">
                <Star className="h-3 w-3 mr-1" />
                Complete POS Solution
              </Badge>
              <CardTitle className="text-3xl mb-4">MemaPOS Core</CardTitle>
              
              {/* Base Platform Price */}
              <div className="mb-6">
                <div className="text-sm text-muted-foreground mb-2">Base Platform (Per Shop)</div>
                <div className="flex items-end justify-center space-x-2 mb-2">
                  <span className="text-5xl font-bold text-primary">
                    ${isAnnual ? '109.75' : '129'}
                  </span>
                  <span className="text-muted-foreground pb-2 text-lg">
                    /month
                  </span>
                </div>
                {isAnnual && (
                  <div className="text-sm text-success font-medium">
                    $1,317 billed annually (15% savings)
                  </div>
                )}
              </div>

              <div className="bg-primary/5 rounded-2xl p-6 space-y-3">
                <div className="text-sm font-medium text-muted-foreground">What's Included</div>
                <div className="text-lg font-semibold">Complete POS + 3 Staff Accounts</div>
                <div className="text-sm text-muted-foreground">
                  Additional staff: $10/month each • 5-staff bundle: $40/month
                </div>
              </div>
              
              <p className="text-muted-foreground mt-6 leading-relaxed">
                Everything you need to run your skincare clinic, spa, or beauty retail business. 
                Built specifically for wellness professionals.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  "Complete POS System",
                  "Appointment Scheduling", 
                  "Customer CRM & Profiles",
                  "Inventory Management",
                  "Sales Analytics & Reports",
                  "Commission Tracking",
                  "Staff Management",
                  "Treatment Room Booking",
                  "Payment Processing",
                  "Customer Loyalty Program",
                  "Email & SMS Marketing",
                  "Mobile POS Support"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Check className="h-4 w-4 text-success flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    className="flex-1 h-12 text-lg font-semibold"
                    onClick={() => navigate('/auth')}
                  >
                    Start 14-Day Free Trial
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 text-lg font-semibold"
                    onClick={() => navigate('/demo')}
                  >
                    Book Demo
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full h-12 text-lg font-semibold"
                  onClick={() => navigate('/contact')}
                >
                  Talk to Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-6 bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent">
              Frequently Asked Questions
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about MemaPOS pricing and billing
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <Collapsible key={index} className="bg-gradient-card rounded-2xl border border-border/50 overflow-hidden">
                <CollapsibleTrigger className="w-full p-6 text-left hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">{faq.question}</h4>
                    <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-6 pb-6">
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>

        <Separator className="my-16" />

        <div className="text-center">
          <div className="bg-gradient-secondary rounded-2xl p-8 mb-8">
            <h4 className="text-2xl font-bold mb-4">Ready to Transform Your Skincare Business?</h4>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join 200+ skincare clinics, spas, and beauty retailers already using MemaPOS to streamline operations and boost revenue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Button size="lg" className="flex-1" onClick={() => navigate('/auth')}>
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="flex-1" onClick={() => navigate('/demo')}>
                Book Demo
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-6">
            14-day free trial • No credit card required • Cancel anytime • No setup fees
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Bank-Grade Security</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>99.9% Uptime SLA</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Transparent Billing</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};