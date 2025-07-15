import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface UserRole {
  role: 'business_owner' | 'manager' | 'employee' | 'office';
}

export const useSmartLanding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsChecking(false);
      return;
    }

    const checkUserRoleAndRedirect = async () => {
      try {
        // Get user's business context which includes their role
        const { data: context } = await supabase.rpc('get_user_business_context_secure');
        
        if (!context || context.length === 0) {
          // No business association, redirect to onboarding
          navigate('/onboarding');
          return;
        }

        const userRole = context[0].user_role;
        
        // Smart landing based on role
        switch (userRole) {
          case 'business_owner':
            navigate('/dashboard');
            break;
          case 'manager':
            navigate('/manager');
            break;
          case 'employee':
            navigate('/employee');
            break;
          case 'office':
            navigate('/office');
            break;
          default:
            navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        // Fallback to dashboard
        navigate('/dashboard');
      } finally {
        setIsChecking(false);
      }
    };

    checkUserRoleAndRedirect();
  }, [user, navigate]);

  return { isChecking };
};