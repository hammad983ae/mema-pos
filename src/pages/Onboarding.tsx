import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, Store, Users } from "lucide-react";

export default function Onboarding() {
  const { user, refreshBusinessAssociation } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [businessData, setBusinessData] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Update user profile with full name if not set
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      if (!profile?.full_name || profile.full_name === 'Business Owner') {
        const fullName = user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        businessData.name.split(' ')[0] || 
                        'Business Owner';
        
        await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('user_id', user.id);
      }

      // Create business
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: businessData.name,
          email: businessData.email,
          phone: businessData.phone,
          address: businessData.address,
          owner_user_id: user.id,
          invitation_code: Math.random().toString(36).substring(2, 10).toUpperCase()
        })
        .select()
        .single();

      if (businessError) throw businessError;

      // Create a default store
      await supabase
        .from('stores')
        .insert({
          name: `${businessData.name} - Main Location`,
          business_id: business.id,
          address: businessData.address,
          is_active: true
        });

      // Refresh business association
      await refreshBusinessAssociation();

      toast({
        title: "Welcome to your business!",
        description: "Your business has been created successfully.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast({
        title: "Setup Error",
        description: error.message || "Failed to create business",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to Your Business</CardTitle>
          <CardDescription>
            Let's set up your business profile to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateBusiness} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                placeholder="Enter your business name"
                value={businessData.name}
                onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessEmail">Business Email</Label>
              <Input
                id="businessEmail"
                type="email"
                placeholder="business@example.com"
                value={businessData.email}
                onChange={(e) => setBusinessData({ ...businessData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessPhone">Phone Number</Label>
              <Input
                id="businessPhone"
                placeholder="(555) 123-4567"
                value={businessData.phone}
                onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessAddress">Business Address</Label>
              <Input
                id="businessAddress"
                placeholder="123 Main St, City, State 12345"
                value={businessData.address}
                onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || !businessData.name}>
              {loading ? "Creating Business..." : "Create My Business"}
            </Button>

            <div className="bg-muted/50 rounded-lg p-4 mt-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Store className="w-4 h-4" />
                What happens next?
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your business profile will be created</li>
                <li>• You'll be assigned as the Business Owner</li>
                <li>• A default store location will be set up</li>
                <li>• You can start adding products and team members</li>
              </ul>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}