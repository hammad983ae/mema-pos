import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  Plus,
  Send,
  Save,
  Layers,
  Bell,
  CheckCircle
} from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";
import { ShiftTemplateManager } from "./ShiftTemplateManager";
import { ScheduleSubmissionDialog } from "./ScheduleSubmissionDialog";

interface TeamMember {
  id: string;
  full_name: string;
  position_type: 'opener' | 'upseller';
  avatar_url?: string;
}

interface ShiftTemplate {
  id: string;
  template_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  required_openers: number;
  required_upsellers: number;
  break_duration: number;
  is_active: boolean;
}

interface ScheduleSlot {
  id: string;
  day: string;
  dayIndex: number;
  template?: ShiftTemplate;
  assignedMembers: TeamMember[];
}

interface EnhancedScheduleBuilderProps {
  userRole: string;
}

export const EnhancedScheduleBuilder = ({ userRole }: EnhancedScheduleBuilderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [openers, setOpeners] = useState<TeamMember[]>([]);
  const [upsellers, setUpsellers] = useState<TeamMember[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date()));
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("builder");

  const canManage = userRole === 'business_owner' || userRole === 'manager';
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedWeek]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get business context
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (!membershipData) return;
      setBusinessId(membershipData.business_id);

      // Fetch team members with proper query structure
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, position_type, avatar_url")
        .not("position_type", "is", null);

      if (profiles) {
        // Get business members to filter profiles
        const { data: businessMembers } = await supabase
          .from("user_business_memberships")
          .select("user_id")
          .eq("business_id", membershipData.business_id)
          .eq("is_active", true);

        const memberIds = businessMembers?.map(m => m.user_id) || [];
        const members = profiles
          .filter(profile => memberIds.includes(profile.user_id))
          .filter(profile => profile.position_type === 'opener' || profile.position_type === 'upseller')
          .map(profile => ({
            id: profile.user_id,
            full_name: profile.full_name,
            position_type: profile.position_type as 'opener' | 'upseller',
            avatar_url: profile.avatar_url
          }));
        setTeamMembers(members);
        setOpeners(members.filter(m => m.position_type === 'opener'));
        setUpsellers(members.filter(m => m.position_type === 'upseller'));
      }

      // Fetch shift templates
      const { data: templates } = await supabase
        .from("shift_templates")
        .select("*")
        .eq("business_id", membershipData.business_id)
        .eq("is_active", true)
        .order("day_of_week");

      if (templates) {
        setShiftTemplates(templates);
        generateScheduleSlots(templates);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load schedule data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateScheduleSlots = (templates: ShiftTemplate[]) => {
    const slots: ScheduleSlot[] = [];
    
    daysOfWeek.forEach((day, dayIndex) => {
      // Get templates for this day (0 = Sunday, 1 = Monday, etc.)
      const dayTemplates = templates.filter(t => t.day_of_week === dayIndex + 1);
      
      if (dayTemplates.length > 0) {
        dayTemplates.forEach((template, templateIndex) => {
          slots.push({
            id: `${dayIndex}-${templateIndex}`,
            day,
            dayIndex,
            template,
            assignedMembers: []
          });
        });
      } else {
        // Create empty slot if no template
        slots.push({
          id: `${dayIndex}-0`,
          day,
          dayIndex,
          assignedMembers: []
        });
      }
    });
    
    setScheduleSlots(slots);
  };

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    const sourceDroppableId = source.droppableId;
    const destDroppableId = destination.droppableId;

    if (sourceDroppableId === destDroppableId && source.index === destination.index) {
      return;
    }

    // Find the member being dragged
    let draggedMember: TeamMember | null = null;
    
    if (sourceDroppableId === 'openers') {
      draggedMember = openers[source.index];
    } else if (sourceDroppableId === 'upsellers') {
      draggedMember = upsellers[source.index];
    } else {
      // Coming from a schedule slot
      const sourceSlot = scheduleSlots.find(slot => slot.id === sourceDroppableId);
      if (sourceSlot) {
        draggedMember = sourceSlot.assignedMembers[source.index];
      }
    }

    if (!draggedMember) return;

    // Handle the drop
    if (destDroppableId.includes('-')) {
      // Dropping into a schedule slot
      const updatedSlots = [...scheduleSlots];
      const targetSlot = updatedSlots.find(slot => slot.id === destDroppableId);
      
      if (targetSlot) {
        // Check if slot has template requirements
        if (targetSlot.template) {
          const currentOpeners = targetSlot.assignedMembers.filter(m => m.position_type === 'opener').length;
          const currentUpsellers = targetSlot.assignedMembers.filter(m => m.position_type === 'upseller').length;
          
          if (draggedMember.position_type === 'opener' && currentOpeners >= targetSlot.template.required_openers) {
            toast({
              title: "Assignment Limit Reached",
              description: `This shift only requires ${targetSlot.template.required_openers} opener(s)`,
              variant: "destructive",
            });
            return;
          }
          
          if (draggedMember.position_type === 'upseller' && currentUpsellers >= targetSlot.template.required_upsellers) {
            toast({
              title: "Assignment Limit Reached",
              description: `This shift only requires ${targetSlot.template.required_upsellers} upseller(s)`,
              variant: "destructive",
            });
            return;
          }
        }

        // Remove from source if it was a slot
        if (sourceDroppableId.includes('-')) {
          const sourceSlot = updatedSlots.find(slot => slot.id === sourceDroppableId);
          if (sourceSlot) {
            sourceSlot.assignedMembers.splice(source.index, 1);
          }
        }

        // Add to destination slot
        targetSlot.assignedMembers.splice(destination.index, 0, draggedMember);
        setScheduleSlots(updatedSlots);

        toast({
          title: "Schedule Updated",
          description: `${draggedMember.full_name} assigned to ${targetSlot.day}`,
        });
      }
    }
  };

  const handleTemplateCreated = () => {
    fetchData(); // Refresh data
    setShowTemplateManager(false);
  };

  const handleScheduleSubmit = async (scheduleData: any) => {
    try {
      const { data: assignments, error } = await supabase
        .from("schedule_assignments")
        .insert({
          business_id: businessId,
          week_start_date: format(selectedWeek, 'yyyy-MM-dd'),
          schedule_data: JSON.parse(JSON.stringify({
            slots: scheduleSlots,
            week_start: format(selectedWeek, 'yyyy-MM-dd'),
            created_by: user.id
          })),
          status: 'published',
          submitted_by: user.id,
          submitted_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      // Get all assigned team member IDs from the schedule
      const assignedUserIds = Array.from(new Set(
        scheduleSlots.flatMap(slot => slot.assignedMembers.map(member => member.id))
      ));

      // Send push notifications to assigned team members
      if (assignedUserIds.length > 0 && scheduleData.notifications?.push) {
        const { error: notificationError } = await supabase.functions.invoke('send-schedule-notification', {
          body: {
            scheduleId: assignments[0]?.id,
            action: 'created',
            managerName: user?.user_metadata?.full_name || 'Manager',
            userIds: assignedUserIds
          }
        });

        if (notificationError) {
          console.error('Error sending push notifications:', notificationError);
          toast({
            title: "Warning",
            description: "Schedule published but push notifications failed to send",
            variant: "destructive"
          });
        }
      }

      toast({
        title: "Schedule Published",
        description: `Team schedule published successfully${assignedUserIds.length > 0 ? ' and notifications sent' : ''}`,
      });

      setShowSubmissionDialog(false);
    } catch (error) {
      console.error("Error submitting schedule:", error);
      toast({
        title: "Error",
        description: "Failed to publish schedule",
        variant: "destructive",
      });
    }
  };

  const MemberCard = ({ member, index, source }: { member: TeamMember; index: number; source: string }) => (
    <Draggable draggableId={`${source}-${member.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-3 mb-2 rounded-lg border transition-all duration-200 cursor-grab active:cursor-grabbing ${
            snapshot.isDragging 
              ? 'bg-primary/10 border-primary shadow-lg scale-105' 
              : member.position_type === 'opener'
                ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                : 'bg-green-50 border-green-200 hover:bg-green-100'
          }`}
        >
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              member.position_type === 'opener' ? 'bg-blue-500' : 'bg-green-500'
            }`} />
            <div>
              <p className="font-medium text-sm">{member.full_name}</p>
              <Badge variant="outline" className="text-xs mt-1">
                {member.position_type}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Schedule Builder</h2>
          <p className="text-muted-foreground">
            Create permanent shift templates and build schedules with drag & drop
          </p>
        </div>
        
        {canManage && (
          <div className="flex gap-2">
            <Dialog open={showTemplateManager} onOpenChange={setShowTemplateManager}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Layers className="h-4 w-4 mr-2" />
                  Manage Templates
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Shift Template Manager</DialogTitle>
                </DialogHeader>
                <ShiftTemplateManager 
                  businessId={businessId}
                  onTemplateCreated={handleTemplateCreated}
                />
              </DialogContent>
            </Dialog>
            
            <Button onClick={() => setShowSubmissionDialog(true)}>
              <Send className="h-4 w-4 mr-2" />
              Publish Schedule
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="builder">Schedule Builder</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Team Members Pool */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500" />
                      Openers ({openers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Droppable droppableId="openers">
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[200px] transition-colors ${
                            snapshot.isDraggingOver ? 'bg-blue-50' : ''
                          }`}
                        >
                          {openers.map((member, index) => (
                            <MemberCard 
                              key={member.id} 
                              member={member} 
                              index={index} 
                              source="openers"
                            />
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500" />
                      Upsellers ({upsellers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Droppable droppableId="upsellers">
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[200px] transition-colors ${
                            snapshot.isDraggingOver ? 'bg-green-50' : ''
                          }`}
                        >
                          {upsellers.map((member, index) => (
                            <MemberCard 
                              key={member.id} 
                              member={member} 
                              index={index}
                              source="upsellers"
                            />
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </CardContent>
                </Card>
              </div>

              {/* Schedule Grid */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Week of {format(selectedWeek, 'MMM d, yyyy')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-2">
                      {daysOfWeek.map((day, dayIndex) => {
                        const daySlots = scheduleSlots.filter(slot => slot.dayIndex === dayIndex);
                        
                        return (
                          <div key={day} className="space-y-2">
                            <div className="font-medium text-center p-2 border-b">
                              {day.slice(0, 3)}
                            </div>
                            
                            {daySlots.map((slot) => (
                              <Droppable key={slot.id} droppableId={slot.id}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`min-h-[120px] p-2 border rounded-lg transition-all ${
                                      snapshot.isDraggingOver 
                                        ? 'bg-primary/10 border-primary' 
                                        : 'bg-muted/30 hover:bg-muted/50'
                                    }`}
                                  >
                                    {slot.template && (
                                      <div className="text-xs font-medium mb-2 space-y-1">
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {slot.template.start_time} - {slot.template.end_time}
                                        </div>
                                        <div className="flex gap-1">
                                          <Badge variant="outline" className="text-xs px-1">
                                            {slot.template.required_openers}O
                                          </Badge>
                                          <Badge variant="outline" className="text-xs px-1">
                                            {slot.template.required_upsellers}U
                                          </Badge>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {slot.assignedMembers.map((member, index) => (
                                      <Draggable 
                                        key={`${slot.id}-${member.id}`} 
                                        draggableId={`${slot.id}-${member.id}`} 
                                        index={index}
                                      >
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`p-2 mb-1 rounded text-xs transition-all cursor-grab active:cursor-grabbing ${
                                              snapshot.isDragging 
                                                ? 'bg-primary text-primary-foreground shadow-lg' 
                                                : member.position_type === 'opener' 
                                                  ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                                  : 'bg-green-100 text-green-900 border border-green-200'
                                            }`}
                                          >
                                            <div className="font-medium">{member.full_name}</div>
                                            <div className="opacity-75">{member.position_type}</div>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    
                                    {provided.placeholder}
                                    
                                    {slot.assignedMembers.length === 0 && !slot.template && (
                                      <div className="text-xs text-muted-foreground text-center py-4">
                                        No shift template
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Droppable>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DragDropContext>
        </TabsContent>

        <TabsContent value="templates">
          <ShiftTemplateManager 
            businessId={businessId}
            onTemplateCreated={handleTemplateCreated}
          />
        </TabsContent>
      </Tabs>

      {/* Schedule Submission Dialog */}
      {showSubmissionDialog && (
        <ScheduleSubmissionDialog
          scheduleData={scheduleSlots}
          weekStart={selectedWeek}
          onSubmit={handleScheduleSubmit}
          onClose={() => setShowSubmissionDialog(false)}
        />
      )}
    </div>
  );
};