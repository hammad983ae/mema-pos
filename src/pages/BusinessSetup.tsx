import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Building,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  ArrowRight,
  Loader2,
  Star,
  CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BusinessSetup = () => {
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [businessData, setBusinessData] = useState({
    businessName: "",
    businessEmail: "",
    businessPhone: "",
    businessAddress: "",
    subscriptionPlan: "starter",
    storeData: {
      storeName: "",
      storeAddress: "",
      storePhone: "",
    },
    teamData: {
      initialMembers: [],
    },
    inventoryData: {
      initialProducts: [],
    },
    posData: {
      configured: false,
    },
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Redirect if not authenticated
  useEffect(() => {
    // Only redirect if auth is not loading and user is null
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const validateBusinessInfo = () => {
    const newErrors: { [key: string]: string } = {};

    if (!businessData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }

    if (
      businessData.businessEmail &&
      !/\S+@\S+\.\S+/.test(businessData.businessEmail)
    ) {
      newErrors.businessEmail = "Email is invalid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateBusinessInfo()) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (currentStep === 5) {
      await setupBusiness();
    }
  };

  const setupBusiness = async () => {
    if (!validateBusinessInfo()) return;

    setLoading(true);
    setErrors({});

    try {
      const { data, error } = await supabase.functions.invoke(
        "setup-business",
        {
          body: businessData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || "Failed to setup business");
      }

      toast({
        title: "Business Setup Complete!",
        description: "Welcome to your manager dashboard!",
      });

      // Navigate directly to manager dashboard
      navigate("/manager");
    } catch (error: any) {
      setErrors({ general: error.message || "Failed to setup business" });
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: "Starter",
      value: "starter",
      price: "$29",
      period: "/month",
      description: "Perfect for single-location businesses",
      features: [
        "1 Store Location",
        "Up to 500 Products",
        "Basic POS System",
        "Email Support",
      ],
      highlighted: false,
    },
    {
      name: "Professional",
      value: "professional",
      price: "$79",
      period: "/month",
      description: "Ideal for growing businesses",
      features: [
        "Up to 5 Store Locations",
        "Unlimited Products",
        "Advanced Analytics",
        "Priority Support",
      ],
      highlighted: true,
    },
    {
      name: "Enterprise",
      value: "enterprise",
      price: "Custom",
      period: "",
      description: "For large chains and franchises",
      features: [
        "Unlimited Locations",
        "White-label Solution",
        "Dedicated Support",
        "Custom Features",
      ],
      highlighted: false,
    },
  ];

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading if no user after auth has finished loading
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg"></div>
            <span className="text-2xl font-bold">Mema</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Set Up Your Business</h1>
          <p className="text-muted-foreground">
            Let's get your skincare business up and running
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step}
                </div>
                {step < totalSteps && (
                  <div
                    className={`w-8 h-0.5 ${currentStep > step ? "bg-primary" : "bg-muted"}`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Setup Card */}
        <Card className="bg-card shadow-elegant border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-xl">
              {currentStep === 1 && "Business Information"}
              {currentStep === 2 && "Choose Your Plan"}
              {currentStep === 3 && "Store Setup"}
              {currentStep === 4 && "Team & Inventory"}
              {currentStep === 5 && "Complete Setup"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {/* General Error Alert */}
            {errors.general && (
              <Alert className="mb-4 border-destructive/50 bg-destructive/10">
                <AlertDescription className="text-destructive">
                  {errors.general}
                </AlertDescription>
              </Alert>
            )}

            {/* Step 1: Business Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name *</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="business-name"
                      type="text"
                      placeholder="Enter your business name"
                      className="pl-10"
                      value={businessData.businessName}
                      onChange={(e) =>
                        setBusinessData((prev) => ({
                          ...prev,
                          businessName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  {errors.businessName && (
                    <p className="text-sm text-destructive">
                      {errors.businessName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-email">Business Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="business-email"
                      type="email"
                      placeholder="business@example.com"
                      className="pl-10"
                      value={businessData.businessEmail}
                      onChange={(e) =>
                        setBusinessData((prev) => ({
                          ...prev,
                          businessEmail: e.target.value,
                        }))
                      }
                    />
                  </div>
                  {errors.businessEmail && (
                    <p className="text-sm text-destructive">
                      {errors.businessEmail}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-phone">Business Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="business-phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      className="pl-10"
                      value={businessData.businessPhone}
                      onChange={(e) =>
                        setBusinessData((prev) => ({
                          ...prev,
                          businessPhone: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-address">Business Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="business-address"
                      placeholder="Enter your business address"
                      className="pl-10 min-h-[80px] resize-none"
                      value={businessData.businessAddress}
                      onChange={(e) =>
                        setBusinessData((prev) => ({
                          ...prev,
                          businessAddress: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <Button onClick={handleNext} className="w-full h-12">
                  Continue to Plan Selection
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 2: Plan Selection */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.value}
                      className={`relative border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                        businessData.subscriptionPlan === plan.value
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      } ${plan.highlighted ? "ring-2 ring-primary/20" : ""}`}
                      onClick={() =>
                        setBusinessData((prev) => ({
                          ...prev,
                          subscriptionPlan: plan.value,
                        }))
                      }
                    >
                      {plan.highlighted && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </span>
                        </div>
                      )}

                      <div className="text-center">
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                        <div className="my-2">
                          <span className="text-2xl font-bold">
                            {plan.price}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {plan.period}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {plan.description}
                        </p>

                        <ul className="space-y-1 text-sm">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <CheckCircle className="h-3 w-3 text-success mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 h-12"
                  >
                    Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1 h-12">
                    Continue to Store Setup
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Store Setup */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    Set up your first store location
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="store-name">Store Name *</Label>
                    <Input
                      id="store-name"
                      value={businessData.storeData.storeName}
                      onChange={(e) =>
                        setBusinessData((prev) => ({
                          ...prev,
                          storeData: {
                            ...prev.storeData,
                            storeName: e.target.value,
                          },
                        }))
                      }
                      placeholder="Main Location"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="store-address">Store Address</Label>
                    <Input
                      id="store-address"
                      value={businessData.storeData.storeAddress}
                      onChange={(e) =>
                        setBusinessData((prev) => ({
                          ...prev,
                          storeData: {
                            ...prev.storeData,
                            storeAddress: e.target.value,
                          },
                        }))
                      }
                      placeholder="Store address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="store-phone">Store Phone</Label>
                    <Input
                      id="store-phone"
                      value={businessData.storeData.storePhone}
                      onChange={(e) =>
                        setBusinessData((prev) => ({
                          ...prev,
                          storeData: {
                            ...prev.storeData,
                            storePhone: e.target.value,
                          },
                        }))
                      }
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 h-12"
                  >
                    Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1 h-12">
                    Continue to Team Setup
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Team & Inventory */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    Optional: Add team members and initial inventory later
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Team Members</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You can invite team members after completing the setup
                    </p>
                    <div className="text-center">
                      <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                      <p className="text-sm">Will be set up later</p>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Initial Inventory</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add your products and services after setup
                    </p>
                    <div className="text-center">
                      <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                      <p className="text-sm">Will be set up later</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 h-12"
                  >
                    Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1 h-12">
                    Continue to Final Step
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Complete Setup */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    Ready to Launch!
                  </h3>
                  <p className="text-muted-foreground">
                    Review your setup and complete your business registration
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Business Name:</span>
                    <span>{businessData.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Plan:</span>
                    <span className="capitalize">
                      {businessData.subscriptionPlan}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Store Name:</span>
                    <span>
                      {businessData.storeData.storeName || "Main Location"}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 h-12"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleFinish}
                    disabled={loading}
                    className="flex-1 h-12"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Complete Setup
                      </>
                    )}
                  </Button>
                </div>

                <Alert className="border-primary/50 bg-primary/10">
                  <CreditCard className="h-4 w-4" />
                  <AlertDescription className="text-primary">
                    <strong>Payment Required:</strong> A valid payment method is
                    required to activate your business account. You'll be
                    prompted to add payment details after setup.
                  </AlertDescription>
                </Alert>

                <div className="text-center text-sm text-muted-foreground">
                  <p>
                    You can always modify these settings later from your
                    dashboard
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessSetup;
