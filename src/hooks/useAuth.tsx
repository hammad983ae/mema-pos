import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLazyQuery, useMutation, useReactiveVar } from "@apollo/client";
import {
  AuthToken,
  GET_CURRENT_MEMBERSHIPS,
  GET_CURRENT_USER,
  GET_OWNED_BUSINESS,
  LoggedInUser,
  LOGIN,
  Mutation,
  MutationLoginArgs,
  MutationRegisterArgs,
  MutationVerifyEmailArgs,
  Query,
  REGISTER,
  UserBusiness,
  UserMembership,
  VERIFY_EMAIL,
} from "@/graphql";
import { showSuccess } from "@/hooks/useToastMessages.tsx";

export const useAuth = () => {
  const token = useReactiveVar(AuthToken);
  const user = useReactiveVar(LoggedInUser);
  const business = useReactiveVar(UserBusiness);
  const membership = useReactiveVar(UserMembership);
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
  const [getCurrentUser, { loading: fetchingUser }] = useLazyQuery<Query>(
    GET_CURRENT_USER,
    { fetchPolicy: "network-only" },
  );
  const [getCurrentMemberships, { loading: fetchingMemberships }] =
    useLazyQuery<Query>(GET_CURRENT_MEMBERSHIPS, {
      fetchPolicy: "network-only",
    });
  const [getOwnedBusiness, { loading: fetchingBusiness }] = useLazyQuery<Query>(
    GET_OWNED_BUSINESS,
    { fetchPolicy: "network-only" },
  );

  const fetchCurrentUser = () => {
    getCurrentUser().then((res) => {
      LoggedInUser(res.data.getCurrentUser);
      checkBusinessAssociation();
    });
  };

  const checkBusinessAssociation = () => {
    console.log("Checking business association for user");
    getCurrentMemberships()
      .then((res) => {
        if (res.data.getCurrentMemberships.length > 0) {
          UserMembership(res.data.getCurrentMemberships?.[0]);
          fetchAssociatedBusiness();
        }
      })
      .catch(() => {});
  };

  const fetchAssociatedBusiness = () => {
    console.log("Fetching owned business");

    getOwnedBusiness()
      .then((res) => {
        UserBusiness(res.data.getOwnedBusiness);

        localStorage.setItem("businessId", res.data.getOwnedBusiness.id);
      })
      .catch(() => {
        UserBusiness(undefined);
        localStorage.removeItem("businessId");
      });
  };

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
    }).then(() => {
      onSuccess?.();

      showSuccess(
        "Account created!",
        "Please check your email to verify your account.",
      );
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
      AuthToken(res.data.login.access_token);
      localStorage.setItem("accessToken", res.data.login.access_token);

      showSuccess("Welcome back!", "You have successfully signed in.");

      setTimeout(() => {
        fetchCurrentUser();
        checkBusinessAssociation();
      }, 500);
    });
  };

  const signOut = () => {
    LoggedInUser(null);
    AuthToken(null);
    localStorage.clear();
  };

  const handleVerifyEmail = (token: string, onSuccess: () => void) => {
    verifyEmail({
      variables: {
        token,
      },
    }).then(() => {
      showSuccess("Email Verified!");
      onSuccess();
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
    token,
    loading:
      registering ||
      verifyingEmail ||
      fetchingUser ||
      loggingIn ||
      fetchingMemberships ||
      fetchingBusiness,
    signOut,
    verifyEmail: handleVerifyEmail,
    fetchCurrentUser,
    // signInEmployee,
    signInOwner,
    signUp,
    resetPassword,
    updatePassword,
    isAuthenticated: !!user,
    hasBusinessAssociation: !!business,
    business,
    membership,
    refreshBusinessAssociation: checkBusinessAssociation,
  };
};
