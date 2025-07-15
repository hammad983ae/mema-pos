import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface PendingAnnouncement {
  id: string;
  sale_amount: number;
  announcement_text: string;
  emoji: string;
  status: string;
  created_at: string;
  order_id: string;
  title?: string;
  custom_message?: string;
  salesperson_ids: string[];
}

interface PendingAnnouncementsManagerProps {
  userRole: string;
  onAnnouncementApproved: (announcement: PendingAnnouncement) => void;
}

export const PendingAnnouncementsManager = ({ 
  userRole, 
  onAnnouncementApproved 
}: PendingAnnouncementsManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingAnnouncements, setPendingAnnouncements] = useState<PendingAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && (userRole === 'business_owner' || userRole === 'manager')) {
      fetchPendingAnnouncements();
      setupRealtimeSubscription();
    }
  }, [user, userRole]);

  const fetchPendingAnnouncements = async () => {
    if (!user) return;

    try {
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      const { data, error } = await supabase
        .from("pending_announcements")
        .select("*")
        .eq("business_id", membershipData.business_id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingAnnouncements(data || []);
    } catch (error) {
      console.error("Error fetching pending announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('pending_announcements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pending_announcements',
        },
        () => {
          fetchPendingAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleApproveAnnouncement = async (announcement: PendingAnnouncement) => {
    try {
      // Get business_id first
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) throw new Error("User not associated with any business");

      // Update pending announcement status
      const { error } = await supabase
        .from("pending_announcements")
        .update({
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", announcement.id);

      if (error) throw error;

      // Find the Announcements channel
      const { data: announcementChannel } = await supabase
        .from("channels")
        .select("id")
        .eq("business_id", membershipData.business_id)
        .eq("name", "Announcements")
        .single();

      // Post to announcements channel if it exists
      if (announcementChannel) {
        // Format the announcement message with proper structure
        let messageContent = "";
        
        // Add title if available
        if (announcement.title) {
          messageContent += `**${announcement.title}** ${announcement.emoji}\n\n`;
        } else {
          messageContent += `${announcement.emoji} `;
        }
        
        // Get employee names
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("full_name")
          .in("user_id", announcement.salesperson_ids);
        
        const employeeNames = profilesData?.map(p => p.full_name).join(" & ") || "Team Member";
        messageContent += `**${employeeNames}**\n\n`;
        
        // Add custom message if available
        if (announcement.custom_message) {
          messageContent += announcement.custom_message;
        } else {
          messageContent += announcement.announcement_text;
        }

        await supabase
          .from("messages")
          .insert({
            content: messageContent,
            user_id: user?.id,
            channel_id: announcementChannel.id,
            message_type: 'announcement'
          });
      }

      // Remove from pending list
      setPendingAnnouncements(prev => 
        prev.filter(a => a.id !== announcement.id)
      );

      // Notify parent component
      onAnnouncementApproved(announcement);

      toast({
        title: "Announcement Approved",
        description: "The sales announcement has been approved and posted to the announcements channel.",
      });
    } catch (error) {
      console.error("Error approving announcement:", error);
      toast({
        title: "Error",
        description: "Failed to approve announcement",
        variant: "destructive",
      });
    }
  };

  const handleRejectAnnouncement = async (announcementId: string) => {
    try {
      const { error } = await supabase
        .from("pending_announcements")
        .update({
          status: "rejected",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", announcementId);

      if (error) throw error;

      // Remove from pending list
      setPendingAnnouncements(prev => 
        prev.filter(a => a.id !== announcementId)
      );

      toast({
        title: "Announcement Rejected",
        description: "The sales announcement has been rejected.",
      });
    } catch (error) {
      console.error("Error rejecting announcement:", error);
      toast({
        title: "Error",
        description: "Failed to reject announcement",
        variant: "destructive",
      });
    }
  };

  if (userRole !== 'business_owner' && userRole !== 'manager') {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (pendingAnnouncements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No pending announcements</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Announcements
          <Badge variant="secondary">{pendingAnnouncements.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingAnnouncements.map((announcement) => (
          <div 
            key={announcement.id} 
            className="border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-success" />
                <div className="flex flex-col">
                  {announcement.title && (
                    <span className="font-bold text-lg">{announcement.title}</span>
                  )}
                  <span className="font-semibold">
                    ${announcement.sale_amount.toFixed(2)} Sale
                  </span>
                </div>
                <span className="text-2xl">{announcement.emoji}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {format(new Date(announcement.created_at), 'PPp')}
              </span>
            </div>

            <div className="bg-muted/50 rounded p-3 space-y-2">
              <p className="text-sm font-medium">Announcement:</p>
              <p className="text-sm">{announcement.announcement_text}</p>
              {announcement.custom_message && (
                <>
                  <p className="text-sm font-medium mt-3">Custom Message:</p>
                  <p className="text-sm">{announcement.custom_message}</p>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleApproveAnnouncement(announcement)}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRejectAnnouncement(announcement.id)}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};