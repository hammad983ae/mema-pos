import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeContextType {
  businessId: string | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

const RealtimeContext = createContext<RealtimeContextType>({
  businessId: null,
  isConnected: false,
  connectionStatus: 'disconnected',
});

interface RealtimeProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages global realtime connection state
 * and provides business context for all realtime features
 */
export const RealtimeProvider = ({ children }: RealtimeProviderProps) => {
  const { user, hasBusinessAssociation } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  // Get user's business ID when authentication state changes
  useEffect(() => {
    const getUserBusiness = async () => {
      if (!user || !hasBusinessAssociation) {
        setBusinessId(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_business_memberships')
          .select('business_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1);

        if (data && data.length > 0 && !error) {
          setBusinessId(data[0].business_id);
        } else {
          setBusinessId(null);
        }
      } catch (error) {
        console.error('Error fetching business ID:', error);
        setBusinessId(null);
      }
    };

    getUserBusiness();
  }, [user, hasBusinessAssociation]);

  // Monitor Supabase connection status
  useEffect(() => {
    if (!businessId) {
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connecting');

    // Create a test channel to monitor connection status
    const statusChannel = supabase.channel(`status_${businessId}`);

    statusChannel
      .subscribe((status) => {
        console.log('Realtime connection status:', status);
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CLOSED') {
          setConnectionStatus('disconnected');
        }
      });

    return () => {
      supabase.removeChannel(statusChannel);
      setConnectionStatus('disconnected');
    };
  }, [businessId]);

  // Update user presence when page visibility changes
  useEffect(() => {
    if (!businessId || !user) return;

    const updatePresence = async (status: 'online' | 'away') => {
      await supabase
        .from('user_presence')
        .upsert({
          business_id: businessId,
          user_id: user.id,
          status,
          last_seen: new Date().toISOString(),
          current_page: window.location.pathname,
        }, {
          onConflict: 'business_id,user_id'
        });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence('online');
      } else {
        updatePresence('away');
      }
    };

    const handleBeforeUnload = () => {
      updatePresence('away');
    };

    // Set initial presence
    updatePresence('online');

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updatePresence('away');
    };
  }, [businessId, user]);

  const value: RealtimeContextType = {
    businessId,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtimeContext = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
};