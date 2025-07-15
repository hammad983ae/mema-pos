import { useState } from "react";
import { ConversationsList } from "@/components/customer-service/ConversationsList";
import { CustomerServiceChat } from "@/components/customer-service/CustomerServiceChat";
import { NewConversationDialog } from "@/components/customer-service/NewConversationDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { MessageSquare, Bot, Sparkles, TrendingUp, Clock, Settings, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export default function CustomerService() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [showNewConversation, setShowNewConversation] = useState(false);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleNewConversation = () => {
    setShowNewConversation(true);
  };

  const handleNewConversationSuccess = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setShowNewConversation(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton to="/dashboard" label="Back to Dashboard" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Service</h1>
          <p className="text-muted-foreground">
            AI-powered customer support with intelligent chat assistance
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className="h-4 w-4 text-blue-500" />
            <span>AI Assistant Active</span>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </div>
          <Link to="/ai-automation">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              AI Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">AI Responses</h3>
                <p className="text-sm text-muted-foreground">
                  Intelligent automated replies
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Smart Categorization</h3>
                <p className="text-sm text-muted-foreground">
                  Auto-categorize inquiries
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Response Suggestions</h3>
                <p className="text-sm text-muted-foreground">
                  AI-generated reply options
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium">Performance Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  94% resolution rate today
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                <Clock className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <h3 className="font-medium">Response Time</h3>
                <p className="text-sm text-muted-foreground">
                  Avg 2.3 min response
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                <Zap className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-medium">Auto-Resolution</h3>
                <p className="text-sm text-muted-foreground">
                  67% auto-resolved today
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <ConversationsList
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversationId}
            onNewConversation={handleNewConversation}
          />
        </div>
        
        <div className="lg:col-span-3">
          <CustomerServiceChat
            conversationId={selectedConversationId}
            onClose={() => setSelectedConversationId(undefined)}
          />
        </div>
      </div>

      <NewConversationDialog
        isOpen={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        onSuccess={handleNewConversationSuccess}
      />
    </div>
  );
}