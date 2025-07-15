import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, FileText, Check, X, Plus, Filter } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";

interface TimeOffRequest {
  id: string;
  user_id: string;
  request_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes?: string;
  profiles?: {
    full_name: string;
  };
}

interface TimeOffManagerProps {
  userRole: string;
}

export const TimeOffManager = ({ userRole }: TimeOffManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [businessId, setBusinessId] = useState<string>("");

  const canManageTimeOff = userRole === 'business_owner' || userRole === 'manager';
  const canViewAll = canManageTimeOff;

  useEffect(() => {
    if (user) {
      fetchTimeOffData();
    }
  }, [user, filter]);

  const fetchTimeOffData = async () => {
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

      setBusinessId(membershipData.business_id);

      // For now, using mock data since time_off_requests table doesn't exist yet
      const mockRequests: TimeOffRequest[] = [
        {
          id: '1',
          user_id: user.id,
          request_type: 'vacation',
          start_date: '2024-01-25',
          end_date: '2024-01-26',
          reason: 'Family vacation',
          status: 'pending',
          submitted_at: '2024-01-20T10:00:00Z',
          profiles: { full_name: 'Current User' }
        },
        {
          id: '2',
          user_id: 'other-user-1',
          request_type: 'sick',
          start_date: '2024-01-22',
          end_date: '2024-01-22',
          reason: 'Doctor appointment',
          status: 'approved',
          submitted_at: '2024-01-21T14:30:00Z',
          reviewed_at: '2024-01-21T16:00:00Z',
          reviewed_by: user.id,
          profiles: { full_name: 'John Doe' }
        },
        {
          id: '3',
          user_id: 'other-user-2',
          request_type: 'personal',
          start_date: '2024-01-30',
          end_date: '2024-01-31',
          reason: 'Moving to new apartment',
          status: 'rejected',
          submitted_at: '2024-01-19T09:15:00Z',
          reviewed_at: '2024-01-20T11:00:00Z',
          reviewed_by: user.id,
          notes: 'Need coverage during this period',
          profiles: { full_name: 'Jane Smith' }
        }
      ];

      // Filter based on user permissions and selected filter
      let filteredRequests = mockRequests;
      
      if (!canViewAll) {
        filteredRequests = mockRequests.filter(req => req.user_id === user.id);
      }

      if (filter !== 'all') {
        filteredRequests = filteredRequests.filter(req => req.status === filter);
      }

      setRequests(filteredRequests);

    } catch (error) {
      console.error("Error fetching time off data:", error);
      toast({
        title: "Error",
        description: "Failed to load time off requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (requestData: any) => {
    try {
      // In a real implementation, you'd insert into time_off_requests table
      console.log("Submitting time off request:", requestData);

      toast({
        title: "Success",
        description: "Time off request submitted successfully",
      });

      setIsDialogOpen(false);
      fetchTimeOffData();

    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Error",
        description: "Failed to submit time off request",
        variant: "destructive",
      });
    }
  };

  const handleReviewRequest = async (requestId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      // In a real implementation, you'd update the request status
      console.log(`${action}ing request ${requestId}`, notes);

      toast({
        title: "Success",
        description: `Request ${action}d successfully`,
      });

      fetchTimeOffData();

    } catch (error) {
      console.error("Error reviewing request:", error);
      toast({
        title: "Error",
        description: `Failed to ${action} request`,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'vacation':
        return 'text-blue-600';
      case 'sick':
        return 'text-red-600';
      case 'personal':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    return differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading time off requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Time Off Management</h2>
          <p className="text-muted-foreground">
            {canViewAll ? 'Manage team time off requests' : 'View and submit your time off requests'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Request Time Off
              </Button>
            </DialogTrigger>
            <TimeOffDialog
              onSubmit={handleSubmitRequest}
              onClose={() => setIsDialogOpen(false)}
            />
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No time off requests</h3>
                <p className="text-muted-foreground">
                  {filter === 'all' ? 'No requests found' : `No ${filter} requests found`}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {request.profiles?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{request.profiles?.full_name || 'Unknown'}</h3>
                      <p className="text-sm text-muted-foreground">
                        Submitted {format(parseISO(request.submitted_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Type</p>
                      <p className={`text-sm capitalize ${getRequestTypeColor(request.request_type)}`}>
                        {request.request_type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Dates</p>
                      <p className="text-sm">
                        {format(parseISO(request.start_date), 'MMM d')} - {format(parseISO(request.end_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm">
                        {calculateDays(request.start_date, request.end_date)} day(s)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-1">Reason</p>
                  <p className="text-sm text-muted-foreground">{request.reason}</p>
                </div>

                {request.notes && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-1">Manager Notes</p>
                    <p className="text-sm text-muted-foreground">{request.notes}</p>
                  </div>
                )}

                {request.status === 'pending' && canManageTimeOff && request.user_id !== user.id && (
                  <div className="flex space-x-2 pt-4 border-t">
                    <Button
                      size="sm"
                      onClick={() => handleReviewRequest(request.id, 'approve')}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReviewRequest(request.id, 'reject')}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}

                {request.reviewed_at && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      {request.status === 'approved' ? 'Approved' : 'Rejected'} on {format(parseISO(request.reviewed_at), 'MMM d, yyyy \'at\' h:mm a')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

interface TimeOffDialogProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
}

const TimeOffDialog = ({ onSubmit, onClose }: TimeOffDialogProps) => {
  const [formData, setFormData] = useState({
    request_type: '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const requestTypes = [
    { value: 'vacation', label: 'Vacation' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'personal', label: 'Personal Day' },
    { value: 'emergency', label: 'Emergency' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isEndDateValid = formData.start_date && formData.end_date 
    ? parseISO(formData.end_date) >= parseISO(formData.start_date)
    : true;

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Request Time Off</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="request_type">Type of Request</Label>
          <Select
            value={formData.request_type}
            onValueChange={(value) => setFormData({ ...formData, request_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select request type" />
            </SelectTrigger>
            <SelectContent>
              {requestTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div>
            <Label htmlFor="end_date">End Date</Label>
            <Input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              min={formData.start_date || new Date().toISOString().split('T')[0]}
              required
            />
            {!isEndDateValid && (
              <p className="text-xs text-destructive mt-1">End date must be after start date</p>
            )}
          </div>
        </div>

        {formData.start_date && formData.end_date && isEndDateValid && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Duration:</strong> {differenceInDays(parseISO(formData.end_date), parseISO(formData.start_date)) + 1} day(s)
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="reason">Reason</Label>
          <Textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Please provide a brief reason for your time off request..."
            rows={3}
            required
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!formData.request_type || !formData.start_date || !formData.end_date || !formData.reason || !isEndDateValid}
          >
            Submit Request
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};