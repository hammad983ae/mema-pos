import { useState, useEffect } from "react";
import { EmployeeTimeClock } from "@/components/timeclock/EmployeeTimeClock";
import { ManagerTimeClockDashboard } from "@/components/timeclock/ManagerTimeClockDashboard";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Users, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/graphql";

const TimeClock = () => {
  const { user } = useAuth();
  const [paymentType, setPaymentType] = useState<string>("hourly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const { data: membership } = await supabase
        .from("user_business_memberships")
        .select("role, commission_type")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (membership) {
        setPaymentType(membership.commission_type || "hourly");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Please log in to access the time clock
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is manager or owner, show both views in tabs
  if (user.role === UserRole.BusinessOwner || user.role === UserRole.Manager) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <Tabs defaultValue="employee" className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Time Clock</h1>
              <TabsList>
                <TabsTrigger value="employee" className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  My Time Clock
                </TabsTrigger>
                <TabsTrigger value="manager" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Team Management
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="employee">
              <EmployeeTimeClock />
            </TabsContent>

            <TabsContent value="manager">
              <ManagerTimeClockDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Commission-only employees don't need time tracking
  if (paymentType === "commission") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Time Clock</h1>
            <p className="text-muted-foreground">Commission-based employee</p>
          </div>
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Commission-Based Employee</CardTitle>
              <CardDescription>
                You're paid on commission, so time tracking isn't required for
                your role.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Your earnings are based on sales performance. Check your
                commission reports in the analytics section.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Regular employees only see their time clock
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Time Clock</h1>
          <p className="text-muted-foreground">
            {paymentType === "both"
              ? "Track your hours for hourly pay"
              : "Track your work hours"}
          </p>
        </div>
        <EmployeeTimeClock />
      </div>
    </div>
  );
};

export default TimeClock;
