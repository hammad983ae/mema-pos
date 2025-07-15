import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTrainingProgress } from "@/hooks/useTrainingProgress";
import { VoiceTrainer } from "@/utils/VoiceTrainer";
import { 
  ArrowLeft, 
  Send, 
  Brain, 
  User, 
  Loader2,
  Target,
  Clock,
  Award,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from "lucide-react";

interface TrainingModule {
  id: string;
  name: string;
  description: string;
  module_type: string;
  difficulty_level: number;
  estimated_duration_minutes: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface SalesTrainingChatProps {
  module: TrainingModule;
  onBack: () => void;
  onComplete: () => void;
}

export const SalesTrainingChat = ({ module, onBack, onComplete }: SalesTrainingChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { updateProgressAfterSession } = useTrainingProgress();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [aiInteractions, setAiInteractions] = useState(0);
  const [voiceTrainer, setVoiceTrainer] = useState<VoiceTrainer | null>(null);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [useVoiceMode, setUseVoiceMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeSession();
    
    return () => {
      // Cleanup voice trainer on unmount
      voiceTrainer?.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeSession = async () => {
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

      // Create new training session
      const { data: sessionData, error } = await supabase
        .from("sales_training_sessions")
        .insert({
          user_id: user.id,
          business_id: membershipData.business_id,
          module_id: module.id,
          session_status: 'in_progress'
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(sessionData.id);

      // Initialize voice trainer if in voice mode
      if (useVoiceMode) {
        await initializeVoiceTrainer(sessionData.id);
      } else {
        // Add welcome message for text mode
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          role: 'assistant',
          content: getWelcomeMessage(module.module_type),
          timestamp: new Date().toISOString()
        };

        setMessages([welcomeMessage]);

        // Save welcome message to database
        await supabase
          .from("sales_training_conversations")
          .insert({
            session_id: sessionData.id,
            message_index: 0,
            role: 'assistant',
            content: welcomeMessage.content
          });
      }

    } catch (error) {
      console.error("Error initializing session:", error);
      toast({
        title: "Error",
        description: "Failed to start training session",
        variant: "destructive",
      });
    }
  };

  const initializeVoiceTrainer = async (sessionId: string) => {
    try {
      const trainer = new VoiceTrainer(
        (message) => {
          console.log('Voice trainer message:', message);
          // Handle voice trainer messages if needed
        },
        (connected) => {
          setIsVoiceConnected(connected);
          console.log('Voice connection:', connected ? 'Connected' : 'Disconnected');
        },
        (transcript) => {
          setCurrentTranscript(transcript);
          console.log('Current transcript:', transcript);
        },
        (speaking) => {
          setIsAISpeaking(speaking);
          console.log('AI speaking:', speaking);
        }
      );

      await trainer.connect(module.module_type, user?.id || '');
      setVoiceTrainer(trainer);

      toast({
        title: "Voice Training Ready!",
        description: "You can now speak directly with your AI trainer",
      });
    } catch (error) {
      console.error('Error initializing voice trainer:', error);
      toast({
        title: "Voice Setup Failed",
        description: "Falling back to text mode",
        variant: "destructive",
      });
      setUseVoiceMode(false);
    }
  };
  const getWelcomeMessage = (moduleType: string): string => {
    const welcomeMessages = {
      mindset: "Welcome to Mindset Training! I'm your AI sales coach. We'll work on developing the winning mindset needed for high-pressure sales. What's your biggest mental challenge when approaching potential customers?",
      finding_why: "Let's discover your 'Why'! Your motivation is the fuel for success in sales. Tell me, what drives you to succeed in this business? What are you working toward?",
      sample_approach: "Time to master the sample approach! This is where sales begin. I'll teach you how to confidently approach customers with samples. What's your current approach strategy?",
      connection_building: "Building genuine connections is crucial for sales success. Let's practice techniques to quickly establish trust and rapport. How do you currently start conversations with new customers?",
      objection_handling: "Objections are buying signals in disguise! I'll teach you our high-pressure techniques to turn every 'no' into a 'yes'. What objections do you hear most often?",
      closing_techniques: "Closing is where the magic happens! We'll practice powerful closing techniques that create urgency and drive decisions. What's your current closing process?",
      opener_to_upseller: "The handoff is critical! I'll train you on seamlessly transitioning customers from opener to upseller for maximum sales. Tell me about your current handoff process.",
      high_pressure_tactics: "High-pressure sales require specific skills and techniques. I'll teach you advanced methods while maintaining professionalism. Are you ready to learn aggressive closing?",
      product_knowledge: "Deep product knowledge builds confidence and credibility. Let's master every detail about our products and services. What products do you need to learn more about?",
      customer_psychology: "Understanding customer psychology is your secret weapon. I'll teach you to read buying signals and motivations. What customer behaviors confuse you most?",
      sales_triangle: "Welcome to the Sales Triangle! I'll teach you the foundation of every sale - the perfect connection between client, product, and seller. Ready to learn how to create value and build that bridge?",
      cocos_methodology: "Welcome to the complete Cocos Sales System! I'll guide you through our proven two-phase approach: the opener (syringe sale) and the upsell transition. What part of the sales process would you like to master first?"
    };

    return welcomeMessages[moduleType as keyof typeof welcomeMessages] || 
           "Welcome to AI Sales Training! I'm here to help you master professional sales techniques. What would you like to work on today?";
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !sessionId || !user) return;

    if (useVoiceMode && voiceTrainer) {
      // Send text message through voice trainer
      voiceTrainer.sendTextMessage(input.trim());
      
      // Add user message to UI
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: input.trim(),
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInput("");
      return;
    }
    // Text mode - existing logic

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Save user message
      await supabase
        .from("sales_training_conversations")
        .insert({
          session_id: sessionId,
          message_index: messages.length,
          role: 'user',
          content: userMessage.content
        });

      // Simulate AI response (replace with actual AI call later)
      const aiResponse = await generateAIResponse(userMessage.content, module.module_type);
      
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
      setAiInteractions(prev => prev + 1);

      // Save AI message
      await supabase
        .from("sales_training_conversations")
        .insert({
          session_id: sessionId,
          message_index: messages.length + 1,
          role: 'assistant',
          content: aiMessage.content
        });

      // Update session
      await supabase
        .from("sales_training_sessions")
        .update({
          ai_interactions_count: aiInteractions + 1,
          total_duration_seconds: Math.floor((Date.now() - sessionStartTime.getTime()) / 1000)
        })
        .eq("id", sessionId);

    } catch (error) {
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

  const generateAIResponse = async (userInput: string, moduleType: string): Promise<string> => {
    if (!sessionId || !user) return "Unable to process request at this time.";

    try {
      // Import and use the enhanced AI trainer
      const { EnhancedAITrainer } = await import('./EnhancedAITrainer');
      const aiTrainer = new EnhancedAITrainer(moduleType, user.id, sessionId);
      
      // Get conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

      // Generate enhanced response
      const response = await aiTrainer.generateResponse(userInput, conversationHistory);
      
      // Save AI interaction metrics
      await supabase
        .from("sales_training_sessions")
        .update({
          ai_interactions_count: aiInteractions + 1,
          performance_score: response.score || 75,
          feedback_given: response.feedback || "Keep practicing!"
        })
        .eq("id", sessionId);

      return response.content;
    } catch (error) {
      console.error("Error generating AI response:", error);
      
      // Fallback to basic responses
      const responses = {
        mindset: "That's a great insight! Remember, every 'no' gets you closer to a 'yes'. Confidence comes from preparation and practice. Let's work on reframing that challenge as an opportunity...",
        finding_why: "Your 'why' is powerful! That motivation will carry you through tough moments. Now let's connect that deeper purpose to your daily sales activities...",
        sample_approach: "Excellent! The key is confidence and timing. When approaching with samples, always lead with a benefit that grabs attention. Try this script...",
        objection_handling: "Perfect! That objection is actually a buying signal. Here's how to turn it around using our proven technique...",
        closing_techniques: "Great question! Remember the structure: Highlight enthusiasm → Let them hold product → Present price confidently → Create urgency → Ask closing questions. Which part needs work?",
        product_knowledge: "Product knowledge builds confidence! For the eye applicator: nano-particles of mica & silica, creates invisible matrix, 18-24 hour results, improves blood flow. What specific product details do you need?",
        default: "I understand your perspective. Let me share a technique that will help you handle this situation more effectively..."
      };

      return responses[moduleType as keyof typeof responses] || responses.default;
    }
  };

  const toggleVoiceMode = async () => {
    if (useVoiceMode) {
      // Switch to text mode
      voiceTrainer?.disconnect();
      setVoiceTrainer(null);
      setIsVoiceConnected(false);
      setUseVoiceMode(false);
      
      toast({
        title: "Switched to Text Mode",
        description: "Type your messages to continue training",
      });
    } else {
      // Switch to voice mode
      if (sessionId) {
        setUseVoiceMode(true);
        await initializeVoiceTrainer(sessionId);
      }
    }
  };

  const handleCompleteSession = async () => {
    if (!sessionId) return;

    // Disconnect voice trainer
    voiceTrainer?.disconnect();

    try {
      const sessionDuration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
      const finalScore = Math.min(70 + (aiInteractions * 5), 95); // Dynamic score based on interaction
      
      await supabase
        .from("sales_training_sessions")
        .update({
          session_status: 'completed',
          completed_at: new Date().toISOString(),
          total_duration_seconds: sessionDuration,
          performance_score: finalScore,
          feedback_given: "Great session! Keep practicing these techniques."
        })
        .eq("id", sessionId);

      // Update progress using the new hook
      await updateProgressAfterSession(module.id, sessionDuration, finalScore);
      
      toast({
        title: "Session Complete!",
        description: `Great work! You scored ${finalScore}%. Your progress has been saved.`,
      });

      onComplete();
    } catch (error) {
      console.error("Error completing session:", error);
      toast({
        title: "Error",
        description: "Failed to complete session",
        variant: "destructive",
      });
    }
  };

  const updateUserProgress = async () => {
    if (!user || !sessionId) return;

    try {
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      // Get current progress
      const { data: currentProgress } = await supabase
        .from("sales_training_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("module_id", module.id)
        .single();

      const sessionDuration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
      const newSessionsCount = (currentProgress?.sessions_count || 0) + 1;
      const newTotalTime = (currentProgress?.total_time_spent_seconds || 0) + sessionDuration;
      const newCompletionPercentage = Math.min((currentProgress?.completion_percentage || 0) + 20, 100);

      if (currentProgress) {
        await supabase
          .from("sales_training_progress")
          .update({
            completion_percentage: newCompletionPercentage,
            total_time_spent_seconds: newTotalTime,
            sessions_count: newSessionsCount,
            last_accessed_at: new Date().toISOString()
          })
          .eq("id", currentProgress.id);
      } else {
        await supabase
          .from("sales_training_progress")
          .insert({
            user_id: user.id,
            business_id: membershipData.business_id,
            module_id: module.id,
            completion_percentage: newCompletionPercentage,
            total_time_spent_seconds: newTotalTime,
            sessions_count: newSessionsCount,
            last_accessed_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">{module.name}</h1>
              <p className="text-sm text-muted-foreground">AI Sales Training Session</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {Math.floor((Date.now() - sessionStartTime.getTime()) / 60000)}m
            </Badge>
            <Badge variant="outline" className="flex items-center">
              <Target className="h-3 w-3 mr-1" />
              Level {module.difficulty_level}
            </Badge>
            
            {/* Voice Mode Indicator */}
            {useVoiceMode && (
              <Badge 
                variant={isVoiceConnected ? "default" : "destructive"} 
                className="flex items-center"
              >
                {isVoiceConnected ? (
                  <>
                    <Mic className="h-3 w-3 mr-1" />
                    {isAISpeaking ? "AI Speaking..." : "Listening"}
                  </>
                ) : (
                  <>
                    <MicOff className="h-3 w-3 mr-1" />
                    Connecting...
                  </>
                )}
              </Badge>
            )}
            
            <Button 
              onClick={toggleVoiceMode} 
              variant="outline" 
              size="sm"
            >
              {useVoiceMode ? (
                <>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Switch to Text
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Switch to Voice
                </>
              )}
            </Button>
            
            <Button onClick={handleCompleteSession} size="sm">
              <Award className="h-4 w-4 mr-2" />
              Complete Session
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[80%] space-x-3 ${
                    message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div className={`flex-shrink-0 ${message.role === 'user' ? 'order-2' : ''}`}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Brain className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  <Card
                    className={`${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card'
                    }`}
                  >
                    <CardContent className="p-4">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <Brain className="h-4 w-4" />
                  </div>
                  <Card className="bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">AI Coach is thinking...</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t bg-card p-6">
          <div className="max-w-4xl mx-auto">
            {/* Live Transcript Display */}
            {useVoiceMode && currentTranscript && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Live Transcript:</p>
                <p className="text-sm">{currentTranscript}</p>
              </div>
            )}
            
            {/* Voice Mode Status */}
            {useVoiceMode && isVoiceConnected && (
              <div className="mb-4 text-center">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                  isAISpeaking 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-success/10 text-success border border-success/20'
                }`}>
                  {isAISpeaking ? (
                    <>
                      <Volume2 className="h-4 w-4 mr-2 animate-pulse" />
                      AI Trainer is speaking...
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Speak now - I'm listening!
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Text Input (shown in text mode or as backup in voice mode) */}
            <div className="flex space-x-4">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={useVoiceMode ? "Or type a message..." : "Ask your AI sales coach anything..."}
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
                disabled={loading}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!input.trim() || loading}
                size="sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};