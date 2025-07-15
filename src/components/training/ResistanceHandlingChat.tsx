import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ResistanceHandlingTraining } from "./ResistanceHandlingTraining";
import { TrainingNavigation } from "./TrainingNavigation";
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  GraduationCap,
  Target,
  TrendingUp,
  Zap,
  ArrowLeft
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  category?: 'resistance' | 'closing' | 'scripts' | 'general';
}

interface ResistanceHandlingChatProps {
  onBack?: () => void;
}

export const ResistanceHandlingChat = ({ onBack }: ResistanceHandlingChatProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your resistance handling specialist. I can help you with the three levels of resistance, complete sales scripts, and proven closing techniques. What specific situation would you like to practice?",
      sender: 'ai',
      timestamp: new Date(),
      category: 'general'
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    { question: "How do I handle 'I need to think about it'?", category: "resistance", icon: Target },
    { question: "What's the complete sales speech?", category: "scripts", icon: MessageSquare },
    { question: "How do I create VIP exclusivity?", category: "closing", icon: TrendingUp },
    { question: "Pain vs Pleasure examples?", category: "general", icon: GraduationCap }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes("think about it")) {
      return `This is First Resistance! Here's your response:

**Step 1: Relax** - "I totally get it. No pressure, let's look at it one more time."
**Step 2: Refresh** - "Look at the difference already!"
**Step 3: Pain vs Pleasure** - Show the problem and solution
**Step 4: Offer Gift** - "I'm including a $150 eye cream"
**Step 5: Close** - "Which card would you like to use?"`;
    }

    return "I can help with resistance handling techniques, sales scripts, and closing methods. What would you like to practice?";
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await generateAIResponse(userMessage.content);
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: response,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = async (question: string, category: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: question,
      sender: 'user',
      timestamp: new Date(),
      category: category as any
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const response = await generateAIResponse(question);
    
    setMessages(prev => [...prev, {
      id: `ai-${Date.now()}`,
      content: response,
      sender: 'ai',
      timestamp: new Date(),
      category: category as any
    }]);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {onBack && (
        <TrainingNavigation 
          onBack={onBack} 
          title="Resistance Handling Training" 
        />
      )}
      
      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">AI Chat Training</TabsTrigger>
          <TabsTrigger value="modules">Training Modules</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Resistance Handling AI Trainer
              </CardTitle>
              <CardDescription>
                Master the three levels of resistance with proven scripts
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle>Training Chat</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${message.sender === 'ai' ? 'bg-primary' : 'bg-muted'}`}>
                          {message.sender === 'ai' ? 
                            <Bot className="h-4 w-4 text-primary-foreground" /> : 
                            <User className="h-4 w-4" />
                          }
                        </div>
                        <div className="flex-1">
                          <div className={`p-3 rounded-lg ${
                            message.sender === 'ai' ? 'bg-muted/50' : 'bg-primary text-primary-foreground'
                          }`}>
                            <p className="text-sm whitespace-pre-line">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask about resistance handling..."
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={isLoading}
                      />
                      <Button onClick={handleSendMessage} disabled={isLoading}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Practice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickQuestions.map((item, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleQuickQuestion(item.question, item.category)}
                      disabled={isLoading}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.question}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="modules">
          <ResistanceHandlingTraining />
        </TabsContent>
      </Tabs>
    </div>
  );
};