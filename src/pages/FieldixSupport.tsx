import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  Settings, 
  Zap,
  Loader2,
  Send,
  Bot,
  Activity,
  Shield
} from "lucide-react";

interface SupportDiagnosis {
  diagnosis: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  solution: {
    immediate_steps: string[];
    workaround: string;
    requires_dev: boolean;
    estimated_time: string;
  };
  prevention: string;
  related_docs?: string[];
}

interface HealthReport {
  overall_health: string;
  issues: Array<{
    component: string;
    severity: string;
    description: string;
    recommendation: string;
  }>;
  optimizations: string[];
  alerts: string[];
}

const FieldixSupport = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [diagnosis, setDiagnosis] = useState<SupportDiagnosis | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{content: string, sender: string}>>([]);
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [conversationId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    // Automatically run system health check on load
    runHealthCheck();
  }, []);

  const captureSystemInfo = () => {
    return {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      localStorage: {
        itemCount: localStorage.length,
        hasAuth: !!localStorage.getItem('supabase.auth.token')
      },
      sessionStorage: {
        itemCount: sessionStorage.length
      }
    };
  };

  const diagnoseError = async (errorData?: any) => {
    if (!userMessage.trim()) {
      toast({
        title: "Please describe the issue",
        description: "Enter details about the error or problem you're experiencing",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const systemInfo = captureSystemInfo();
      
      const { data, error } = await supabase.functions.invoke('fielix-support-ai', {
        body: {
          action: 'diagnose_error',
          errorData: errorData || { userReported: true },
          systemInfo,
          userMessage
        }
      });

      if (error) throw error;
      
      setDiagnosis(data);
      toast({
        title: "Diagnosis Complete",
        description: "AI has analyzed your issue and provided recommendations",
      });
    } catch (error) {
      console.error("Error getting diagnosis:", error);
      toast({
        title: "Diagnosis Failed",
        description: "Unable to analyze the issue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!userMessage.trim()) return;

    const newMessage = { content: userMessage, sender: 'user' };
    setChatMessages(prev => [...prev, newMessage]);
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fielix-support-ai', {
        body: {
          action: 'chat_support',
          userMessage,
          conversationId
        }
      });

      if (error) throw error;
      
      setChatMessages(prev => [...prev, { content: data.response, sender: 'ai' }]);
      setUserMessage("");
    } catch (error) {
      console.error("Error in chat:", error);
      toast({
        title: "Chat Error",
        description: "Unable to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runHealthCheck = async () => {
    try {
      const systemInfo = captureSystemInfo();
      
      const { data, error } = await supabase.functions.invoke('fielix-support-ai', {
        body: {
          action: 'system_health_check',
          systemInfo
        }
      });

      if (error) throw error;
      setHealthReport(data);
    } catch (error) {
      console.error("Health check failed:", error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Fielix Support Agent</h1>
            <p className="text-muted-foreground">
              AI-powered troubleshooting for POS errors and system issues
            </p>
          </div>
        </div>
        <Button onClick={runHealthCheck} variant="outline" size="sm">
          <Activity className="h-4 w-4 mr-2" />
          Health Check
        </Button>
      </div>

      <Tabs defaultValue="diagnosis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="diagnosis" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Error Diagnosis
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Support Chat
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            System Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagnosis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Describe Your Issue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Describe the error or issue you're experiencing with Fielix (POS, inventory, scheduling, etc.)"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                rows={4}
              />
              <Button onClick={() => diagnoseError()} disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Diagnose Issue
              </Button>
            </CardContent>
          </Card>

          {diagnosis && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>AI Diagnosis</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getSeverityColor(diagnosis.severity)}>
                      {getSeverityIcon(diagnosis.severity)}
                      {diagnosis.severity}
                    </Badge>
                    <Badge variant="outline">{diagnosis.category}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Problem Analysis</h4>
                  <p className="text-muted-foreground">{diagnosis.diagnosis}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Solution Steps</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    {diagnosis.solution.immediate_steps.map((step, index) => (
                      <li key={index} className="text-muted-foreground">{step}</li>
                    ))}
                  </ol>
                </div>

                {diagnosis.solution.workaround && (
                  <div>
                    <h4 className="font-semibold mb-2">Temporary Workaround</h4>
                    <p className="text-muted-foreground">{diagnosis.solution.workaround}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    <Badge variant={diagnosis.solution.requires_dev ? "destructive" : "secondary"}>
                      {diagnosis.solution.requires_dev ? "Requires Developer" : "Self-Service"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Est. Time: {diagnosis.solution.estimated_time}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Prevention</h4>
                  <p className="text-muted-foreground">{diagnosis.prevention}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Support Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {chatMessages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Start a conversation with the Fielix support AI
                  </p>
                ) : (
                  chatMessages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.sender === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Ask about POS issues, error messages, or get help..."
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  rows={2}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                />
                <Button onClick={sendChatMessage} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          {healthReport ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Health: {healthReport.overall_health}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={healthReport.overall_health === 'excellent' ? 'default' : 'secondary'}>
                    {healthReport.overall_health}
                  </Badge>
                </CardContent>
              </Card>

              {healthReport.issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Issues Detected</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {healthReport.issues.map((issue, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{issue.component}</span>
                          <Badge variant={getSeverityColor(issue.severity)}>
                            {issue.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                        <p className="text-sm font-medium">Recommendation: {issue.recommendation}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {healthReport.optimizations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Optimizations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {healthReport.optimizations.map((opt, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">{opt}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Activity className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Click "Health Check" to analyze system status</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FieldixSupport;