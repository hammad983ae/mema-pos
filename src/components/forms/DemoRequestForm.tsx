import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Clock, Phone, Mail, Building, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DemoFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  businessType: string;
  locationCount: string;
  currentPosSystem: string;
  preferredDate: string;
  preferredTime: string;
  requirements: string;
}

export const DemoRequestForm = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DemoFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    businessType: "",
    locationCount: "1",
    currentPosSystem: "",
    preferredDate: "",
    preferredTime: "",
    requirements: ""
  });

  const businessTypes = [
    { value: "spa", label: "Day Spa" },
    { value: "salon", label: "Beauty Salon" },
    { value: "cosmetics_retail", label: "Cosmetics Retail" },
    { value: "medical_spa", label: "Medical Spa" },
    { value: "dermatology", label: "Dermatology Clinic" },
    { value: "wellness", label: "Wellness Center" },
    { value: "franchise", label: "Franchise Chain" }
  ];

  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
  ];

  const handleInputChange = (field: keyof DemoFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Submit to demo_requests table
      const { error } = await supabase
        .from('demo_requests')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          business_type: formData.businessType,
          current_location_count: parseInt(formData.locationCount),
          current_pos_system: formData.currentPosSystem,
          preferred_date: formData.preferredDate || null,
          preferred_time: formData.preferredTime || null,
          specific_requirements: formData.requirements || null
        });

      if (error) throw error;

      toast({
        title: "Demo Request Submitted!",
        description: "Our team will contact you within 24 hours to schedule your personalized demo.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        businessType: "",
        locationCount: "1",
        currentPosSystem: "",
        preferredDate: "",
        preferredTime: "",
        requirements: ""
      });

    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
      console.error('Demo request error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Schedule Your Demo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  required
                  className="pl-10"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="John Smith"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john@beautycompany.com"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  className="pl-10"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="company">Company Name *</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company"
                  required
                  className="pl-10"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Beauty Boutique Spa"
                />
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Business Type *</Label>
              <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {businessTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Number of Locations</Label>
              <Select value={formData.locationCount} onValueChange={(value) => handleInputChange('locationCount', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Location</SelectItem>
                  <SelectItem value="2">2 Locations</SelectItem>
                  <SelectItem value="3-5">3-5 Locations</SelectItem>
                  <SelectItem value="6-10">6-10 Locations</SelectItem>
                  <SelectItem value="11+">11+ Locations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="currentPos">Current POS System (if any)</Label>
            <Input
              id="currentPos"
              value={formData.currentPosSystem}
              onChange={(e) => handleInputChange('currentPosSystem', e.target.value)}
              placeholder="Square, Shopify, Clover, etc."
            />
          </div>

          {/* Scheduling Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preferredDate">Preferred Date</Label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="preferredDate"
                  type="date"
                  className="pl-10"
                  value={formData.preferredDate}
                  onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div>
              <Label>Preferred Time</Label>
              <Select value={formData.preferredTime} onValueChange={(value) => handleInputChange('preferredTime', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {time}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Requirements */}
          <div>
            <Label htmlFor="requirements">Specific Requirements or Questions</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              placeholder="Tell us about your specific needs, integration requirements, or any questions you have..."
              rows={4}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
            size="lg"
          >
            {loading ? "Submitting..." : "Schedule My Demo"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By submitting this form, you agree to receive communications from MemaPOS. 
            We respect your privacy and will never share your information.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};