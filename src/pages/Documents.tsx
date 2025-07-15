import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { DocumentManager } from "@/components/documents/DocumentManager";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const Documents = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>("");
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchUserRole();
    }
  }, [user, loading, navigate]);

  const fetchUserRole = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_business_memberships")
        .select("role")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        navigate("/business/setup");
        return;
      }

      setUserRole(data.role);
    } catch (error) {
      console.error("Error:", error);
      navigate("/business/setup");
    } finally {
      setRoleLoading(false);
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <DocumentManager userRole={userRole} />
      </div>
    </div>
  );
};

export default Documents;