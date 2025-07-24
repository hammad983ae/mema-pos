import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  Building,
  CheckCircle,
  AlertCircle,
  Loader2,
  KeyRound,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/hooks/useToastMessages.tsx";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    user,
    signInEmployee,
    signInOwner,
    signUp,
    resetPassword,
    updatePassword,
    verifyEmail,
    loading,
  } = useAuth();
  const { toast } = useToast();

  const [isLoading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authFlow, setAuthFlow] = useState<
    "main" | "signin" | "owner_signup" | "employee_join"
  >("main");
  const [signinType, setSigninType] = useState<"owner" | "employee">(
    "employee",
  );
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const token = searchParams.get("token");

  // Employee Sign In Form
  const [employeeSignInData, setEmployeeSignInData] = useState({
    username: "",
    pin: "",
  });

  // Owner Sign In Form
  const [ownerSignInData, setOwnerSignInData] = useState({
    email: "",
    password: "",
  });

  // Owner Sign Up Form (Business Owner Only)
  const [ownerSignUpData, setOwnerSignUpData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    businessName: "",
    phone: "",
    username: "",
    pin: "",
  });

  // Employee Join Form (Invitation Code)
  const [employeeJoinData, setEmployeeJoinData] = useState({
    invitationCode: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    username: "",
    pin: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Handle password reset mode and verification from email links
  useEffect(() => {
    const mode = searchParams.get("mode");
    const verified = searchParams.get("verified");

    if (mode === "reset") {
      setShowResetPassword(true);
    }

    if (verified === "true" && user) {
      // Always redirect to welcome page for new accounts
      navigate("/welcome");
    }
  }, [searchParams, user, navigate]);

  useEffect(() => {
    if (token) {
      verifyEmail(token, () => navigate("/welcome", { replace: true }));
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      // Smart routing based on role using optimized function
      const checkUserRoleAndRoute = async () => {
        try {
          // Use the new optimized function to get user context
          const { data: context, error } = await supabase.rpc(
            "get_user_business_context",
          );

          if (error) {
            console.error("Error getting user context:", error);
            // Fallback to profile check
            const { data: profile } = await supabase
              .from("profiles")
              .select("position")
              .eq("user_id", user.id)
              .maybeSingle();

            const userPosition = profile?.position;
            if (userPosition === "Business Owner") {
              navigate("/dashboard");
            } else {
              navigate("/employee");
            }
            return;
          }

          if (context && context.length > 0) {
            const userRole = context[0].user_role;

            // Smart routing logic
            if (userRole === "business_owner") {
              navigate("/dashboard");
            } else if (userRole === "manager") {
              navigate("/manager");
            } else if (userRole === "office") {
              navigate("/crm"); // Office staff access CRM/shipping
            } else {
              navigate("/employee");
            }
          } else {
            // No business membership found, check if business owner without membership
            const { data: profile } = await supabase
              .from("profiles")
              .select("position")
              .eq("user_id", user.id)
              .maybeSingle();

            if (profile?.position === "Business Owner") {
              navigate("/business-setup");
            } else {
              navigate("/employee");
            }
          }
        } catch (error) {
          console.error("Error checking user role:", error);
          navigate("/employee"); // Fallback to employee dashboard
        }
      };

      checkUserRoleAndRoute();
    }
  }, [user, navigate]);

  const validateEmployeeSignIn = () => {
    const newErrors: { [key: string]: string } = {};

    if (!employeeSignInData.username) {
      newErrors.username = "Username is required";
    } else if (employeeSignInData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!employeeSignInData.pin) {
      newErrors.pin = "PIN is required";
    } else if (!/^\d{4,8}$/.test(employeeSignInData.pin)) {
      newErrors.pin = "PIN must be 4-8 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOwnerSignIn = () => {
    const newErrors: { [key: string]: string } = {};

    if (!ownerSignInData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(ownerSignInData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!ownerSignInData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOwnerSignUp = () => {
    const newErrors: { [key: string]: string } = {};

    if (!ownerSignUpData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(ownerSignUpData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!ownerSignUpData.password) {
      newErrors.password = "Password is required";
    } else if (ownerSignUpData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (ownerSignUpData.password !== ownerSignUpData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    if (!ownerSignUpData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!ownerSignUpData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }

    if (!ownerSignUpData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(ownerSignUpData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!ownerSignUpData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (ownerSignUpData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!ownerSignUpData.pin) {
      newErrors.pin = "PIN is required";
    } else if (!/^\d{4,8}$/.test(ownerSignUpData.pin)) {
      newErrors.pin = "PIN must be 4-8 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEmployeeJoin = () => {
    const newErrors: { [key: string]: string } = {};

    if (!employeeJoinData.invitationCode.trim()) {
      newErrors.invitationCode = "Invitation code is required";
    }

    if (!employeeJoinData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(employeeJoinData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!employeeJoinData.password) {
      newErrors.password = "Password is required";
    } else if (employeeJoinData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (employeeJoinData.password !== employeeJoinData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    if (!employeeJoinData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!employeeJoinData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(employeeJoinData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!employeeJoinData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (employeeJoinData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!employeeJoinData.pin) {
      newErrors.pin = "PIN is required";
    } else if (!/^\d{4,8}$/.test(employeeJoinData.pin)) {
      newErrors.pin = "PIN must be 4-8 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmployeeSignIn = async () => {
    if (!validateEmployeeSignIn()) return;

    setLoading(true);
    setErrors({});

    try {
      const { error } = await signInEmployee(
        employeeSignInData.username,
        employeeSignInData.pin,
      );

      if (error) {
        if (
          error.message.includes("Invalid login credentials") ||
          error.message.includes("Invalid username")
        ) {
          setErrors({ general: "Invalid username or PIN" });
        } else if (error.message.includes("Email not confirmed")) {
          setErrors({
            general: "Please check your email and confirm your account",
          });
        } else {
          setErrors({ general: error.message });
        }
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      // Role-based redirect happens in useEffect above
    } catch (error: any) {
      setErrors({ general: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerSignIn = async () => {
    if (!validateOwnerSignIn()) return;

    setLoading(true);
    setErrors({});

    try {
      signInOwner(ownerSignInData.email, ownerSignInData.password);
    } catch (error: any) {
      setErrors({ general: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerSignUp = async () => {
    if (!validateOwnerSignUp()) return;

    setLoading(true);
    setErrors({});

    try {
      // Business owner signup only
      signUp(
        {
          email: ownerSignUpData.email,
          password: ownerSignUpData.password,
          full_name: ownerSignUpData.fullName,
          business_name: ownerSignUpData.businessName,
          phone: ownerSignUpData.phone,
          username: ownerSignUpData.username,
          pos_pin: ownerSignUpData.pin,
        },
        () => {
          setVerificationEmail(ownerSignUpData.email);
          setShowEmailVerification(true);
          setOwnerSignUpData({
            email: "",
            password: "",
            confirmPassword: "",
            fullName: "",
            businessName: "",
            phone: "",
            username: "",
            pin: "",
          });
        },
      );

      // Show email verification screen
    } catch (error: any) {
      setErrors({ general: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeJoin = async () => {
    if (!validateEmployeeJoin()) return;

    setLoading(true);
    setErrors({});

    try {
      // Use join-business edge function
      const { data, error } = await supabase.functions.invoke("join-business", {
        body: {
          invitationCode: employeeJoinData.invitationCode,
          email: employeeJoinData.email,
          password: employeeJoinData.password,
          fullName: employeeJoinData.fullName,
          phone: employeeJoinData.phone,
          username: employeeJoinData.username,
          pin: employeeJoinData.pin,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        setErrors({ general: data?.error || "Failed to join business" });
        return;
      }

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });

      // Show email verification screen
      setVerificationEmail(employeeJoinData.email);
      setShowEmailVerification(true);
    } catch (error: any) {
      setErrors({ general: error.message || "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setErrors({ email: "Email is required" });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(resetEmail)) {
      setErrors({ email: "Email is invalid" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const { error } = await resetPassword(resetEmail);

      if (error) {
        setErrors({ general: error.message });
        return;
      }

      toast({
        title: "Reset email sent!",
        description: "Check your email for password reset instructions.",
      });

      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      setErrors({ general: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword) {
      setErrors({ password: "New password is required" });
      return;
    }

    if (newPassword.length < 6) {
      setErrors({ password: "Password must be at least 6 characters" });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrors({ confirmPassword: "Passwords don't match" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const { error } = await updatePassword(newPassword);

      if (error) {
        setErrors({ general: error.message });
        return;
      }

      toast({
        title: "Password updated!",
        description: "Your password has been successfully changed.",
      });

      navigate("/auth?verified=true");
    } catch (error: any) {
      setErrors({ general: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg"></div>
            <span className="text-2xl font-bold">Mema</span>
          </div>
          <p className="text-muted-foreground">
            Access your business management platform
          </p>
        </div>

        {/* Auth Card */}
        <Card className="bg-card shadow-elegant border-0">
          <CardHeader className="pb-4"></CardHeader>

          <CardContent>
            {showEmailVerification ? (
              /* Email Verification Screen */
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Check your email</h3>
                  <p className="text-muted-foreground">
                    We've sent a verification link to
                  </p>
                  <p className="font-medium text-primary break-all">
                    {verificationEmail}
                  </p>
                </div>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>
                      Click the link in the email to verify your account
                    </span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>
                      Once verified, you can sign in to access your dashboard
                    </span>
                  </div>
                </div>

                <Alert className="border-primary/50 bg-primary/10 text-left">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-primary text-sm">
                    <strong>Didn't receive the email?</strong> Check your spam
                    folder or wait a few minutes. The email may take up to 5
                    minutes to arrive.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col space-y-3 pt-4">
                  <Button
                    onClick={() => {
                      setShowEmailVerification(false);
                      setAuthFlow("signin");
                    }}
                    className="w-full"
                  >
                    Continue to Sign In
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEmailVerification(false);
                      setVerificationEmail("");
                      setAuthFlow("owner_signup");
                    }}
                    className="w-full"
                  >
                    Back to Sign Up
                  </Button>
                </div>
              </div>
            ) : showForgotPassword ? (
              /* Forgot Password Form */
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">Reset Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your email address and we'll send you a link to reset
                    your password.
                  </p>
                </div>

                {errors.general && (
                  <Alert className="border-destructive/50 bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-destructive">
                      {errors.general}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail("");
                      setErrors({});
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : showResetPassword ? (
              /* Reset Password Form */
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">Set New Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your new password below.
                  </p>
                </div>

                {errors.general && (
                  <Alert className="border-destructive/50 bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-destructive">
                      {errors.general}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className="pl-10 pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-new-password"
                      type="password"
                      placeholder="Confirm new password"
                      className="pl-10"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handlePasswordReset}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            ) : authFlow === "main" ? (
              /* Main Choice Screen */
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Welcome to Mema</h2>
                  <p className="text-muted-foreground">
                    Choose how you'd like to continue
                  </p>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={() => setAuthFlow("signin")}
                    className="w-full h-14 text-lg"
                    size="lg"
                  >
                    Sign In
                  </Button>

                  <Button
                    onClick={() => setAuthFlow("owner_signup")}
                    variant="outline"
                    className="w-full h-14 text-lg"
                    size="lg"
                  >
                    Create Business Account
                  </Button>
                </div>
              </div>
            ) : authFlow === "signin" ? (
              /* Sign In Flow */
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="ghost"
                    onClick={() => setAuthFlow("main")}
                    size="sm"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <h2 className="text-xl font-semibold">Sign In</h2>
                  <div className="w-16"></div>
                </div>

                {/* General Error Alert */}
                {errors.general && (
                  <Alert className="mb-4 border-destructive/50 bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-destructive">
                      {errors.general}
                    </AlertDescription>
                  </Alert>
                )}

                <Tabs
                  value={signinType}
                  onValueChange={(value) =>
                    setSigninType(value as "owner" | "employee")
                  }
                >
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="employee">Employee</TabsTrigger>
                    <TabsTrigger value="owner">Business Owner</TabsTrigger>
                  </TabsList>

                  {/* Employee Login */}
                  <TabsContent value="employee" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee-username">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="employee-username"
                          type="text"
                          placeholder="Enter your username"
                          className="pl-10"
                          value={employeeSignInData.username}
                          onChange={(e) =>
                            setEmployeeSignInData((prev) => ({
                              ...prev,
                              username: e.target.value.toLowerCase(),
                            }))
                          }
                        />
                      </div>
                      {errors.username && (
                        <p className="text-sm text-destructive">
                          {errors.username}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employee-pin">PIN</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="employee-pin"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your PIN"
                          className="pl-10 pr-10"
                          value={employeeSignInData.pin}
                          onChange={(e) =>
                            setEmployeeSignInData((prev) => ({
                              ...prev,
                              pin: e.target.value.replace(/\D/g, ""),
                            }))
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {errors.pin && (
                        <p className="text-sm text-destructive">{errors.pin}</p>
                      )}
                    </div>

                    <Button
                      onClick={handleEmployeeSignIn}
                      disabled={loading}
                      className="w-full h-12 mt-6"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </TabsContent>

                  {/* Owner Login */}
                  <TabsContent value="owner" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="owner-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="owner-email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10"
                          value={ownerSignInData.email}
                          onChange={(e) =>
                            setOwnerSignInData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="owner-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="owner-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="pl-10 pr-10"
                          value={ownerSignInData.password}
                          onChange={(e) =>
                            setOwnerSignInData((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }))
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-destructive">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={handleOwnerSignIn}
                      disabled={loading}
                      className="w-full h-12 mt-6"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>

                    {/* Forgot Password Link for Owners */}
                    <div className="text-center">
                      <Button
                        variant="link"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setErrors({});
                        }}
                        className="text-sm text-primary hover:underline"
                      >
                        <KeyRound className="h-4 w-4 mr-2" />
                        Forgot password?
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Cross-navigation for Sign In */}
                <div className="text-center pt-6 border-t">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Button
                      variant="link"
                      onClick={() => setAuthFlow("owner_signup")}
                      className="text-primary hover:underline p-0 h-auto font-normal"
                    >
                      Create business account
                    </Button>
                  </p>
                </div>
              </div>
            ) : (
              /* Sign Up Flow */
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="ghost"
                    onClick={() => setAuthFlow("main")}
                    size="sm"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <h2 className="text-xl font-semibold">
                    Create Business Account
                  </h2>
                  <div className="w-16"></div>
                </div>

                {/* General Error Alert */}
                {errors.general && (
                  <Alert className="mb-4 border-destructive/50 bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-destructive">
                      {errors.general}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    Start managing your team and business operations
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your full name"
                        className="pl-10"
                        value={ownerSignUpData.fullName}
                        onChange={(e) =>
                          setOwnerSignUpData((prev) => ({
                            ...prev,
                            fullName: e.target.value,
                          }))
                        }
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-sm text-destructive">
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-business">Business Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-business"
                        type="text"
                        placeholder="Your business name"
                        className="pl-10"
                        value={ownerSignUpData.businessName}
                        onChange={(e) =>
                          setOwnerSignUpData((prev) => ({
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={ownerSignUpData.email}
                      onChange={(e) =>
                        setOwnerSignUpData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number *</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      className="pl-10"
                      value={ownerSignUpData.phone}
                      onChange={(e) =>
                        setOwnerSignUpData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="6+ characters"
                        className="pl-10 pr-10"
                        value={ownerSignUpData.password}
                        onChange={(e) =>
                          setOwnerSignUpData((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="Confirm password"
                        className="pl-10"
                        value={ownerSignUpData.confirmPassword}
                        onChange={(e) =>
                          setOwnerSignUpData((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                  <h3 className="font-medium text-sm">
                    POS Access Credentials
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    These will be used for point-of-sale system access
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-username">POS Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-username"
                          type="text"
                          placeholder="POS username"
                          className="pl-10"
                          value={ownerSignUpData.username}
                          onChange={(e) =>
                            setOwnerSignUpData((prev) => ({
                              ...prev,
                              username: e.target.value.toLowerCase(),
                            }))
                          }
                        />
                      </div>
                      {errors.username && (
                        <p className="text-sm text-destructive">
                          {errors.username}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-pin">POS PIN</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-pin"
                          type={showPassword ? "text" : "password"}
                          placeholder="4-8 digits"
                          className="pl-10"
                          value={ownerSignUpData.pin}
                          onChange={(e) =>
                            setOwnerSignUpData((prev) => ({
                              ...prev,
                              pin: e.target.value.replace(/\D/g, ""),
                            }))
                          }
                        />
                      </div>
                      {errors.pin && (
                        <p className="text-sm text-destructive">{errors.pin}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleOwnerSignUp}
                  disabled={loading}
                  className="w-full h-12 mt-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Business Account"
                  )}
                </Button>

                <Alert className="border-primary/50 bg-primary/10">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-primary">
                    You'll receive an email to verify your account after signing
                    up.
                  </AlertDescription>
                </Alert>

                {/* Cross-navigation for Sign Up */}
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Button
                      variant="link"
                      onClick={() => setAuthFlow("signin")}
                      className="text-primary hover:underline p-0 h-auto font-normal"
                    >
                      Sign in here
                    </Button>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>
            By signing up, you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
