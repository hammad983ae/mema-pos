import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  Play, 
  Square, 
  Coffee, 
  MapPin,
  AlertCircle,
  CheckCircle,
  Timer
} from "lucide-react";
import { format } from "date-fns";

interface TimePunch {
  id: string;
  punch_type: string;
  punch_time: string;
  notes?: string;
}

interface ClockStatus {
  isClockedIn: boolean;
  isOnBreak: boolean;
  currentShift?: {
    clockInTime: string;
    totalHours: number;
    breakTime: number;
    regularHours: number;
    overtimeHours: number;
  };
  todaysPunches: TimePunch[];
}

export const EmployeeTimeClock = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clockStatus, setClockStatus] = useState<ClockStatus>({
    isClockedIn: false,
    isOnBreak: false,
    todaysPunches: []
  });
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Update current time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      fetchTodaysTimePunches();
      getCurrentLocation();
    }
  }, [user]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("Location not available:", error);
          // Continue without location
        }
      );
    }
  };

  const fetchTodaysTimePunches = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('time_punches')
        .select('*')
        .eq('user_id', user.id)
        .gte('punch_time', `${today}T00:00:00.000Z`)
        .lt('punch_time', `${today}T23:59:59.999Z`)
        .order('punch_time', { ascending: true });

      if (error) throw error;

      const punches = data || [];
      setClockStatus(prev => ({
        ...prev,
        todaysPunches: punches,
        isClockedIn: determineClockStatus(punches),
        isOnBreak: determineBreakStatus(punches),
        currentShift: calculateCurrentShift(punches)
      }));

    } catch (error: any) {
      console.error('Error fetching time punches:', error);
      toast({
        title: "Error",
        description: "Failed to load time clock status",
        variant: "destructive",
      });
    }
  };

  const determineClockStatus = (punches: TimePunch[]) => {
    const lastPunch = punches[punches.length - 1];
    if (!lastPunch) return false;
    
    // If last punch is clock_in or break_end, user is clocked in
    return lastPunch.punch_type === 'clock_in' || lastPunch.punch_type === 'break_end';
  };

  const determineBreakStatus = (punches: TimePunch[]) => {
    const lastPunch = punches[punches.length - 1];
    return lastPunch?.punch_type === 'break_start';
  };

  const calculateCurrentShift = (punches: TimePunch[]) => {
    if (punches.length === 0) return undefined;

    const clockInPunch = punches.find(p => p.punch_type === 'clock_in');
    if (!clockInPunch) return undefined;

    const now = new Date();
    const clockInTime = new Date(clockInPunch.punch_time);
    const totalMinutes = Math.floor((now.getTime() - clockInTime.getTime()) / (1000 * 60));
    
    // Calculate break time
    let breakMinutes = 0;
    let currentBreakStart = null;
    
    for (let i = 0; i < punches.length; i++) {
      if (punches[i].punch_type === 'break_start') {
        currentBreakStart = new Date(punches[i].punch_time);
      } else if (punches[i].punch_type === 'break_end' && currentBreakStart) {
        const breakEnd = new Date(punches[i].punch_time);
        breakMinutes += Math.floor((breakEnd.getTime() - currentBreakStart.getTime()) / (1000 * 60));
        currentBreakStart = null;
      }
    }
    
    // If currently on break, add current break time
    if (currentBreakStart) {
      breakMinutes += Math.floor((now.getTime() - currentBreakStart.getTime()) / (1000 * 60));
    }

    const workedMinutes = Math.max(0, totalMinutes - breakMinutes);
    const regularHours = Math.min(workedMinutes / 60, 8); // Regular hours cap at 8
    const overtimeHours = Math.max(0, (workedMinutes / 60) - 8);

    return {
      clockInTime: clockInPunch.punch_time,
      totalHours: workedMinutes / 60,
      breakTime: breakMinutes / 60,
      regularHours,
      overtimeHours
    };
  };

  const handlePunch = async (punchType: string) => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user's business context
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) {
        throw new Error("User not associated with any business");
      }

      const punchData = {
        user_id: user.id,
        business_id: membershipData.business_id,
        punch_type: punchType,
        punch_time: new Date().toISOString(),
        location_lat: location?.lat,
        location_lng: location?.lng,
        notes: notes.trim() || null,
        ip_address: null // Would be set on backend
      };

      const { error } = await supabase
        .from('time_punches')
        .insert([punchData]);

      if (error) throw error;

      // Show success message
      const punchMessages = {
        clock_in: "Clocked in successfully",
        clock_out: "Clocked out successfully", 
        break_start: "Started break",
        break_end: "Ended break"
      };

      toast({
        title: "Success",
        description: punchMessages[punchType as keyof typeof punchMessages],
      });

      // Clear notes and refresh status
      setNotes("");
      await fetchTodaysTimePunches();

    } catch (error: any) {
      console.error('Error recording time punch:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to record time punch",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return format(date, 'h:mm:ss a');
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Current Time Display */}
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-4xl font-bold mb-2">
            {formatTime(currentTime)}
          </div>
          <p className="text-muted-foreground">
            {format(currentTime, 'EEEE, MMMM do, yyyy')}
          </p>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span>Current Status:</span>
            <Badge 
              variant={clockStatus.isClockedIn ? "default" : "secondary"}
              className="flex items-center"
            >
              {clockStatus.isClockedIn ? (
                clockStatus.isOnBreak ? (
                  <>
                    <Coffee className="h-3 w-3 mr-1" />
                    On Break
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Clocked In
                  </>
                )
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Clocked Out
                </>
              )}
            </Badge>
          </div>

          {clockStatus.currentShift && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Shift Started:</span>
                <span>{format(new Date(clockStatus.currentShift.clockInTime), 'h:mm a')}</span>
              </div>
              <div className="flex justify-between">
                <span>Regular Hours:</span>
                <span className="font-medium">
                  {formatDuration(clockStatus.currentShift.regularHours)}
                </span>
              </div>
              {clockStatus.currentShift.overtimeHours > 0 && (
                <div className="flex justify-between">
                  <span>Overtime Hours:</span>
                  <span className="font-medium text-orange-600">
                    {formatDuration(clockStatus.currentShift.overtimeHours)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Break Time:</span>
                <span>{formatDuration(clockStatus.currentShift.breakTime)}</span>
              </div>
            </div>
          )}

          {location && (
            <div className="flex items-center text-xs text-muted-foreground mt-2">
              <MapPin className="h-3 w-3 mr-1" />
              Location verified
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Punch Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Time Clock</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Notes Input */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this time punch..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {!clockStatus.isClockedIn ? (
              <Button
                onClick={() => handlePunch('clock_in')}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                <Play className="h-4 w-4 mr-2" />
                Clock In
              </Button>
            ) : (
              <Button
                onClick={() => handlePunch('clock_out')}
                disabled={loading}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <Square className="h-4 w-4 mr-2" />
                Clock Out
              </Button>
            )}

            {clockStatus.isClockedIn && (
              <Button
                onClick={() => handlePunch(clockStatus.isOnBreak ? 'break_end' : 'break_start')}
                disabled={loading}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Coffee className="h-4 w-4 mr-2" />
                {clockStatus.isOnBreak ? 'End Break' : 'Start Break'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's Activity */}
      {clockStatus.todaysPunches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Timer className="h-5 w-5 mr-2" />
              Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {clockStatus.todaysPunches.map((punch) => (
                <div key={punch.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {punch.punch_type.replace('_', ' ')}
                    </Badge>
                    <span>{format(new Date(punch.punch_time), 'h:mm a')}</span>
                  </div>
                  {punch.notes && (
                    <span className="text-muted-foreground text-xs">
                      {punch.notes}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};