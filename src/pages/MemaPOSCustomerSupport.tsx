import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Send, 
  Bot, 
  Loader2, 
  HelpCircle,
  Search,
  ExternalLink,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  MessageCircle,
  Shield,
  Zap
} from "lucide-react";

interface Message {
  content: string;
  sender_type: string;
  created_at: string;
  sender_name?: string;
}

interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  problem_description: string;
  solution_steps: string[];
  keywords: string[];
}

export default function MemaPOSCustomerSupport() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    businessName: "",
    phone: ""
  });
  const [issueType, setIssueType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeItem[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);

  useEffect(() => {
    if (searchQuery) {
      searchKnowledgeBase();
    } else {
      setKnowledgeBase([]);
    }
  }, [searchQuery]);

  const searchKnowledgeBase = async () => {
    try {
      const { data, error } = await supabase
        .rpc('search_knowledge_base', { search_query: searchQuery });
      
      if (error) throw error;
      setKnowledgeBase(data || []);
    } catch (error) {
      console.error('Error searching knowledge base:', error);
    }
  };

  const startConversation = async () => {
    if (!customerInfo.email || !issueType) {
      toast({
        title: "Missing Information",
        description: "Please provide your email and select an issue type to continue",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-support-ai', {
        body: {
          action: 'start_conversation',
          customerInfo,
          issueType
        }
      });

      if (error) throw error;

      setConversationId(data.conversationId);
      setMessages([{
        content: data.welcomeMessage,
        sender_type: 'ai',
        created_at: new Date().toISOString()
      }]);
      setChatStarted(true);
      setShowChat(true);

      toast({
        title: "Support Chat Started",
        description: "Connected to MemaPOS AI support assistant",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Connection Failed",
        description: "Unable to start support chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !conversationId) return;

    const userMessage: Message = {
      content: currentMessage,
      sender_type: 'customer',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('customer-support-ai', {
        body: {
          action: 'customer_support_chat',
          message: currentMessage,
          conversationId,
          customerInfo,
          issueType
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        content: data.response,
        sender_type: 'ai',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Message Failed",
        description: "Unable to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const escalateToHuman = async () => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-support-ai', {
        body: {
          action: 'escalate_to_human',
          conversationId,
          message: 'Customer requested human support'
        }
      });

      if (error) throw error;

      const systemMessage: Message = {
        content: data.message,
        sender_type: 'system',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, systemMessage]);

      toast({
        title: "Escalated to Human Support",
        description: "A specialist will contact you within 2 business hours",
      });
    } catch (error) {
      console.error('Error escalating:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showChat && chatStarted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">MemaPOS Support</h1>
                <p className="text-muted-foreground">AI-powered customer support</p>
              </div>
            </div>
            <Button onClick={() => setShowChat(false)} variant="outline">
              Back to Support
            </Button>
          </div>

          {/* Chat Interface */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Support Chat
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{issueType}</Badge>
                  <Button onClick={escalateToHuman} variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Human Support
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Messages */}
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4 p-4 border rounded-lg">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.sender_type === 'customer' 
                        ? 'bg-primary text-primary-foreground' 
                        : msg.sender_type === 'system'
                        ? 'bg-muted border border-border'
                        : 'bg-secondary'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                      {msg.sender_type === 'ai' && (
                        <div className="text-xs opacity-70 mt-1">MemaPOS AI Assistant</div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-secondary px-4 py-2 rounded-lg flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Thinking...
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Describe your issue or ask a question..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  rows={2}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button onClick={sendMessage} disabled={loading || !currentMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">MemaPOS Customer Support</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get instant help with your MemaPOS system, inventory management, and more
          </p>
        </div>

        {/* Quick Help Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Quick Help Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 mb-4">
              <Input
                placeholder="Search for solutions (e.g., 'printer not working', 'employee login')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {knowledgeBase.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Found Solutions:</h4>
                {knowledgeBase.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium">{item.title}</h5>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{item.problem_description}</p>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Solution Steps:</p>
                      <ol className="list-decimal list-inside text-sm space-y-1">
                        {item.solution_steps.map((step, index) => (
                          <li key={index} className="text-muted-foreground">{step}</li>
                        ))}
                      </ol>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Chat Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Support Chat
              </CardTitle>
              <p className="text-muted-foreground">
                Get instant help from our AI assistant trained on MemaPOS systems
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    placeholder="Your name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({...prev, name: e.target.value}))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({...prev, email: e.target.value}))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Business Name</label>
                  <Input
                    placeholder="Your business"
                    value={customerInfo.businessName}
                    onChange={(e) => setCustomerInfo(prev => ({...prev, businessName: e.target.value}))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    placeholder="(555) 123-4567"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({...prev, phone: e.target.value}))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Issue Type *</label>
                <Select value={issueType} onValueChange={setIssueType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pos_hardware">POS Hardware (printer, cash drawer, scanner)</SelectItem>
                    <SelectItem value="pos_software">POS Software Issues</SelectItem>
                    <SelectItem value="user_login">Employee Login Problems</SelectItem>
                    <SelectItem value="inventory">Inventory & Stock Issues</SelectItem>
                    <SelectItem value="timeclock">Time Clock Problems</SelectItem>
                    <SelectItem value="payments">Payment Processing</SelectItem>
                    <SelectItem value="reports">Reports & Analytics</SelectItem>
                    <SelectItem value="general">General Question</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={startConversation} disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MessageCircle className="h-4 w-4 mr-2" />
                )}
                Start AI Support Chat
              </Button>
            </CardContent>
          </Card>

          {/* Contact Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Other Support Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-muted-foreground">1-800-MEMAPOS (Mon-Fri 8AM-8PM EST)</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-muted-foreground">support@memapos.com</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <p className="font-medium">Help Documentation</p>
                      <p className="text-sm text-muted-foreground">Detailed guides and tutorials</p>
                    </div>
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  AI Support Features
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Instant responses 24/7</li>
                  <li>• Step-by-step troubleshooting</li>
                  <li>• Get immediate help with common MemaPOS issues</li>
                  <li>• Escalate to human support when needed</li>
                  <li>• Trained on MemaPOS-specific solutions and best practices</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}