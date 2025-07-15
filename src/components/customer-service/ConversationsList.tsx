import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter,
  Clock,
  AlertCircle,
  Bot,
  User
} from "lucide-react";
import { format } from "date-fns";

interface Conversation {
  id: string;
  customer_id: string;
  status: string;
  priority: string;
  category?: string;
  created_at: string;
  last_message_at: string;
  assigned_to?: string;
  ai_summary?: string;
  customers?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  _count?: {
    unread_messages: number;
  };
}

interface ConversationsListProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string;
  onNewConversation: () => void;
}

export const ConversationsList = ({ 
  onSelectConversation, 
  selectedConversationId,
  onNewConversation 
}: ConversationsListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    fetchConversations();
  }, [statusFilter, priorityFilter]);

  const fetchConversations = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Get user's business context using the helper function
      const { data: businessContext } = await supabase
        .rpc("get_user_business_context_secure");

      if (!businessContext || businessContext.length === 0) {
        // For demo purposes, show empty state instead of error
        setConversations([]);
        setLoading(false);
        return;
      }

      const businessId = businessContext[0].business_id;

      let query = supabase
        .from("customer_service_conversations")
        .select(`
          *,
          customers(first_name, last_name, email, phone)
        `)
        .eq("business_id", businessId)
        .order("last_message_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (priorityFilter !== "all") {
        query = query.eq("priority", priorityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    
    const customerName = conv.customers 
      ? `${conv.customers.first_name} ${conv.customers.last_name}`.toLowerCase()
      : "";
    const customerEmail = conv.customers?.email?.toLowerCase() || "";
    const category = conv.category?.toLowerCase() || "";
    
    return customerName.includes(searchTerm.toLowerCase()) ||
           customerEmail.includes(searchTerm.toLowerCase()) ||
           category.includes(searchTerm.toLowerCase());
  });

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

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Customer Service
          </CardTitle>
          <Button onClick={onNewConversation} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Chat
          </Button>
        </div>
        
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="space-y-2 p-4">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No conversations found</p>
                <Button variant="outline" onClick={onNewConversation} className="mt-2">
                  Start New Conversation
                </Button>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedConversationId === conversation.id 
                      ? 'ring-2 ring-primary border-primary' 
                      : ''
                  }`}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">
                          {conversation.customers 
                            ? `${conversation.customers.first_name} ${conversation.customers.last_name}`
                            : "Anonymous Customer"
                          }
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {conversation.customers?.email}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Badge variant={getPriorityColor(conversation.priority)} className="text-xs">
                          {conversation.priority}
                        </Badge>
                        <Badge variant={getStatusColor(conversation.status)} className="text-xs">
                          {conversation.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {conversation.category && (
                      <div className="mb-2">
                        <Badge variant="outline" className="text-xs">
                          {conversation.category}
                        </Badge>
                      </div>
                    )}
                    
                    {conversation.ai_summary && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        <Bot className="h-3 w-3 inline mr-1" />
                        {conversation.ai_summary}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(conversation.last_message_at), 'MMM dd, HH:mm')}
                      </div>
                      
                      {conversation.assigned_to && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Assigned
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};