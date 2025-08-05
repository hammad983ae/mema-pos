import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireBusiness?: boolean;
}

export const AuthGuard = ({
  children,
  requireAuth = true,
  requireBusiness = false,
}: AuthGuardProps) => {
  const { user, loading, business, hasBusinessAssociation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const currentPath = location.pathname;

    // If auth is required but user is not authenticated
    if (requireAuth && !user) {
      if (currentPath !== "/auth") {
        navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
      }
      return;
    }

    // If business association is required but user doesn't have one
    if (
      requireAuth &&
      user &&
      requireBusiness &&
      (!hasBusinessAssociation || !business?.address)
    ) {
      if (currentPath !== "/onboarding") {
        navigate("/onboarding");
      }
      return;
    }

    // If user is authenticated with business and trying to access auth pages, redirect to dashboard
    if (user && hasBusinessAssociation && location.pathname === "/auth") {
      if (!user.isEmailVerified) {
        navigate("/auth");
      } else {
        navigate("/dashboard");
      }
      return;
    }

    // If user is authenticated without business and trying to access auth pages, allow it
    // This lets them log out or switch accounts
    if (user && !hasBusinessAssociation && location.pathname === "/auth") {
      return; // Allow access to auth page
    }

    // If user has no business but trying to access protected routes, redirect to onboarding
    if (
      user &&
      (!hasBusinessAssociation || !business?.address) &&
      requireBusiness &&
      location.pathname !== "/onboarding" &&
      location.pathname !== "/auth"
    ) {
      navigate("/onboarding");
      return;
    }
  }, [
    user,
    loading,
    hasBusinessAssociation,
    requireAuth,
    requireBusiness,
    location.pathname,
  ]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, don't render children
  if (requireAuth && !user) {
    return null;
  }

  // If business is required but user doesn't have one, don't render children
  if (requireAuth && user && requireBusiness && !hasBusinessAssociation) {
    return null;
  }

  return <>{children}</>;
};
