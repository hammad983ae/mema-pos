import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TeamChat } from "@/components/team/TeamChat";
import { TeamSchedule } from "@/components/team/TeamSchedule";
import { TeamPerformance } from "@/components/team/TeamPerformance";
import { TeamDirectory } from "@/components/team/TeamDirectory";
import { CommissionSettings } from "@/components/team/CommissionSettings";
import { TaskManager } from "@/components/team/TaskManager";
import { PendingAnnouncementsManager } from "@/components/team/chat/PendingAnnouncementsManager";
import { TeamSettings } from "@/components/team/TeamSettings";
import { AddMemberDialog } from "@/components/team/AddMemberDialog";
import { NotificationsDialog } from "@/components/team/NotificationsDialog";
import { SmartScheduleBuilder } from "@/components/team/SmartScheduleBuilder";
import { OpenerDashboard } from "@/components/team/OpenerDashboard";
import { UpsellerDashboard } from "@/components/team/UpsellerDashboard";
import { PositionTypeSelector } from "@/components/team/PositionTypeSelector";
import { AnnouncementTemplates } from "@/components/team/AnnouncementTemplates";
import { 
  MessageSquare, 
  Calendar, 
  Users, 
  TrendingUp,
  Bell,
  Settings,
  Search,
  Plus,
  Loader2
} from "lucide-react";

