import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { pushNotificationService } from "@/services/pushNotificationService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChannelSidebar } from "./chat/ChannelSidebar";
import { MessageItem } from "./chat/MessageItem";
import { MessageInput } from "./chat/MessageInput";
import { ChannelMembersManager } from "./chat/ChannelMembersManager";
import { PendingAnnouncementsManager } from "./chat/PendingAnnouncementsManager";
import { 
  Hash, 
  Users, 
  Settings,
  MoreVertical
} from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  content: string;
  user_id: string;
  channel_id: string;
  created_at: string;
  message_type: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  voice_duration?: number;
  reply_to?: string;
  profiles?: {
    full_name: string;
  };
  reactions?: Array<{ emoji: string; count: number; users: string[] }>;
}

interface Channel {
  id: string;
  name: string;
  description?: string;
  type: string;
  category?: string;
  unread_count?: number;
  last_message?: string;
  last_activity?: string;
}

interface EnhancedTeamChatProps {
  searchQuery: string;
  userRole?: string;
}

export const EnhancedTeamChat = ({ searchQuery, userRole = '' }: EnhancedTeamChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [isChannelAdmin, setIsChannelAdmin] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeChannel = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (user) {
      initializeChat();
      initializePushNotifications();
    }
    return () => {
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
      }
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentChannel && user) {
      checkChannelAdmin();
    }
  }, [currentChannel, user]);

  const checkChannelAdmin = async () => {
    if (!currentChannel || !user) return;

    try {
      const { data } = await supabase
        .from("channel_members")
        .select("role")
        .eq("channel_id", currentChannel.id)
        .eq("user_id", user.id)
        .single();

      setIsChannelAdmin(data?.role === 'admin');
    } catch (error) {
      setIsChannelAdmin(false);
    }
  };

  const initializeChat = async () => {
    try {
      setLoading(true);
      await fetchChannels();
    } catch (error) {
      console.error("Error initializing chat:", error);
      toast({
        title: "Error",
        description: "Failed to initialize chat",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initializePushNotifications = async () => {
    try {
      await pushNotificationService.initialize();
      setNotificationsEnabled(pushNotificationService.hasPermission());

      // Listen for push notification events
      window.addEventListener('pushNotification', handlePushNotificationEvent);
    } catch (error) {
      console.error("Error initializing push notifications:", error);
    }
  };

  const handlePushNotificationEvent = (event: any) => {
    const { data } = event.detail;
    if (data?.channelId && data.channelId === currentChannel?.id) {
      // Refresh messages if notification is for current channel
      fetchMessages(currentChannel.id);
    }
  };

  const fetchChannels = async () => {
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

      // Fetch real channels from database
      const { data: channelsData, error: channelsError } = await supabase
        .from("channels")
        .select(`
          *,
          channel_members!inner(user_id)
        `)
        .eq("business_id", membershipData.business_id)
        .eq("channel_members.user_id", user.id)
        .order("created_at", { ascending: true });

      if (channelsError) {
        console.error("Error fetching channels:", channelsError);
        // Fallback to mock data if no channels exist
        const mockChannels: Channel[] = [
          {
            id: 'general',
            name: 'general',
            description: 'General team discussions',
            type: 'public',
            category: 'general',
            unread_count: 0,
            last_message: 'Welcome to the team chat!',
            last_activity: new Date().toISOString(),
          }
        ];
        setChannels(mockChannels);
        if (mockChannels.length > 0 && !currentChannel) {
          setCurrentChannel(mockChannels[0]);
          fetchMessages(mockChannels[0].id);
        }
        return;
      }

      const formattedChannels: Channel[] = channelsData.map(channel => ({
        id: channel.id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        category: channel.category,
        unread_count: 0, // Will be calculated based on real message data
        last_message: "Start chatting...",
        last_activity: channel.updated_at,
      }));

      setChannels(formattedChannels);
      
      if (formattedChannels.length > 0 && !currentChannel) {
        setCurrentChannel(formattedChannels[0]);
        fetchMessages(formattedChannels[0].id);
      }

    } catch (error) {
      console.error("Error fetching channels:", error);
      // Fallback to mock data
      const mockChannels: Channel[] = [
        {
          id: 'general',
          name: 'general',
          description: 'General team discussions',
          type: 'public',
          category: 'general',
          unread_count: 0,
          last_message: 'Welcome to the team chat!',
          last_activity: new Date().toISOString(),
        }
      ];
      setChannels(mockChannels);
      if (!currentChannel) {
        setCurrentChannel(mockChannels[0]);
        fetchMessages(mockChannels[0].id);
      }
    }
  };

  const fetchMessages = async (channelId: string) => {
    try {
      // Fetch real messages from database with only existing columns
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select(`
          id,
          content,
          user_id,
          channel_id,
          created_at,
          message_type,
          reply_to
        `)
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        setMessages([]);
        setupRealtimeSubscription(channelId);
        return;
      }

      // Get user profiles for messages
      const userIds = [...new Set((messagesData || []).map(msg => msg.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      const formattedMessages: Message[] = (messagesData || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        user_id: msg.user_id,
        channel_id: msg.channel_id,
        created_at: msg.created_at,
        message_type: msg.message_type,
        reply_to: msg.reply_to,
        profiles: profilesMap.get(msg.user_id) || { full_name: 'Unknown User' },
        reactions: []
      }));

      setMessages(formattedMessages);
      setupRealtimeSubscription(channelId);

    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
      setupRealtimeSubscription(channelId);
    }
  };

  const setupRealtimeSubscription = (channelId: string) => {
    // Remove existing subscription
    if (realtimeChannel.current) {
      supabase.removeChannel(realtimeChannel.current);
    }

    // Setup comprehensive real-time subscription
    realtimeChannel.current = supabase
      .channel(`chat_realtime:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Fetch user profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', newMessage.user_id)
            .single();

          const enrichedMessage = {
            ...newMessage,
            profiles: profile || { full_name: 'Unknown User' },
            reactions: []
          };

          setMessages(prev => [...prev, enrichedMessage]);

          // Show notification for messages from other users
          if (newMessage.user_id !== user?.id) {
            pushNotificationService.showLocalNotification({
              title: `New message in #${currentChannel?.name}`,
              body: newMessage.content,
              data: {
                channelId: channelId,
                messageId: newMessage.id,
                senderId: newMessage.user_id,
                type: 'message',
              },
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
          ));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const deletedMessage = payload.old;
          setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id));
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const presenceState = realtimeChannel.current?.presenceState();
        console.log('User presence updated:', presenceState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        toast({
          title: "User joined",
          description: `Someone joined the conversation`,
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          // Track user presence
          await realtimeChannel.current?.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
            channel_id: channelId,
          });
        }
      });
  };

  const sendMessage = async (content?: string, messageType: string = 'text', fileData?: any) => {
    const messageContent = content || newMessage;
    if (!messageContent.trim() && messageType === 'text' || !currentChannel || !user) return;

    try {
      const messageData = {
        content: messageContent,
        user_id: user.id,
        channel_id: currentChannel.id,
        message_type: messageType,
        reply_to: replyingTo?.id,
        ...fileData
      };

      // Insert message into database
      const { error: insertError } = await supabase
        .from("messages")
        .insert([messageData]);

      if (insertError) {
        throw insertError;
      }

      // Clear input and reply state
      setNewMessage("");
      setReplyingTo(null);

      toast({
        title: "Message sent",
        description: messageType === 'voice' ? "Voice message sent" : "Message sent to the team",
      });

    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (file: File) => {
    // In real implementation, upload to Supabase storage
    const mockFileUrl = URL.createObjectURL(file);
    
    await sendMessage(`Shared a file: ${file.name}`, 'file', {
      file_url: mockFileUrl,
      file_name: file.name,
      file_type: file.type
    });
  };

  const handleVoiceMessage = async (audioBlob: Blob, duration: number) => {
    // In real implementation, upload to Supabase storage
    const mockVoiceUrl = URL.createObjectURL(audioBlob);
    
    await sendMessage('', 'voice', {
      file_url: mockVoiceUrl,
      voice_duration: duration
    });
  };

  const handleScheduleUpdate = async (scheduleData: any) => {
    await sendMessage(scheduleData.message, 'schedule', {
      schedule_data: scheduleData
    });
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      // Get current message
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const reactions = message.reactions || [];
      const existingReaction = reactions.find(r => r.emoji === emoji);
      
      let updatedReactions;
      if (existingReaction) {
        // Toggle reaction
        if (existingReaction.users.includes(user.id)) {
          existingReaction.users = existingReaction.users.filter(id => id !== user.id);
          existingReaction.count = Math.max(0, existingReaction.count - 1);
        } else {
          existingReaction.users.push(user.id);
          existingReaction.count += 1;
        }
        
        // Remove reaction if count is 0
        updatedReactions = existingReaction.count === 0 
          ? reactions.filter(r => r.emoji !== emoji)
          : reactions;
      } else {
        // Add new reaction
        updatedReactions = [...reactions, {
          emoji,
          count: 1,
          users: [user.id]
        }];
      }

      // For now, just update local state since reactions column may not exist
      // const { error } = await supabase
      //   .from("messages")
      //   .update({ reactions: updatedReactions })
      //   .eq("id", messageId);

      // if (error) throw error;

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, reactions: updatedReactions }
          : msg
      ));

    } catch (error) {
      console.error("Error updating reaction:", error);
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive",
      });
    }
  };

  const handlePlayVoice = (url: string) => {
    if (playingVoice === url) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingVoice(null);
    } else {
      // Start playing
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(url);
      audio.onended = () => setPlayingVoice(null);
      audio.play();
      audioRef.current = audio;
      setPlayingVoice(url);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      await pushNotificationService.initialize();
      setNotificationsEnabled(pushNotificationService.hasPermission());
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleAnnouncementApproved = async (announcement: any) => {
    if (!currentChannel) return;

    // Find or create announcements channel
    let announcementChannel = channels.find(c => c.name === 'announcements');
    
    if (!announcementChannel) {
      // Create announcements channel if it doesn't exist
      try {
        const { data: membershipData } = await supabase
          .from("user_business_memberships")
          .select("business_id")
          .eq("user_id", user?.id)
          .eq("is_active", true)
          .single();

        if (membershipData) {
          const { data: newChannel, error } = await supabase
            .from("channels")
            .insert({
              business_id: membershipData.business_id,
              name: "announcements",
              description: "Important business announcements",
              type: "public",
              category: "alerts",
              created_by: user?.id
            })
            .select()
            .single();

          if (!error && newChannel) {
            await fetchChannels(); // Refresh channels list
            announcementChannel = {
              id: newChannel.id,
              name: newChannel.name,
              description: newChannel.description,
              type: newChannel.type,
              category: newChannel.category
            };
          }
        }
      } catch (error) {
        console.error("Error creating announcements channel:", error);
      }
    }

    // Post the announcement message
    if (announcementChannel) {
      try {
        await supabase
          .from("messages")
          .insert({
            content: `${announcement.emoji} ${announcement.announcement_text}`,
            user_id: user?.id,
            channel_id: announcementChannel.id,
            message_type: 'announcement'
          });

        toast({
          title: "Announcement Posted!",
          description: "The sales announcement has been posted to the announcements channel.",
        });
      } catch (error) {
        console.error("Error posting announcement:", error);
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading chat...</div>;
  }

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Sidebar - Channels */}
      <ChannelSidebar
        channels={channels}
        currentChannel={currentChannel}
        onChannelSelect={(channel) => {
          setCurrentChannel(channel);
          fetchMessages(channel.id);
        }}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={toggleNotifications}
        onChannelCreated={fetchChannels}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentChannel && (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Hash className="h-5 w-5" />
                  <div>
                    <h3 className="font-semibold">{currentChannel.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentChannel.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <ChannelMembersManager
                    channelId={currentChannel.id}
                    channelName={currentChannel.name}
                    userRole={userRole}
                    isChannelAdmin={isChannelAdmin}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    currentUserId={user!.id}
                    onReply={setReplyingTo}
                    onReaction={handleReaction}
                    onPlayVoice={handlePlayVoice}
                    isPlayingVoice={playingVoice === message.file_url}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <MessageInput
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                onSendMessage={() => sendMessage()}
                onSendFile={handleFileUpload}
                onSendVoice={handleVoiceMessage}
                onSendScheduleUpdate={handleScheduleUpdate}
                replyingTo={replyingTo}
                onClearReply={() => setReplyingTo(null)}
                channelName={currentChannel.name}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};