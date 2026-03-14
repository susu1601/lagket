// src/navigation/MainNavigator.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import HomeScreen from "../screens/HomeScreen";
import NotificationScreen from "../screens/NotificationScreen";
import CameraScreen from "../screens/CameraScreen";
import TimelineScreen from "../screens/TimelineScreen";
import DetailScreen from "../screens/DetailScreen";
import MapScreen from "../screens/MapScreen";
import LocationAlbumScreen from "../screens/Gallery/LocationAlbumScreen";
import AlbumScreen from "../screens/AlbumScreen";
import PhotoDetailScreen from "../screens/Gallery/PhotoDetailScreen";
import MyPhotoDetailScreen from "../screens/Gallery/MyPhotoDetailScreen";
import OtherPhotoDetailScreen from "../screens/Gallery/OtherPhotoDetailScreen";
import AlbumByTagScreen from "../screens/AlbumByTagScreen";
import FavoritePhotosScreen from "../screens/FavoritePhotosScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";
import UnifiedFriendsScreen from "../screens/UnifiedFriendsScreen";
import FriendProfileScreen from "../screens/FriendProfileScreen";
import FriendAlbumScreen from "../screens/FriendAlbumScreen";
import MigratePhotosScreen from "../screens/MigratePhotosScreen";
import FamilyRequestScreen from "../screens/FamilyRequestScreen";
import FamilyPhotosScreen from "../screens/FamilyPhotosScreen";
import TestNotificationScreen from "../screens/TestNotificationScreen";
import SearchPhotosScreen from "../screens/SearchPhotosScreen";
import SearchUsersScreen from "../screens/SearchUsersScreen";
import LocketFeedScreen from "../screens/LocketFeedScreen";
import AllPhotosGridScreen from "../screens/AllPhotosGridScreen";
import ChatListScreen from "../screens/Chat/ChatListScreen";
import ChatScreen from "../screens/Chat/ChatScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="SearchPhotos" component={SearchPhotosScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="LocationAlbum" component={LocationAlbumScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Album" component={AlbumScreen} />
      <Stack.Screen name="AlbumByTag" component={AlbumByTagScreen} />
      <Stack.Screen name="FavoritePhotos" component={FavoritePhotosScreen} />
      <Stack.Screen name="FamilyRequest" component={FamilyRequestScreen} />
      <Stack.Screen name="FamilyPhotos" component={FamilyPhotosScreen} />
      <Stack.Screen name="AllPhotosGrid" component={AllPhotosGridScreen} />
      <Stack.Screen name="MyPhotoDetail" component={MyPhotoDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OtherPhotoDetail" component={OtherPhotoDetailScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function TimelineStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TimelineList" component={TimelineScreen} />
      <Stack.Screen name="MyPhotoDetail" component={MyPhotoDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OtherPhotoDetail" component={OtherPhotoDetailScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function FriendsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="UnifiedFriends" component={UnifiedFriendsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SearchUsers" component={SearchUsersScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="FriendProfile"
        component={FriendProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="FriendAlbum" component={FriendAlbumScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChatList" component={ChatListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChatDetail" component={ChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MyPhotoDetail" component={MyPhotoDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OtherPhotoDetail" component={OtherPhotoDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="FamilyRequest" component={FamilyRequestScreen} options={{ headerShown: false }} />
      <Stack.Screen name="FamilyPhotos" component={FamilyPhotosScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const routeName = getFocusedRouteNameFromRoute(route) ?? '';
        const hideTabBarScreens = [
          'ChatDetail',
          'ChatList',
          'MyPhotoDetail',
          'OtherPhotoDetail',
          'PhotoDetail',
          'Detail',
        ];
        const shouldHideTabBar = hideTabBarScreens.includes(routeName);

        return {
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => {
            let icon;
            if (route.name === "Home") icon = "home-outline";
            else if (route.name === "Camera") {
              return (
                <View style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Ionicons name="add" size={32} color={focused ? "#fff" : color} />
                </View>
              );
            }
            else if (route.name === "Friends") icon = "people-outline";
            else if (route.name === "Profile") icon = "person-outline";
            else icon = "ellipse-outline";

            if (focused && icon && !icon.includes('add')) {
              icon = icon.replace('-outline', '');
            }

            return <Ionicons name={icon} size={28} color={focused ? "#fff" : color} />;
          },
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#8e8e93',
          tabBarStyle: shouldHideTabBar ? { display: 'none' } : {
            position: 'absolute',
            bottom: 24,
            left: 16,
            right: 16,
            alignItems: 'center',
            justifyContent: 'center',
            height: 64,
            backgroundColor: 'rgba(30, 30, 30, 0.9)',
            borderRadius: 32,
            borderTopWidth: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 10,
            paddingHorizontal: 20,
          },
          tabBarItemStyle: {
            paddingVertical: 10,
          },
          tabBarShowLabel: false,
        };
      }}
      initialRouteName="Camera"
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
      />
      <Tab.Screen
        name="Camera"
        options={{
          tabBarLabel: "",
          tabBarStyle: { display: 'none' }
        }}
      >
        {() => (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CameraMain" component={CameraScreen} />
            <Stack.Screen name="LocketFeed" component={LocketFeedScreen} />
            <Stack.Screen name="AllPhotosGrid" component={AllPhotosGridScreen} />
            <Stack.Screen name="MyPhotoDetail" component={MyPhotoDetailScreen} />
            <Stack.Screen name="OtherPhotoDetail" component={OtherPhotoDetailScreen} />
          </Stack.Navigator>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Friends"
        component={FriendsStack}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profile"
        options={{ tabBarLabel: "Me", headerShown: false }}
      >
        {() => (
          <Stack.Navigator>
            <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: "" }} />
            <Stack.Screen name="MigratePhotos" component={MigratePhotosScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TestNotification" component={TestNotificationScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
