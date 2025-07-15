import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserPresence } from '@/hooks/useRealtime';
import { supabase } from '@/integrations/supabase/client';

interface UserPresenceProps {
  businessId: string;
}

interface PresenceUser {
  user_id: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string;
  current_page?: string;
  profile?: {
    full_name: string;
    email: string;
  };
}

export const UserPresence = ({ businessId }: UserPresenceProps) => {
  const { getPresenceState, isConnected } = useUserPresence(businessId);
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    const updateUsers = () => {
      const presenceState = getPresenceState();
      const presentUsers: PresenceUser[] = [];

      Object.keys(presenceState).forEach(key => {
        const presences = presenceState[key];
        if (presences && presences.length > 0) {
          const latest = presences[0];
          if (latest && typeof latest === 'object') {
            // Extract the properties we need, providing defaults
            const user: PresenceUser = {
              user_id: (latest as any).user_id || key,
              status: (latest as any).status || 'online',
              last_seen: (latest as any).last_seen || new Date().toISOString(),
              current_page: (latest as any).current_page,
            };
            presentUsers.push(user);
          }
        }
      });

      // Only update if users actually changed
      setUsers(prev => {
        if (prev.length !== presentUsers.length) return presentUsers;
        const hasChanged = presentUsers.some(newUser => 
          !prev.find(prevUser => 
            prevUser.user_id === newUser.user_id && 
            prevUser.status === newUser.status
          )
        );
        return hasChanged ? presentUsers : prev;
      });
    };

    // Update users when presence changes
    updateUsers();
    
    // Set up interval to refresh presence state
    const interval = setInterval(updateUsers, 5000);
    
    return () => clearInterval(interval);
  }, [getPresenceState, isConnected]);

  // Load user profiles only when user IDs change
  useEffect(() => {
    const loadProfiles = async () => {
      if (users.length === 0) return;

      const userIds = users.map(u => u.user_id).filter(Boolean);
      if (userIds.length === 0) return;
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      if (profiles) {
        setUsers(prev => prev.map(user => ({
          ...user,
          profile: profiles.find(p => p.user_id === user.user_id) || user.profile,
        })));
      }
    };

    // Only load profiles if we have users without profiles
    const needsProfiles = users.some(user => !user.profile);
    if (needsProfiles) {
      loadProfiles();
    }
  }, [users.map(u => u.user_id).join(',')]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      default:
        return 'Offline';
    }
  };

  if (!isConnected || users.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No users online
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Team:</span>
        <div className="flex items-center -space-x-2">
          {users.slice(0, 5).map((user) => (
            <Tooltip key={user.user_id}>
              <TooltipTrigger>
                <div className="relative">
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs">
                      {user.profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(user.status)}`} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <div className="font-medium">
                    {user.profile?.full_name || user.profile?.email || 'Unknown User'}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {getStatusText(user.status)}
                    </Badge>
                    {user.current_page && (
                      <span className="text-xs text-muted-foreground">
                        {user.current_page}
                      </span>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {users.length > 5 && (
            <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
              <span className="text-xs font-medium">+{users.length - 5}</span>
            </div>
          )}
        </div>
        
        <span className="text-xs text-muted-foreground">
          {users.length} online
        </span>
      </div>
    </TooltipProvider>
  );
};