const Team = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("schedule");
  const [searchQuery, setSearchQuery] = useState("");
  const [openAddMember, setOpenAddMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    scheduledShifts: 0,
    avgPerformance: 0,
    pendingNotifications: 0,
  });
  const [userRole, setUserRole] = useState<string>("");
  const [userPositionType, setUserPositionType] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchTeamData();
    }
  }, [user]);

  useEffect(() => {
    // Check if URL contains action=add-member parameter
    if (searchParams.get('action') === 'add-member') {
      setOpenAddMember(true);
    }
  }, [searchParams]);

  const fetchTeamData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's business context and role (get first active membership)
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id, role")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (!membershipData) {
        throw new Error("User not associated with any business");
      }

      setUserRole(membershipData.role);

      // Get user's position type (opener/upseller)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("position_type")
        .eq("user_id", user.id)
        .single();

      if (profileData?.position_type) {
        setUserPositionType(profileData.position_type);
      }

      // Get all team members for this business
      const { data: teamMembers } = await supabase
        .from("user_business_memberships")
        .select(`
          *,
          profiles(full_name, phone, email, position)
        `)
        .eq("business_id", membershipData.business_id)
        .eq("is_active", true);

      // Get today's schedules
      const today = new Date().toISOString().split('T')[0];
      const { data: todaySchedules } = await supabase
        .from("employee_schedules")
        .select("*")
        .eq("business_id", membershipData.business_id)
        .eq("schedule_date", today);

      // Calculate team statistics
      const totalMembers = teamMembers?.length || 0;
      const activeMembers = teamMembers?.filter(member => member.is_active)?.length || 0;
      const scheduledShifts = todaySchedules?.length || 0;

      // Get recent sales performance for avg calculation
      const { data: recentOrders } = await supabase
        .from("orders")
        .select(`
          total,
          user_id,
          stores!inner(business_id)
        `)
        .eq("stores.business_id", membershipData.business_id)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Calculate average performance (simplified)
      const avgPerformance = recentOrders?.length ? 
        Math.min((recentOrders.length / (totalMembers * 7)) * 100, 100) : 0;

      setTeamStats({
        totalMembers,
        activeMembers,
        scheduledShifts,
        avgPerformance: Math.round(avgPerformance),
        pendingNotifications: Math.floor(Math.random() * 5), // Simulated for now
      });

    } catch (error: any) {
      console.error("Error fetching team data:", error);
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: "Team Members",
      value: teamStats.totalMembers.toString(),
      change: `${teamStats.activeMembers} active`,
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Schedule Notifications",
      value: teamStats.pendingNotifications.toString(),
      change: "Pending updates",
      icon: MessageSquare,
      color: "text-success"
    },
    {
      title: "Today's Shifts",
      value: teamStats.scheduledShifts.toString(),
      change: "Scheduled today",
      icon: Calendar,
      color: "text-warning"
    },
    {
      title: "Team Performance",
      value: `${teamStats.avgPerformance}%`,
      change: "Weekly average",
      icon: TrendingUp,
      color: "text-success"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading team data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex flex-col sm:flex-row h-auto sm:h-16 items-start sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0">
          <div className="flex items-center space-x-4">
            <BackButton to="/dashboard" label="Back to Dashboard" />
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Team Management</h1>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <MessageSquare className="h-3 w-3 mr-1" />
              Real-time
            </Badge>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <div className="flex space-x-2">
              <NotificationsDialog />
              <TeamSettings userRole={userRole} />
              <AddMemberDialog 
                userRole={userRole} 
                onMemberAdded={fetchTeamData}
                open={openAddMember}
                onOpenChange={setOpenAddMember}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      <p className={`text-sm ${stat.color} mt-1`}>
                        {stat.change}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg bg-pos-accent`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-8 lg:w-[960px] min-w-[800px]">
            <TabsTrigger value="schedule" className="text-xs sm:text-sm">Schedule</TabsTrigger>
            {(userRole === 'business_owner' || userRole === 'manager') && (
              <TabsTrigger value="smart-schedule" className="text-xs sm:text-sm">Smart Builder</TabsTrigger>
            )}
            <TabsTrigger value="tasks" className="text-xs sm:text-sm">Tasks</TabsTrigger>
            <TabsTrigger value="directory" className="text-xs sm:text-sm">Directory</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs sm:text-sm">Performance</TabsTrigger>
            <TabsTrigger value="commission" className="text-xs sm:text-sm">Commission</TabsTrigger>
            <TabsTrigger value="chat" className="text-xs sm:text-sm">Chat</TabsTrigger>
            {(userRole === 'business_owner' || userRole === 'manager') && (
              <TabsTrigger value="announcements" className="text-xs sm:text-sm">Announcements</TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="schedule" className="space-y-6">
          {/* Business owners and managers see full schedule, employees see role-specific dashboards */}
          {userRole === 'business_owner' || userRole === 'manager' ? (
            <TeamSchedule userRole={userRole} />
          ) : userPositionType === 'opener' ? (
            <OpenerDashboard />
          ) : userPositionType === 'upseller' ? (
            <UpsellerDashboard />
          ) : userPositionType === "" ? (
            <PositionTypeSelector onPositionSet={() => window.location.reload()} />
          ) : (
            <TeamSchedule userRole={userRole} />
          )}
        </TabsContent>

        {(userRole === 'business_owner' || userRole === 'manager') && (
          <TabsContent value="smart-schedule" className="space-y-6">
            <SmartScheduleBuilder userRole={userRole} />
          </TabsContent>
        )}

        <TabsContent value="tasks" className="space-y-6">
          <TaskManager userRole={userRole} />
        </TabsContent>

        <TabsContent value="directory" className="space-y-6">
            <TeamDirectory searchQuery={searchQuery} userRole={userRole} />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <TeamPerformance userRole={userRole} />
          </TabsContent>

          <TabsContent value="commission" className="space-y-6">
            <CommissionSettings />
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <TeamChat searchQuery={searchQuery} userRole={userRole} />
              </div>
              {(userRole === 'business_owner' || userRole === 'manager') && (
                <div className="lg:col-span-1">
                  <PendingAnnouncementsManager 
                    userRole={userRole}
                    onAnnouncementApproved={(announcement) => {
                      // The announcement handling is done in the TeamChat component
                      console.log("Announcement approved:", announcement);
                    }}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          {(userRole === 'business_owner' || userRole === 'manager') && (
            <TabsContent value="announcements" className="space-y-6">
              <AnnouncementTemplates userRole={userRole} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Team;