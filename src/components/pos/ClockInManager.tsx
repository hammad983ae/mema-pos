import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Clock, 
  LogIn, 
  LogOut, 
  User,
  Users,
  Timer
} from "lucide-react";

interface ClockInManagerProps {
  storeId: string;
  businessId: string;
  currentEmployeeId: string;
}

interface ClockedInEmployee {
  id: string;
  user_id: string;
  clocked_in_at: string;
  profiles: {
    full_name: string;
    username: string;
    avatar_url?: string;
  };
}

const ClockInManager = ({ storeId, businessId, currentEmployeeId }: ClockInManagerProps) => {
  const { toast } = useToast();
  const [clockedInEmployees, setClockedInEmployees] = useState<ClockedInEmployee[]>([]);
  const [currentEmployeeStatus, setCurrentEmployeeStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClockedInEmployees();
    fetchCurrentEmployeeStatus();
  }, [storeId, currentEmployeeId]);

  const fetchClockedInEmployees = async () => {
    try {
      // First get the clocked in status records
      const { data: clockData, error: clockError } = await supabase
        .from('employee_clock_status')
        .select('id, user_id, clocked_in_at')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .is('clocked_out_at', null)
        .order('clocked_in_at', { ascending: false });

      if (clockError) throw clockError;

      if (!clockData || clockData.length === 0) {
        setClockedInEmployees([]);
        return;
      }

      // Then get profile data for those users
      const userIds = clockData.map(item => item.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      // Combine the data
      const combinedData = clockData.map(clockItem => {
        const profile = profileData?.find(p => p.user_id === clockItem.user_id);
        return {
          ...clockItem,
          profiles: profile || {
            full_name: 'Unknown',
            username: 'unknown',
            avatar_url: null
          }
        };
      });

      setClockedInEmployees(combinedData);
    } catch (error) {
      console.error('Error fetching clocked in employees:', error);
    }
  };

  const fetchCurrentEmployeeStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_clock_status')
        .select('*')
        .eq('user_id', currentEmployeeId)
        .eq('store_id', storeId)
        .eq('is_active', true)
        .is('clocked_out_at', null)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentEmployeeStatus(data);
    } catch (error) {
      console.error('Error fetching current employee status:', error);
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('employee_clock_status')
        .insert({
          user_id: currentEmployeeId,
          store_id: storeId,
          business_id: businessId,
          clocked_in_at: new Date().toISOString(),
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Clocked In",
        description: "You have been clocked in successfully.",
      });

      await fetchClockedInEmployees();
      await fetchCurrentEmployeeStatus();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentEmployeeStatus) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('employee_clock_status')
        .update({
          clocked_out_at: new Date().toISOString(),
          is_active: false
        })
        .eq('id', currentEmployeeStatus.id);

      if (error) throw error;

      toast({
        title: "Clocked Out",
        description: "You have been clocked out successfully.",
      });

      await fetchClockedInEmployees();
      await fetchCurrentEmployeeStatus();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSinceClockIn = (timestamp: string) => {
    const now = new Date();
    const clockInTime = new Date(timestamp);
    const diffMs = now.getTime() - clockInTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  return (
    <div className="space-y-4">
      {/* Current Employee Clock Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Your Clock Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                <span className="text-sm">
                  {currentEmployeeStatus ? (
                    <>
                      Clocked in at {formatTime(currentEmployeeStatus.clocked_in_at)}
                      <Badge variant="secondary" className="ml-2">
                        {getTimeSinceClockIn(currentEmployeeStatus.clocked_in_at)}
                      </Badge>
                    </>
                  ) : (
                    "Not clocked in"
                  )}
                </span>
              </div>
            </div>
            
            {currentEmployeeStatus ? (
              <Button 
                onClick={handleClockOut} 
                disabled={loading}
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Clock Out
              </Button>
            ) : (
              <Button 
                onClick={handleClockIn} 
                disabled={loading}
                className="bg-success hover:bg-success/90"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Clock In
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Currently Clocked In Employees */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clocked In Employees ({clockedInEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clockedInEmployees.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No employees currently clocked in</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clockedInEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={employee.profiles.avatar_url} />
                      <AvatarFallback>
                        {employee.profiles.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{employee.profiles.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        @{employee.profiles.username}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Since {formatTime(employee.clocked_in_at)}
                    </p>
                    <Badge variant="outline">
                      {getTimeSinceClockIn(employee.clocked_in_at)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClockInManager;