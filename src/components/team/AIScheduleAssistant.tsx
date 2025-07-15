import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Users, 
  TrendingUp, 
  Clock, 
  Lightbulb,
  Sparkles,
  Target,
  Loader2
} from "lucide-react";

interface AIInsight {
  type: string;
  insight: string;
  confidence: number;
  actionable: string;
}

interface TeamPairing {
  opener: { id: string; name: string; confidence: number };
  upseller: { id: string; name: string; confidence: number };
  reasoning: string;
  estimated_performance: string;
}

interface ScheduleSuggestion {
  store_name: string;
  recommended_pairings: TeamPairing[];
  alternative_options: string[];
}

interface AIScheduleAssistantProps {
  businessId: string;
  scheduleData?: any;
  onSuggestionApply?: (suggestion: any) => void;
}

export const AIScheduleAssistant = ({ 
  businessId, 
  scheduleData, 
  onSuggestionApply 
}: AIScheduleAssistantProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>([]);
  const [generalTips, setGeneralTips] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (businessId) {
      loadAIInsights();
    }
  }, [businessId]);

  const loadAIInsights = async () => {
    try {
      const { data } = await supabase
        .from('ai_schedule_insights')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data?.insights_data && typeof data.insights_data === 'object') {
        const insightsData = data.insights_data as any;
        setInsights(insightsData.insights || []);
      }
    } catch (error) {
      console.log('No existing AI insights found');
    }
  };

  const handleAIAction = async (action: string) => {
    if (!user) return;

    try {
      setLoading(prev => ({ ...prev, [action]: true }));

      const { data, error } = await supabase.functions.invoke('ai-schedule-assistant', {
        body: {
          action,
          businessId,
          scheduleData,
          timeframe: '2_weeks'
        }
      });

      if (error) throw error;

      switch (action) {
        case 'analyze_team_performance':
          setInsights(data.insights || []);
          toast({
            title: "Team Analysis Complete",
            description: "AI has analyzed recent team performance patterns",
          });
          break;

        case 'suggest_pairings':
          setSuggestions(data.suggestions || []);
          setGeneralTips(data.general_tips || []);
          toast({
            title: "Pairing Suggestions Ready",
            description: "AI has suggested optimal team pairings based on performance data",
          });
          break;

        case 'learn_patterns':
          toast({
            title: "AI Learning Updated",
            description: "AI has learned from the latest 2 weeks of scheduling data",
          });
          break;
      }
    } catch (error: any) {
      console.error(`Error in AI ${action}:`, error);
      toast({
        title: "AI Assistant Error",
        description: error.message || `Failed to ${action}`,
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-gray-600";
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'compatibility': return <Users className="h-4 w-4" />;
      case 'timing': return <Clock className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-blue-200/50 bg-gradient-to-br from-blue-50/30 to-indigo-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Scheduling Assistant
            <Badge variant="outline" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Subtle Support
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Minimize' : 'Expand'}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Gentle insights and suggestions to support your scheduling decisions
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAIAction('analyze_team_performance')}
            disabled={loading.analyze_team_performance}
            className="flex items-center gap-2"
          >
            {loading.analyze_team_performance ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <TrendingUp className="h-3 w-3" />
            )}
            Analyze Performance
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAIAction('suggest_pairings')}
            disabled={loading.suggest_pairings}
            className="flex items-center gap-2"
          >
            {loading.suggest_pairings ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Users className="h-3 w-3" />
            )}
            Suggest Pairings
          </Button>

          {isExpanded && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAIAction('learn_patterns')}
              disabled={loading.learn_patterns}
              className="flex items-center gap-2"
            >
              {loading.learn_patterns ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Brain className="h-3 w-3" />
              )}
              Update Learning
            </Button>
          )}
        </div>

        {/* General Tips */}
        {generalTips.length > 0 && (
          <div className="bg-blue-50/50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              Gentle Suggestions
            </h4>
            <ul className="text-sm space-y-1">
              {generalTips.slice(0, isExpanded ? generalTips.length : 2).map((tip, index) => (
                <li key={index} className="text-muted-foreground">• {tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Performance Insights */}
        {insights.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Recent Insights</h4>
            {insights.slice(0, isExpanded ? insights.length : 3).map((insight, index) => (
              <Card key={index} className="p-3 border-gray-200/50">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{insight.insight}</p>
                    <p className="text-xs text-blue-600 mt-1">{insight.actionable}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {insight.type}
                      </Badge>
                      <span className={`text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                        {Math.round(insight.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Team Pairing Suggestions */}
        {suggestions.length > 0 && isExpanded && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Pairing Suggestions</h4>
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="p-3 border-green-200/50 bg-green-50/30">
                <h5 className="font-medium text-sm mb-2">{suggestion.store_name}</h5>
                {suggestion.recommended_pairings.slice(0, 2).map((pairing, pIndex) => (
                  <div key={pIndex} className="text-sm space-y-1 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Opener:</span>
                      <span>{pairing.opener.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(pairing.opener.confidence * 100)}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Upseller:</span>
                      <span>{pairing.upseller.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(pairing.upseller.confidence * 100)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      {pairing.reasoning}
                    </p>
                  </div>
                ))}
                {suggestion.alternative_options.length > 0 && (
                  <p className="text-xs text-blue-600 mt-2">
                    Alternatives: {suggestion.alternative_options.join(', ')}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {insights.length === 0 && suggestions.length === 0 && !Object.values(loading).some(Boolean) && (
          <div className="text-center py-4">
            <Brain className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-muted-foreground">
              Click "Analyze Performance" to get AI insights on your team scheduling
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};