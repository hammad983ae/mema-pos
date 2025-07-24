import { createContext, useContext, useState, ReactNode } from "react";
import { useReactiveVar } from "@apollo/client";
import { UserBusiness } from "@/graphql";

interface RealtimeContextType {
  businessId: string | null;
  isConnected: boolean;
  connectionStatus: "connecting" | "connected" | "disconnected";
}

const RealtimeContext = createContext<RealtimeContextType>({
  businessId: null,
  isConnected: false,
  connectionStatus: "disconnected",
});

interface RealtimeProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages global realtime connection state
 * and provides business context for all realtime features
 */
export const RealtimeProvider = ({ children }: RealtimeProviderProps) => {
  const business = useReactiveVar(UserBusiness);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");

  // useEffect(() => {
  //   if (!businessId) {
  //     setConnectionStatus("disconnected");
  //     return;
  //   }
  //
  //   setConnectionStatus("connecting");
  //
  //   // Create a test channel to monitor connection status
  //   const statusChannel = supabase.channel(`status_${businessId}`);
  //
  //   statusChannel.subscribe((status) => {
  //     console.log("Realtime connection status:", status);
  //     if (status === "SUBSCRIBED") {
  //       setConnectionStatus("connected");
  //     } else if (status === "CLOSED") {
  //       setConnectionStatus("disconnected");
  //     }
  //   });
  //
  //   return () => {
  //     supabase.removeChannel(statusChannel);
  //     setConnectionStatus("disconnected");
  //   };
  // }, [businessId]);

  // Update user presence when page visibility changes
  // useEffect(() => {
  //   if (!businessId || !user) return;
  //
  //   const updatePresence = async (status: "online" | "away") => {
  //     await supabase.from("user_presence").upsert(
  //       {
  //         business_id: businessId,
  //         user_id: user.id,
  //         status,
  //         last_seen: new Date().toISOString(),
  //         current_page: window.location.pathname,
  //       },
  //       {
  //         onConflict: "business_id,user_id",
  //       },
  //     );
  //   };

  //   const handleVisibilityChange = () => {
  //     if (document.visibilityState === "visible") {
  //       updatePresence("online");
  //     } else {
  //       updatePresence("away");
  //     }
  //   };
  //
  //   const handleBeforeUnload = () => {
  //     updatePresence("away");
  //   };
  //
  //   // Set initial presence
  //   updatePresence("online");
  //
  //   // Listen for visibility changes
  //   document.addEventListener("visibilitychange", handleVisibilityChange);
  //   window.addEventListener("beforeunload", handleBeforeUnload);
  //
  //   return () => {
  //     document.removeEventListener("visibilitychange", handleVisibilityChange);
  //     window.removeEventListener("beforeunload", handleBeforeUnload);
  //     updatePresence("away");
  //   };
  // }, [businessId, user]);

  const value: RealtimeContextType = {
    businessId: business?.id,
    isConnected: connectionStatus === "connected",
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
    throw new Error(
      "useRealtimeContext must be used within a RealtimeProvider",
    );
  }
  return context;
};
