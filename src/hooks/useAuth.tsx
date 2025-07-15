import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasBusinessAssociation, setHasBusinessAssociation] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check business association when user signs in
        if (session?.user) {
          setTimeout(() => {
            checkBusinessAssociation(session.user.id);
          }, 0);
        } else {
          setHasBusinessAssociation(false);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkBusinessAssociation(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkBusinessAssociation = async (userId: string) => {
    try {
      console.log('Checking business association for user:', userId);
      const { data, error } = await supabase
        .from('user_business_memberships')
        .select('id, business_id, role')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);
      
      console.log('Business association query result:', { data, error });
      const hasAssociation = !!data && data.length > 0 && !error;
      console.log('Has business association:', hasAssociation);
      setHasBusinessAssociation(hasAssociation);
    } catch (error) {
      console.error('Error checking business association:', error);
      setHasBusinessAssociation(false);
    }
  };

  const refreshBusinessAssociation = async () => {
    if (user) {
      await checkBusinessAssociation(user.id);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive",
      });
    }
    return { error };
  };

  const signInEmployee = async (username: string, pin: string) => {
    try {
      // Employee login: username + PIN
      // Get profile with pos_pin field
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, email, pos_pin')
        .eq('username', username.toLowerCase())
        .maybeSingle();
      
      if (profileError || !profile) {
        toast({
          title: "Sign In Error",
          description: "Invalid username or PIN",
          variant: "destructive",
        });
        return { data: null, error: { message: 'Invalid username or PIN' } };
      }

      // Check rate limiting before attempting login
      const { data: rateLimitCheck, error: rateLimitError } = await supabase
        .rpc('check_pin_rate_limit', { p_user_id: profile.user_id });

      if (rateLimitError || !rateLimitCheck) {
        // Log failed attempt
        await supabase.rpc('log_pin_attempt', { 
          p_user_id: profile.user_id, 
          p_success: false 
        });

        toast({
          title: "Account Locked",
          description: "Too many failed attempts. Please try again in 1 hour.",
          variant: "destructive",
        });
        return { data: null, error: { message: 'Account temporarily locked' } };
      }

      // Verify PIN directly (stored as plain text)
      if (!profile.pos_pin || pin !== profile.pos_pin) {
        await supabase.rpc('log_pin_attempt', { 
          p_user_id: profile.user_id, 
          p_success: false 
        });

        toast({
          title: "Sign In Error",
          description: "Invalid username or PIN",
          variant: "destructive",
        });
        return { data: null, error: { message: 'Invalid username or PIN' } };
      }
      
      // Use email and PIN for Supabase auth (PIN stored as password)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: pin,
      });

      // Log successful attempt
      await supabase.rpc('log_pin_attempt', { 
        p_user_id: profile.user_id, 
        p_success: !error 
      });
      
      if (error) {
        toast({
          title: "Sign In Error",
          description: "Authentication failed. Please try again.",
          variant: "destructive",
        });
      }
      
      return { data, error };
    } catch (err: any) {
      toast({
        title: "Sign In Error",
        description: "An error occurred during sign in",
        variant: "destructive",
      });
      return { data: null, error: { message: err.message } };
    }
  };

  const signInOwner = async (email: string, password: string) => {
    // Owner login: email + password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive",
      });
    }
    
    return { data, error };
  };

  const signUp = async (
    email: string, 
    password: string, 
    metadata?: { 
      full_name?: string; 
      role?: string; 
      business_name?: string;
      phone?: string;
      username?: string;
      pos_pin?: string;
    },
    redirectUrl?: string
  ) => {
    const onboardingUrl = `${window.location.origin}/onboarding`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl || onboardingUrl,
        data: metadata || {}
      }
    });
    
    if (error) {
      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.message.includes('duplicate key') && error.message.includes('username')) {
        errorMessage = "This username is already taken within your business. Please choose a different one.";
      } else if (error.message.includes('User already registered')) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      }
      
      toast({
        title: "Sign Up Error",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account Created",
        description: "Please check your email to verify your account.",
      });
    }
    
    return { data, error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { error };
  };

  return {
    user,
    session,
    loading,
    signOut,
    signInEmployee,
    signInOwner,
    signUp,
    resetPassword,
    updatePassword,
    isAuthenticated: !!user,
    hasBusinessAssociation,
    refreshBusinessAssociation,
  };
};