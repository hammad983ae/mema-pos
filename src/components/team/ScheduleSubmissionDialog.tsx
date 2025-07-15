import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Send,
  Calendar,
  Users,
  Clock,
  Bell,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

interface ScheduleSlot {
  id: string;
  day: string;
  dayIndex: number;
  template?: {
    template_name: string;
    start_time: string;
    end_time: string;
    required_openers: number;
    required_upsellers: number;
  };
  assignedMembers: {
    id: string;
    full_name: string;
    position_type: 'opener' | 'upseller';
  }[];
}

interface ScheduleSubmissionDialogProps {
  scheduleData: ScheduleSlot[];
  weekStart: Date;
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
}

export const ScheduleSubmissionDialog = ({
  scheduleData,
  weekStart,
  onSubmit,
  onClose
}: ScheduleSubmissionDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [sendPushNotifications, setSendPushNotifications] = useState(true);

  // Analyze schedule data
  const totalShifts = scheduleData.filter(slot => slot.assignedMembers.length > 0).length;
  const totalAssignments = scheduleData.reduce((sum, slot) => sum + slot.assignedMembers.length, 0);
  const understaffedShifts = scheduleData.filter(slot => {
    if (!slot.template) return false;
    const openers = slot.assignedMembers.filter(m => m.position_type === 'opener').length;
    const upsellers = slot.assignedMembers.filter(m => m.position_type === 'upseller').length;
    return openers < slot.template.required_openers || upsellers < slot.template.required_upsellers;
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        scheduleData,
        notes,
        notifications: {
          push: sendPushNotifications
        }
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getScheduleSummary = () => {
    const summary: { [key: string]: any } = {};
    
    scheduleData.forEach(slot => {
      if (slot.assignedMembers.length > 0) {
        if (!summary[slot.day]) {
          summary[slot.day] = [];
        }
        summary[slot.day].push({
          template: slot.template,
          members: slot.assignedMembers
        });
      }
    });

    return summary;
  };

  const scheduleSummary = getScheduleSummary();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Publish Schedule - Week of {format(weekStart, 'MMM d, yyyy')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Schedule Overview */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule Overview
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalShifts}</div>
                <div className="text-sm text-blue-600">Total Shifts</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{totalAssignments}</div>
                <div className="text-sm text-green-600">Total Assignments</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{understaffedShifts.length}</div>
                <div className="text-sm text-orange-600">Understaffed</div>
              </div>
            </div>

            {understaffedShifts.length > 0 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-800">Understaffed Shifts</span>
                </div>
                <div className="space-y-1">
                  {understaffedShifts.map((slot, index) => (
                    <div key={index} className="text-sm text-orange-700">
                      {slot.day}: {slot.template?.template_name} - Missing staff
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Schedule Details */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Schedule Details
            </h3>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {Object.entries(scheduleSummary).map(([day, shifts]) => (
                <div key={day} className="border rounded-lg p-3">
                  <div className="font-medium mb-2">{day}</div>
                  {(shifts as any[]).map((shift, shiftIndex) => (
                    <div key={shiftIndex} className="ml-2 mb-2 last:mb-0">
                      {shift.template && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Clock className="h-3 w-3" />
                          {shift.template.start_time} - {shift.template.end_time}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {shift.members.map((member: any) => (
                          <Badge
                            key={member.id}
                            variant={member.position_type === 'opener' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {member.full_name} ({member.position_type})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notification Settings
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send-push"
                  checked={sendPushNotifications}
                  onCheckedChange={(checked) => setSendPushNotifications(checked === true)}
                />
                <Label htmlFor="send-push">Send push notifications to team members' mobile devices</Label>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Team members will receive notifications on their iPhone and Android devices when the schedule is published.
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions or notes for this schedule..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Publish Schedule
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};