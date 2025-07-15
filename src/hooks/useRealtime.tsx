import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeSubscription {
  table: string;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

/**
 * Custom hook for managing Supabase realtime subscriptions
 * Automatically handles subscription cleanup and reconnection
 */
export const useRealtime = (subscriptions: RealtimeSubscription[], businessId?: string) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!businessId || subscriptions.length === 0) return;

    // Create a unique channel for this business
    const channelName = `business_${businessId}_realtime`;
    const channel = supabase.channel(channelName);

    // Set up subscriptions for each table
    subscriptions.forEach(({ table, filter, onInsert, onUpdate, onDelete }) => {
      const config: any = {
        event: '*',
        schema: 'public',
        table,
      };

      if (filter) {
        config.filter = filter;
      }

      channel.on('postgres_changes', config, (payload) => {
        console.log(`Realtime ${payload.eventType} for ${table}:`, payload);

        switch (payload.eventType) {
          case 'INSERT':
            onInsert?.(payload);
            break;
          case 'UPDATE':
            onUpdate?.(payload);
            break;
          case 'DELETE':
            onDelete?.(payload);
            break;
        }
      });
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log(`Realtime subscription status: ${status}`);
    });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [businessId, subscriptions]);

  return {
    isConnected: channelRef.current?.state === 'joined',
    channel: channelRef.current,
  };
};

/**
 * Hook for tracking user presence in real-time
 */
export const useUserPresence = (businessId: string) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!businessId) return;

    const channel = supabase.channel(`presence_${businessId}`);

    // Track current user's presence
    const userStatus = {
      user_id: supabase.auth.getUser().then(({ data }) => data.user?.id),
      status: 'online',
      last_seen: new Date().toISOString(),
      current_page: window.location.pathname,
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        console.log('User presence sync:', presenceState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const user = await supabase.auth.getUser();
          if (user.data.user) {
            await channel.track({
              ...userStatus,
              user_id: user.data.user.id,
            });
          }
        }
      });

    channelRef.current = channel;

    // Update presence on page visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        channel.track({ ...userStatus, status: 'online' });
      } else {
        channel.track({ ...userStatus, status: 'away' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [businessId]);

  const getPresenceState = () => {
    return channelRef.current?.presenceState() || {};
  };

  return {
    channel: channelRef.current,
    getPresenceState,
    isConnected: channelRef.current?.state === 'joined',
  };
};