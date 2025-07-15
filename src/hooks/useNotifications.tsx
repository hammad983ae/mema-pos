import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRealtime } from './useRealtime';
import { useToast } from './use-toast';

interface Notification {
  id: string;
  business_id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
  expires_at: string | null;
}

/**
 * Hook for managing real-time notifications
 */
export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Get user's business ID
  useEffect(() => {
    const getUserBusiness = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('user_business_memberships')
        .select('business_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (data) {
        setBusinessId(data.business_id);
      }
    };

    getUserBusiness();
  }, [user]);

  // Load initial notifications
  useEffect(() => {
    const loadNotifications = async () => {
      if (!businessId) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('business_id', businessId)
        .or(`user_id.is.null,user_id.eq.${user?.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data && !error) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    };

    loadNotifications();
  }, [businessId, user]);

  // Set up real-time subscription for new notifications
  useRealtime(
    businessId
      ? [
          {
            table: 'notifications',
            filter: `business_id=eq.${businessId}`,
            onInsert: (payload) => {
              const newNotification = payload.new as Notification;
              
              // Only show notifications for current user or global notifications
              if (!newNotification.user_id || newNotification.user_id === user?.id) {
                setNotifications(prev => [newNotification, ...prev]);
                setUnreadCount(prev => prev + 1);

                // Show toast for new notifications
                toast({
                  title: newNotification.title,
                  description: newNotification.message,
                });
              }
            },
            onUpdate: (payload) => {
              const updatedNotification = payload.new as Notification;
              setNotifications(prev =>
                prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
              );
              
              // Update unread count
              if (updatedNotification.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
              }
            },
            onDelete: (payload) => {
              const deletedId = payload.old.id;
              setNotifications(prev => prev.filter(n => n.id !== deletedId));
            },
          },
        ]
      : [],
    businessId || undefined
  );

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!businessId || !user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('business_id', businessId)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const createNotification = async (
    type: string,
    title: string,
    message: string,
    data: any = {},
    userId?: string | null,
    expiresAt?: Date
  ) => {
    if (!businessId) return;

    const { error } = await supabase
      .from('notifications')
      .insert({
        business_id: businessId,
        user_id: userId || null,
        type,
        title,
        message,
        data,
        expires_at: expiresAt?.toISOString(),
      });

    if (error) {
      console.error('Error creating notification:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification,
  };
};