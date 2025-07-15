import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Reply, 
  Smile, 
  Play, 
  Pause, 
  FileText, 
  Image as ImageIcon,
  Download 
} from "lucide-react";
import { format } from "date-fns";

interface MessageItemProps {
  message: {
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    message_type: string;
    profiles?: { full_name: string };
    file_url?: string;
    file_name?: string;
    file_type?: string;
    voice_duration?: number;
    reply_to?: string;
    reactions?: Array<{ emoji: string; count: number; users: string[] }>;
  };
  currentUserId: string;
  onReply: (message: any) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onPlayVoice: (url: string) => void;
  isPlayingVoice: boolean;
}

export const MessageItem = ({ 
  message, 
  currentUserId, 
  onReply, 
  onReaction, 
  onPlayVoice,
  isPlayingVoice 
}: MessageItemProps) => {
  const [showReactions, setShowReactions] = useState(false);
  
  const isOwnMessage = message.user_id === currentUserId;
  const reactions = ['👍', '❤️', '😂', '😯', '😢', '😡'];

  const renderFilePreview = () => {
    if (!message.file_url) return null;

    if (message.file_type?.startsWith('image/')) {
      return (
        <div className="mt-2 max-w-xs">
          <img 
            src={message.file_url} 
            alt={message.file_name}
            className="rounded-lg border max-h-48 object-cover"
          />
        </div>
      );
    }

    return (
      <div className="mt-2 p-3 bg-muted rounded-lg border max-w-xs">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium truncate">{message.file_name}</span>
          <Button variant="ghost" size="sm" asChild>
            <a href={message.file_url} download={message.file_name}>
              <Download className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>
    );
  };

  const renderVoiceMessage = () => {
    if (message.message_type !== 'voice' || !message.file_url) return null;

    return (
      <div className="mt-2 p-3 bg-muted rounded-lg border max-w-xs">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onPlayVoice(message.file_url!)}
          >
            {isPlayingVoice ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">
              Voice message • {message.voice_duration || 0}s
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex items-start space-x-3 group relative ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">
          {message.profiles?.full_name?.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className={`flex-1 min-w-0 ${isOwnMessage ? 'text-right' : ''}`}>
        <div className="flex items-center space-x-2 mb-1">
          <p className="text-sm font-medium">
            {message.profiles?.full_name || 'Unknown'}
          </p>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
          {message.reply_to && (
            <Badge variant="outline" className="text-xs">
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Badge>
          )}
        </div>
        
        <div className={`max-w-md ${isOwnMessage ? 'ml-auto' : ''}`}>
          {message.content && (
            <p className="text-sm break-words">{message.content}</p>
          )}
          
          {renderFilePreview()}
          {renderVoiceMessage()}
          
          {/* Message reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction, index) => (
                <button
                  key={index}
                  onClick={() => onReaction(message.id, reaction.emoji)}
                  className="flex items-center space-x-1 px-2 py-1 bg-muted hover:bg-muted/80 rounded-full text-xs transition-colors"
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Message actions */}
        <div className={`opacity-0 group-hover:opacity-100 transition-opacity mt-1 ${isOwnMessage ? 'text-right' : ''}`}>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReactions(!showReactions)}
              className="h-6 w-6 p-0"
            >
              <Smile className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(message)}
              className="h-6 w-6 p-0"
            >
              <Reply className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Quick reactions */}
          {showReactions && (
            <div className="flex space-x-1 mt-1 p-2 bg-card border rounded-lg shadow-lg">
              {reactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReaction(message.id, emoji);
                    setShowReactions(false);
                  }}
                  className="text-lg hover:bg-muted p-1 rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};