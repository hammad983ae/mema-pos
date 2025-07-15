import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Send, 
  Bot, 
  User, 
  UserCircle, 
  Clock, 
  AlertCircle,
  CheckCircle,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender_type: string; // Allow any string from database
  sender_id?: string;
  is_ai_generated: boolean;
  created_at: string;
  ai_confidence?: number;
}

interface Conversation {
  id: string;
  customer_id: string;
  status: string;
  priority: string;
  category?: string;
  created_at: string;
  customers?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

interface CustomerServiceChatProps {
  conversationId?: string;
  onClose?: () => void;
}

export const CustomerServiceChat = ({ conversationId, onClose }: CustomerServiceChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
      fetchMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversation = async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from("customer_service_conversations")
        .select(`
          *,
          customers(first_name, last_name, email, phone)
        `)
        .eq("id", conversationId)
        .single();

      if (error) throw error;
      setConversation(data);
    } catch (error: any) {
      console.error("Error fetching conversation:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !conversation) return;

    setLoading(true);
    try {
      if (aiMode) {
        // Send to AI
        const response = await supabase.functions.invoke('ai-customer-service', {
          body: {
            action: 'chat',
            message: newMessage,
            conversationId: conversationId,
            customerId: conversation.customer_id,
            businessId: await getUserBusinessId()
          }
        });

        if (response.error) throw response.error;

        // Refresh messages to show both user message and AI response
        await fetchMessages();
      } else {
        // Send as human agent
        await supabase.from('chat_messages').insert({
          conversation_id: conversationId,
          content: newMessage,
          sender_type: 'agent',
          sender_id: user?.id,
          is_ai_generated: false,
        });

        // Update conversation timestamp
        await supabase
          .from('customer_service_conversations')
          .update({ 
            last_message_at: new Date().toISOString(),
            assigned_to: user?.id 
          })
          .eq('id', conversationId);

        await fetchMessages();
      }

      setNewMessage("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserBusinessId = async () => {
    try {
      const { data: context, error } = await supabase.rpc('get_user_business_context');
      if (error) throw error;
      return context && context.length > 0 ? context[0].business_id : null;
    } catch (error) {
      console.error("Error fetching business ID:", error);
      return null;
    }
  };

  const updateConversationStatus = async (status: string) => {
    if (!conversationId) return;

    try {
      const { error } = await supabase
        .from("customer_service_conversations")
        .update({ 
          status,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null 
        })
        .eq("id", conversationId);

      if (error) throw error;
      
      setConversation(prev => prev ? { ...prev, status } : null);
      
      toast({
        title: "Status Updated",
        description: `Conversation marked as ${status}`,
      });
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'resolved': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  if (!conversation) {
    return (
      <Card className="flex items-center justify-center h-96">
        <CardContent>
          <p className="text-muted-foreground">Select a conversation to start chatting</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              {conversation.customers 
                ? `${conversation.customers.first_name} ${conversation.customers.last_name}`
                : "Anonymous Customer"
              }
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {conversation.customers?.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getPriorityColor(conversation.priority)}>
              {conversation.priority}
            </Badge>
            <Badge variant={getStatusColor(conversation.status)}>
              {conversation.status}
            </Badge>
            {conversation.category && (
              <Badge variant="outline">{conversation.category}</Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className={`h-4 w-4 ${aiMode ? 'text-blue-500' : 'text-muted-foreground'}`} />
            <span>AI Mode</span>
            <Button
              variant={aiMode ? "default" : "outline"}
              size="sm"
              onClick={() => setAiMode(!aiMode)}
            >
              {aiMode ? "ON" : "OFF"}
            </Button>
          </div>
          
          {conversation.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateConversationStatus('resolved')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Resolve
            </Button>
          )}
          
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ← Back
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4 p-4">
        <ScrollArea className="flex-1 space-y-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_type === 'customer' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender_type === 'customer'
                      ? 'bg-muted'
                      : message.sender_type === 'ai'
                      ? 'bg-blue-100 dark:bg-blue-900'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.sender_type === 'customer' && (
                      <User className="h-3 w-3" />
                    )}
                    {message.sender_type === 'ai' && (
                      <Bot className="h-3 w-3" />
                    )}
                    {message.sender_type === 'agent' && (
                      <UserCircle className="h-3 w-3" />
                    )}
                    <span className="text-xs font-medium">
                      {message.sender_type === 'customer' ? 'Customer' :
                       message.sender_type === 'ai' ? 'AI Assistant' : 'Agent'}
                    </span>
                    <span className="text-xs opacity-70">
                      {format(new Date(message.created_at), 'HH:mm')}
                    </span>
                    {message.is_ai_generated && message.ai_confidence && (
                      <span className="text-xs opacity-70">
                        ({Math.round(message.ai_confidence * 100)}%)
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={aiMode ? "Type a message (AI will respond)..." : "Type your response..."}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={loading || conversation.status === 'resolved'}
          />
          <Button 
            onClick={sendMessage} 
            disabled={loading || !newMessage.trim() || conversation.status === 'resolved'}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {aiMode && (
          <p className="text-xs text-muted-foreground text-center">
            <Bot className="h-3 w-3 inline mr-1" />
            AI Assistant is active - responses will be generated automatically
          </p>
        )}
      </CardContent>
    </Card>
  );
};