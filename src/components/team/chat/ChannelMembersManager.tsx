import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, UserMinus, Search, Crown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserRole } from "@/graphql";

interface ChannelMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles?: {
    full_name: string;
  } | null;
}

interface TeamMember {
  user_id: string;
  profiles?: {
    full_name: string;
  } | null;
}

interface ChannelMembersManagerProps {
  channelId: string;
  channelName: string;
  isChannelAdmin?: boolean;
}

export const ChannelMembersManager = ({
  channelId,
  channelName,
  isChannelAdmin = false,
}: ChannelMembersManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [availableMembers, setAvailableMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const canManageMembers =
    user.role === UserRole.BusinessOwner ||
    user.role === UserRole.Manager ||
    isChannelAdmin;

  useEffect(() => {
    if (open) {
      fetchChannelMembers();
      fetchAvailableMembers();
    }
  }, [open, channelId]);

  const fetchChannelMembers = async () => {
    try {
      const { data: channelMembersData, error: membersError } = await supabase
        .from("channel_members")
        .select("*")
        .eq("channel_id", channelId)
        .order("joined_at", { ascending: true });

      if (membersError) throw membersError;

      // Get user profiles separately
      const userIds = channelMembersData?.map((m) => m.user_id) || [];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profilesMap = new Map(
        profilesData?.map((p) => [p.user_id, p]) || [],
      );

      const membersWithProfiles = (channelMembersData || []).map((member) => ({
        ...member,
        profiles: profilesMap.get(member.user_id) || null,
      }));

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error("Error fetching channel members:", error);
    }
  };

  const fetchAvailableMembers = async () => {
    if (!user) return;

    try {
      // Get user's business context
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      // Get all business members
      const { data: businessMembersData, error: businessError } = await supabase
        .from("user_business_memberships")
        .select("user_id")
        .eq("business_id", membershipData.business_id)
        .eq("is_active", true);

      if (businessError) throw businessError;

      // Get user profiles separately
      const businessUserIds = businessMembersData?.map((m) => m.user_id) || [];
      const { data: businessProfilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", businessUserIds);

      const businessProfilesMap = new Map(
        businessProfilesData?.map((p) => [p.user_id, p]) || [],
      );

      const businessMembersWithProfiles = (businessMembersData || []).map(
        (member) => ({
          user_id: member.user_id,
          profiles: businessProfilesMap.get(member.user_id) || null,
        }),
      );

      // Filter out members already in the channel
      const memberUserIds = new Set(members.map((m) => m.user_id));
      const available = businessMembersWithProfiles.filter(
        (member) => !memberUserIds.has(member.user_id),
      );

      setAvailableMembers(available);
    } catch (error) {
      console.error("Error fetching available members:", error);
    }
  };

  const addMemberToChannel = async (userId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase.from("channel_members").insert({
        channel_id: channelId,
        user_id: userId,
        role: "member",
      });

      if (error) throw error;

      toast({
        title: "Member Added",
        description: "Successfully added member to the channel",
      });

      // Refresh both lists
      await fetchChannelMembers();
      await fetchAvailableMembers();
    } catch (error) {
      console.error("Error adding member:", error);
      toast({
        title: "Error",
        description: "Failed to add member to channel",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeMemberFromChannel = async (memberId: string, userId: string) => {
    if (userId === user?.id) {
      toast({
        title: "Cannot Remove Yourself",
        description: "You cannot remove yourself from the channel",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from("channel_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Member Removed",
        description: "Successfully removed member from the channel",
      });

      // Refresh both lists
      await fetchChannelMembers();
      await fetchAvailableMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: "Failed to remove member from channel",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAvailableMembers = availableMembers.filter((member) =>
    member.profiles?.full_name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Users className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Members - #{channelName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Members */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              Current Members
              <Badge variant="secondary">{members.length}</Badge>
            </h3>
            <ScrollArea className="h-48 border rounded-lg p-3">
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {member.profiles?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {member.profiles?.full_name || "Unknown User"}
                        </span>
                        {member.role === "admin" && (
                          <Crown className="h-3 w-3 text-warning" />
                        )}
                      </div>
                    </div>
                    {canManageMembers && member.user_id !== user?.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          removeMemberFromChannel(member.id, member.user_id)
                        }
                        disabled={loading}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Add Members */}
          {canManageMembers && (
            <div>
              <h3 className="font-semibold mb-3">Add Members</h3>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search team members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <ScrollArea className="h-48 border rounded-lg p-3">
                  <div className="space-y-2">
                    {filteredAvailableMembers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {searchQuery
                          ? "No members found matching your search"
                          : "All team members are already in this channel"}
                      </p>
                    ) : (
                      filteredAvailableMembers.map((member) => (
                        <div
                          key={member.user_id}
                          className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {member.profiles?.full_name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {member.profiles?.full_name || "Unknown User"}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addMemberToChannel(member.user_id)}
                            disabled={loading}
                            className="h-8 w-8 p-0 text-success hover:text-success"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
