import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Clock, User, AlertTriangle, ClipboardList } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TaskAssignmentForm } from "./TaskAssignmentForm";

interface TaskAssignmentsProps {
  userRole: string;
}

interface TaskAssignment {
  id: string;
  template_id: string;
  assigned_to: string;
  assigned_by: string;
  due_date: string;
  due_time: string;
  status: string;
  priority: string;
  notes: string;
  task_templates: {
    name: string;
    description: string;
    task_type: string;
    estimated_duration: number;
  };
  profiles: {
    full_name: string;
  } | null;
}

export const TaskAssignments = ({ userRole }: TaskAssignmentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewDialog, setShowNewDialog] = useState(false);

  const canManageTasks = ['business_owner', 'manager', 'office'].includes(userRole);

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const fetchAssignments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get user's business context
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      let query = supabase
        .from("task_assignments")
        .select(`
          *,
          task_templates (
            name,
            description,
            task_type,
            estimated_duration
          ),
          profiles (
            full_name
          )
        `)
        .eq("business_id", membershipData.business_id)
        .order("due_date", { ascending: true });

      // If not a manager, only show own assignments
      if (!canManageTasks) {
        query = query.eq("assigned_to", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAssignments((data as any) || []);
    } catch (error: any) {
      console.error("Error fetching task assignments:", error);
      toast({
        title: "Error",
        description: "Failed to load task assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (assignmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("task_assignments")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", assignmentId);

      if (error) throw error;

      setAssignments(prev => prev.map(assignment => 
        assignment.id === assignmentId 
          ? { ...assignment, status: newStatus }
          : assignment
      ));

      toast({
        title: "Success",
        description: "Task status updated",
      });
    } catch (error: any) {
      console.error("Error updating task status:", error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.task_templates.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (assignment.profiles?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || assignment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "outline";
      case "in_progress": return "default";
      case "overdue": return "destructive";
      case "pending": return "secondary";
      default: return "default";
    }
  };

  if (loading) {
    return <div>Loading task assignments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Task Assignments</h2>
          <p className="text-muted-foreground">
            Manage daily and weekly task assignments
          </p>
        </div>
        {canManageTasks && (
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Assign Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assign New Task</DialogTitle>
              </DialogHeader>
              <TaskAssignmentForm 
                onSuccess={() => {
                  setShowNewDialog(false);
                  fetchAssignments();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks or assignees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task assignments grid */}
      <div className="grid gap-4">
        {filteredAssignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{assignment.task_templates.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {assignment.task_templates.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={getPriorityColor(assignment.priority)}>
                    {assignment.priority}
                  </Badge>
                  <Badge variant={getStatusColor(assignment.status)}>
                    {assignment.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{assignment.profiles?.full_name || 'Unknown User'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{assignment.task_templates.estimated_duration} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {assignment.due_date && new Date(assignment.due_date).toLocaleDateString()}
                    {assignment.due_time && ` at ${assignment.due_time}`}
                  </span>
                </div>
                <div className="flex gap-2">
                  {assignment.assigned_to === user?.id && assignment.status === 'pending' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateTaskStatus(assignment.id, 'in_progress')}
                    >
                      Start Task
                    </Button>
                  )}
                  {assignment.assigned_to === user?.id && assignment.status === 'in_progress' && (
                    <Button 
                      size="sm"
                      onClick={() => updateTaskStatus(assignment.id, 'completed')}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
              {assignment.notes && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="text-sm">{assignment.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAssignments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Task Assignments</h3>
            <p className="text-muted-foreground">
              {canManageTasks ? "Create task assignments to get started." : "No tasks assigned to you yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};