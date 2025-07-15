import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CreateChannelDialog } from "./CreateChannelDialog";
import { 
  Hash, 
  Bell, 
  BellOff, 
  Plus, 
  Search,
  Calendar,
  Users,
  AlertTriangle,
  MessageSquare,
  Megaphone,
  HelpCircle
} from "lucide-react";
import { format } from "date-fns";

interface Channel {
  id: string;
  name: string;
  description?: string;
  type: string;
  unread_count?: number;
  last_message?: string;
  last_activity?: string;
  category?: string;
}

interface ChannelSidebarProps {
  channels: Channel[];
  currentChannel: Channel | null;
  onChannelSelect: (channel: Channel) => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onChannelCreated: () => void;
}

export const ChannelSidebar = ({ 
  channels, 
  currentChannel, 
  onChannelSelect, 
  notificationsEnabled, 
  onToggleNotifications,
  onChannelCreated
}: ChannelSidebarProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const getChannelIcon = (channel: Channel) => {
    switch (channel.category) {
      case 'schedule':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'alerts':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'team':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'announcements':
        return <Megaphone className="h-4 w-4 text-purple-500" />;
      case 'support':
        return <HelpCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Hash className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Filter channels based on search query
  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (channel.description && channel.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupedChannels = filteredChannels.reduce((acc, channel) => {
    const category = channel.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(channel);
    return acc;
  }, {} as Record<string, Channel[]>);

  return (
    <div className="w-64 bg-muted/20 border-r flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Channels</h3>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onToggleNotifications}
            >
              {notificationsEnabled ? (
                <Bell className="h-4 w-4 text-success" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search channels..."
            className="pl-7 h-8 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {Object.entries(groupedChannels).map(([category, categoryChannels]) => (
            <div key={category}>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
                {category}
              </h4>
              <div className="space-y-1">
                {categoryChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted/50 transition-colors ${
                      currentChannel?.id === channel.id ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => onChannelSelect(channel)}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      {getChannelIcon(channel)}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{channel.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {channel.last_message}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-1">
                      {channel.unread_count && channel.unread_count > 0 && (
                        <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {channel.unread_count > 99 ? '99+' : channel.unread_count}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {channel.last_activity && format(new Date(channel.last_activity), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <CreateChannelDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onChannelCreated={() => {
          onChannelCreated();
          setShowCreateDialog(false);
        }}
      />
    </div>
  );
};