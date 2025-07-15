import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Clock, User, CheckSquare, Star, Calendar } from "lucide-react";

interface TaskCompletionsProps {
  userRole: string;
}

interface TaskCompletion {
  id: string;
  completed_at: string;
  notes: string;
  duration_minutes: number;
  quality_score: number;
  verified_by: string | null;
  verified_at: string | null;
  assignment_id: string | null;
  checklist_id: string | null;
  profiles: {
    full_name: string;
  } | null;
  task_assignments?: {
    task_templates: {
      name: string;
      task_type: string;
    };
  };
  checklists?: {
    name: string;
    checklist_type: string;
  };
}

export const TaskCompletions = ({ userRole }: TaskCompletionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("week");

  const canViewAllCompletions = ['business_owner', 'manager', 'office'].includes(userRole);

  useEffect(() => {
    fetchCompletions();
  }, [user, timeFilter]);

  const fetchCompletions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      // Calculate date filter
      const now = new Date();
      let startDate = new Date();
      switch (timeFilter) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setDate(now.getDate() - 30);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      let query = supabase
        .from("task_completions")
        .select(`
          *,
          profiles (
            full_name
          ),
          task_assignments (
            task_templates (
              name,
              task_type
            )
          ),
          checklists (
            name,
            checklist_type
          )
        `)
        .eq("business_id", membershipData.business_id)
        .gte("completed_at", startDate.toISOString())
        .order("completed_at", { ascending: false });

      // If not a manager, only show own completions
      if (!canViewAllCompletions) {
        query = query.eq("completed_by", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCompletions((data as any) || []);
    } catch (error: any) {
      console.error("Error fetching task completions:", error);
      toast({
        title: "Error",
        description: "Failed to load task completions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCompletions = completions.filter(completion => {
    const taskName = completion.task_assignments?.task_templates.name || 
                    completion.checklists?.name || 
                    "Unknown Task";
    const userName = completion.profiles?.full_name || 'Unknown User';
    
    return taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (completion.notes && completion.notes.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "opening": return "default";
      case "closing": return "destructive";
      case "maintenance": return "secondary";
      case "daily": return "default";
      case "weekly": return "secondary";
      default: return "default";
    }
  };

  const renderQualityStars = (score: number) => {
    if (!score) return null;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`h-4 w-4 ${star <= score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({score}/5)</span>
      </div>
    );
  };

  if (loading) {
    return <div>Loading task completions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Task Completions</h2>
        <p className="text-muted-foreground">
          Track completed tasks and performance
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search completions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Completions grid */}
      <div className="grid gap-4">
        {filteredCompletions.map((completion) => {
          const taskName = completion.task_assignments?.task_templates.name || 
                          completion.checklists?.name || 
                          "Unknown Task";
          const taskType = completion.task_assignments?.task_templates.task_type || 
                          completion.checklists?.checklist_type || 
                          "unknown";

          return (
            <Card key={completion.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckSquare className="h-5 w-5" />
                      {taskName}
                    </CardTitle>
                    <Badge variant={getTypeColor(taskType)}>
                      {taskType}
                    </Badge>
                  </div>
                  {completion.quality_score && renderQualityStars(completion.quality_score)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{completion.profiles?.full_name || 'Unknown User'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(completion.completed_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(completion.completed_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  {completion.duration_minutes && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{completion.duration_minutes} min</span>
                    </div>
                  )}
                </div>
                
                {completion.notes && (
                  <div className="mt-3 p-3 bg-muted rounded-md">
                    <p className="text-sm">{completion.notes}</p>
                  </div>
                )}

                {completion.verified_by && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700">
                      ✓ Verified {completion.verified_at && `on ${new Date(completion.verified_at).toLocaleDateString()}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCompletions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Task Completions</h3>
            <p className="text-muted-foreground">
              No completed tasks found for the selected time period.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};