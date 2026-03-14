import React, { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { 
  subscribeToNotifications, 
  markNotificationAsRead,
  markAllNotificationsAsRead 
} from "../services/notificationService";

export const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    console.log("📡 Setting up real-time notification listener for:", user.uid);
    setLoading(true);

    // Subscribe to real-time notifications
    const unsubscribe = subscribeToNotifications(user.uid, (newNotifications) => {
      console.log("📬 Notifications updated:", newNotifications.length);
      setNotifications(newNotifications);
      
      // Count unread
      const unread = newNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log("🔌 Unsubscribing from notifications");
      unsubscribe();
    };
  }, [user?.uid]);

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.uid) return;
    
    try {
      await markAllNotificationsAsRead(user.uid);
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
