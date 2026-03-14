import React, { useContext, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import MainNavigator from "./MainNavigator";
import AuthNavigator from "./AuthNavigator";
import { AuthProvider, AuthContext } from "../context/AuthContext";
import { NotificationProvider } from "../context/NotificationContext";
import { View, ActivityIndicator } from "react-native";
import { 
  registerForPushNotificationsAsync, 
  savePushToken,
  setupNotificationListeners 
} from "../services/pushNotificationService";

function RootNavigator() {
  const { user, initializing } = useContext(AuthContext);
  
  // Register for push notifications when user logs in
  useEffect(() => {
    if (!user?.uid) return;
    
    let cleanupListeners;
    
    (async () => {
      try {
        console.log("📱 Registering for push notifications...");
        const token = await registerForPushNotificationsAsync();
        
        if (token) {
          await savePushToken(user.uid, token);
          console.log("✅ Push notifications registered");
        }
        
        // Setup listeners for incoming notifications
        cleanupListeners = setupNotificationListeners(
          (notification) => {
            // Handle notification received while app is open
            console.log("📬 Received notification:", notification);
          },
          (response) => {
            // Handle notification tap
            console.log("👆 User tapped notification:", response);
            // TODO: Navigate to appropriate screen based on notification data
          }
        );
      } catch (error) {
        console.error("❌ Error setting up push notifications:", error);
      }
    })();
    
    return () => {
      if (cleanupListeners) cleanupListeners();
    };
  }, [user?.uid]);
  
  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }
  
  return user ? <MainNavigator /> : <AuthNavigator />;
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </NotificationProvider>
    </AuthProvider>
  );
}


