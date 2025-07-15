import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, User, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NewsletterFormData {
  email: string;
  name: string;
  company: string;
  subscriptionTypes: string[];
}

export const NewsletterForm = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<NewsletterFormData>({
    email: "",
    name: "",
    company: "",
    subscriptionTypes: ["general"]
  });

  const subscriptionOptions = [
    { id: "general", label: "General Updates", description: "Company news and major announcements" },
    { id: "product_updates", label: "Product Updates", description: "New features and improvements" },
    { id: "industry_news", label: "Industry Insights", description: "Beauty industry trends and tips" }
  ];

  const handleInputChange = (field: keyof NewsletterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubscriptionChange = (type: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      subscriptionTypes: checked 
        ? [...prev.subscriptionTypes, type]
        : prev.subscriptionTypes.filter(t => t !== type)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Submit to newsletter_subscriptions table
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert({
          email: formData.email,
          name: formData.name || null,
          company: formData.company || null,
          subscription_type: formData.subscriptionTypes[0], // Primary subscription type
          source: window.location.pathname,
          preferences: {
            subscription_types: formData.subscriptionTypes
          }
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Subscribed",
            description: "This email is already subscribed to our newsletter.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Successfully Subscribed!",
        description: "Thank you for subscribing. You'll receive our latest updates soon.",
      });

      // Reset form
      setFormData({
        email: "",
        name: "",
        company: "",
        subscriptionTypes: ["general"]
      });

    } catch (error: any) {
      toast({
        title: "Subscription Failed",
        description: "Please try again or contact us for assistance.",
        variant: "destructive",
      });
      console.error('Newsletter subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div>
          <Label htmlFor="newsletter-email">Email Address *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="newsletter-email"
              type="email"
              required
              className="pl-10"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your@email.com"
            />
          </div>
        </div>

        {/* Optional Fields */}
        <div>
          <Label htmlFor="newsletter-name">Name (optional)</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="newsletter-name"
              className="pl-10"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Your name"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="newsletter-company">Company (optional)</Label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="newsletter-company"
              className="pl-10"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="Your company"
            />
          </div>
        </div>

        {/* Subscription Preferences */}
        <div>
          <Label className="text-sm font-medium">What would you like to receive?</Label>
          <div className="space-y-3 mt-2">
            {subscriptionOptions.map((option) => (
              <div key={option.id} className="flex items-start space-x-3">
                <Checkbox
                  id={option.id}
                  checked={formData.subscriptionTypes.includes(option.id)}
                  onCheckedChange={(checked) => handleSubscriptionChange(option.id, !!checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label 
                    htmlFor={option.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading || formData.subscriptionTypes.length === 0}
          size="lg"
        >
          {loading ? "Subscribing..." : "Subscribe"}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          You can unsubscribe at any time. We respect your privacy and will never share your email.
        </p>
      </form>
    </div>
  );
};