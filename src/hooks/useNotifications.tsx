import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_NOTIFICATION,
  DELETE_NOTIFICATION,
  GET_NOTIFICATIONS,
  MARK_ALL_NOTIFICATION_READ,
  Mutation,
  MutationCreateNotificationArgs,
  MutationDeleteNotificationArgs,
  MutationUpdateNotificationArgs,
  Notification,
  NotificationType,
  Query,
  UPDATE_NOTIFICATION,
} from "@/graphql";

/**
 * Hook for managing real-time notifications
 */
export const useNotifications = () => {
  const { user, business } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { data, loading, refetch } = useQuery<Query>(GET_NOTIFICATIONS, {
    fetchPolicy: "network-only",
    pollInterval: 2 * 60 * 1000,
  });
  const [createNotification] = useMutation<
    Mutation,
    MutationCreateNotificationArgs
  >(CREATE_NOTIFICATION, { fetchPolicy: "network-only" });
  const [updateNotification] = useMutation<
    Mutation,
    MutationUpdateNotificationArgs
  >(UPDATE_NOTIFICATION);
  const [markAllRead] = useMutation<Mutation>(MARK_ALL_NOTIFICATION_READ);
  const [deleteNotification] = useMutation<
    Mutation,
    MutationDeleteNotificationArgs
  >(DELETE_NOTIFICATION);

  useEffect(() => {
    if (data?.getNotifications) {
      setNotifications(data.getNotifications);

      setUnreadCount(
        data.getNotifications.filter((item) => !item.is_read).length,
      );
    }
  }, [data]);

  // TODO
  // Set up real-time subscription for new notifications
  // useRealtime(
  //   business?.id
  //     ? [
  //         {
  //           table: "notifications",
  //           filter: `business_id=eq.${business?.id}`,
  //           onInsert: (payload) => {
  //             const newNotification = payload.new as Notification;
  //
  //             // Only show notifications for current user or global notifications
  //             if (
  //               !newNotification.user_id ||
  //               newNotification.user_id === user?.id
  //             ) {
  //               setNotifications((prev) => [newNotification, ...prev]);
  //               setUnreadCount((prev) => prev + 1);
  //
  //               // Show toast for new notifications
  //               toast({
  //                 title: newNotification.title,
  //                 description: newNotification.message,
  //               });
  //             }
  //           },
  //           onUpdate: (payload) => {
  //             const updatedNotification = payload.new as Notification;
  //             setNotifications((prev) =>
  //               prev.map((n) =>
  //                 n.id === updatedNotification.id ? updatedNotification : n,
  //               ),
  //             );
  //
  //             // Update unread count
  //             if (updatedNotification.is_read) {
  //               setUnreadCount((prev) => Math.max(0, prev - 1));
  //             }
  //           },
  //           onDelete: (payload) => {
  //             const deletedId = payload.old.id;
  //             setNotifications((prev) =>
  //               prev.filter((n) => n.id !== deletedId),
  //             );
  //           },
  //         },
  //       ]
  //     : [],
  //   business?.id || undefined,
  // );

  const markAsRead = (notificationId: string) => {
    updateNotification({
      variables: {
        input: {
          id: notificationId,
          is_read: true,
        },
      },
    }).then(() => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });
  };

  const markAllAsRead = async () => {
    if (!business?.id || !user) return;

    markAllRead().then(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

      setUnreadCount(0);
    });
  };

  const handleCreate = (
    type: NotificationType,
    title: string,
    message: string,
    data: any = {},
    userId?: string | null,
    expiresAt?: Date,
  ) => {
    if (!business?.id) return;

    return createNotification({
      variables: {
        input: {
          userId,
          type,
          title,
          message,
          data,
          expires_at: expiresAt?.toISOString(),
        },
      },
    });
  };

  const handleDelete = async (notificationId: string) => {
    deleteNotification({ variables: { id: notificationId } }).then(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    });
  };

  return {
    loading,
    refetchNotifications: refetch,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification: handleCreate,
    deleteNotification: handleDelete,
  };
};
