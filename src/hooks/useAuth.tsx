import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLazyQuery, useMutation } from "@apollo/client";
import {
  GET_CURRENT_USER,
  LOGIN,
  Mutation,
  MutationLoginArgs,
  MutationRegisterArgs,
  MutationVerifyEmailArgs,
  Query,
  REGISTER,
  User,
  VERIFY_EMAIL,
} from "@/graphql";
import { showSuccess } from "@/hooks/useToastMessages.tsx";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hasBusinessAssociation, setHasBusinessAssociation] = useState(false);
  const { toast } = useToast();
  const [register, { loading: registering }] = useMutation<
    Mutation,
    MutationRegisterArgs
  >(REGISTER);
  const [login, { loading: loggingIn }] = useMutation<
    Mutation,
    MutationLoginArgs
  >(LOGIN);
  const [verifyEmail, { loading: verifyingEmail }] = useMutation<
    Mutation,
    MutationVerifyEmailArgs
  >(VERIFY_EMAIL);
  const [getCurrentUser, { loading: fetchingUser }] =
    useLazyQuery<Query>(GET_CURRENT_USER);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    }
  }, [token]);

  const fetchCurrentUser = () => {
    getCurrentUser().then((res) => {
      setUser(res.getCurrentUser);
    });
  };

  // const checkBusinessAssociation = async (userId: string) => {
  //   try {
  //     console.log("Checking business association for user:", userId);
  //     const { data, error } = await supabase
  //       .from("user_business_memberships")
  //       .select("id, business_id, role")
  //       .eq("user_id", userId)
  //       .eq("is_active", true)
  //       .limit(1);
  //
  //     console.log("Business association query result:", { data, error });
  //     const hasAssociation = !!data && data.length > 0 && !error;
  //     console.log("Has business association:", hasAssociation);
  //     setHasBusinessAssociation(hasAssociation);
  //   } catch (error) {
  //     console.error("Error checking business association:", error);
  //     setHasBusinessAssociation(false);
  //   }
  // };
  //
  // const refreshBusinessAssociation = async () => {
  //   if (user) {
  //     await checkBusinessAssociation(user.id);
  //   }
  // };

  // const signInEmployee = async (username: string, pin: string) => {
  //   try {
  //     // Employee login: username + PIN
  //     // Get profile with pos_pin field
  //     const { data: profile, error: profileError } = await supabase
  //       .from("profiles")
  //       .select("user_id, email, pos_pin")
  //       .eq("username", username.toLowerCase())
  //       .maybeSingle();
  //
  //     if (profileError || !profile) {
  //       toast({
  //         title: "Sign In Error",
  //         description: "Invalid username or PIN",
  //         variant: "destructive",
  //       });
  //       return { data: null, error: { message: "Invalid username or PIN" } };
  //     }
  //
  //     // Check rate limiting before attempting login
  //     const { data: rateLimitCheck, error: rateLimitError } =
  //       await supabase.rpc("check_pin_rate_limit", {
  //         p_user_id: profile.user_id,
  //       });
  //
  //     if (rateLimitError || !rateLimitCheck) {
  //       // Log failed attempt
  //       await supabase.rpc("log_pin_attempt", {
  //         p_user_id: profile.user_id,
  //         p_success: false,
  //       });
  //
  //       toast({
  //         title: "Account Locked",
  //         description: "Too many failed attempts. Please try again in 1 hour.",
  //         variant: "destructive",
  //       });
  //       return { data: null, error: { message: "Account temporarily locked" } };
  //     }
  //
  //     // Verify PIN directly (stored as plain text)
  //     if (!profile.pos_pin || pin !== profile.pos_pin) {
  //       await supabase.rpc("log_pin_attempt", {
  //         p_user_id: profile.user_id,
  //         p_success: false,
  //       });
  //
  //       toast({
  //         title: "Sign In Error",
  //         description: "Invalid username or PIN",
  //         variant: "destructive",
  //       });
  //       return { data: null, error: { message: "Invalid username or PIN" } };
  //     }
  //
  //     // Use email and PIN for Supabase auth (PIN stored as password)
  //     const { data, error } = await supabase.auth.signInWithPassword({
  //       email: profile.email,
  //       password: pin,
  //     });
  //
  //     // Log successful attempt
  //     await supabase.rpc("log_pin_attempt", {
  //       p_user_id: profile.user_id,
  //       p_success: !error,
  //     });
  //
  //     if (error) {
  //       toast({
  //         title: "Sign In Error",
  //         description: "Authentication failed. Please try again.",
  //         variant: "destructive",
  //       });
  //     }
  //
  //     return { data, error };
  //   } catch (err: any) {
  //     toast({
  //       title: "Sign In Error",
  //       description: "An error occurred during sign in",
  //       variant: "destructive",
  //     });
  //     return { data: null, error: { message: err.message } };
  //   }
  // };

  const signUp = (
    input: {
      email: string;
      password: string;
      full_name: string;
      business_name: string;
      phone: string;
      username: string;
      pos_pin: string;
    },
    onSuccess?: () => void,
  ) => {
    register({
      variables: {
        input,
      },
    }).then((res) => {
      localStorage.setItem("accessToken", res.data.register.access_token);
      setToken(res.data.register.access_token);

      onSuccess?.();

      showSuccess(
        "Account created!",
        "Please check your email to verify your account.",
      );
    });

    toast({
      title: "Account Created",
      description: "Please check your email to verify your account.",
    });
  };

  const signInOwner = (email: string, password: string) => {
    login({
      variables: {
        input: {
          email,
          password,
        },
      },
    }).then((res) => {
      localStorage.setItem("accessToken", res.data.login.access_token);
      setToken(res.data.login.access_token);

      showSuccess("Welcome back!", "You have successfully signed in.");
    });
  };

  const signOut = () => {
    localStorage.clear();
  };

  const handleVerifyEmail = (token: string) => {
    verifyEmail({
      variables: {
        token,
      },
    }).then(() => {
      showSuccess("Email Verified!");
      navigate("/welcome", { replace: true });
    });

    toast({
      title: "Account Created",
      description: "Please check your email to verify your account.",
    });
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  return {
    user,
    session,
    loading: registering || verifyingEmail || fetchingUser || loggingIn,
    signOut,
    verifyEmail: handleVerifyEmail,
    fetchCurrentUser,
    // signInEmployee,
    signInOwner,
    signUp,
    resetPassword,
    updatePassword,
    isAuthenticated: !!user,
    hasBusinessAssociation,
    // refreshBusinessAssociation,
  };
};
