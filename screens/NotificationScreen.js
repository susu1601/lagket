import React, { useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import { NOTIFICATION_TYPES } from "../services/notificationService";
import { AuthContext } from "../context/AuthContext";
import { getUserAlbum } from "../services/userAlbumService";
import { navigateToPhotoDetail } from "../utils/navigationHelper";

export default function NotificationScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  const resolvePhotoFromNotification = async (notification) => {
    const photoId = notification?.data?.photoId;
    if (!photoId || !user?.uid) return null;

    const isNewPhotoNotification = notification?.type === NOTIFICATION_TYPES.NEW_PHOTO;
    const ownerUserId =
      notification?.data?.ownerUserId ||
      (isNewPhotoNotification ? notification?.senderId : user?.uid);

    try {
      const album = await getUserAlbum(ownerUserId, 500);
      const matchedPhoto = (album?.photos || []).find(
        (p) => String(p?.id) === String(photoId)
      );

      if (matchedPhoto) {
        const isOwnPhoto = ownerUserId === user.uid;
        return {
          ...matchedPhoto,
          userId: matchedPhoto.userId || ownerUserId,
          userName:
            matchedPhoto.userName ||
            (isOwnPhoto ? (user.displayName || "Bạn") : (notification?.senderName || "Bạn bè")),
        };
      }
    } catch (error) {
      console.warn("⚠️ Could not resolve photo from album:", error);
    }

    if (notification?.data?.photoUrl) {
      const isOwnPhoto = ownerUserId === user.uid;
      return {
        id: photoId,
        userId: ownerUserId,
        userName: isOwnPhoto ? (user.displayName || "Bạn") : (notification?.senderName || "Bạn bè"),
        cloudinaryUrl: notification.data.photoUrl,
        caption: notification.data.caption || "",
        createdAt: notification.createdAt,
      };
    }

    return null;
  };

  const handleNotificationPress = async (notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === NOTIFICATION_TYPES.NEW_PHOTO) {
      // Check if it's family photo or friend photo
      if (notification.data?.familyId) {
        // Navigate to family photos
        navigation.navigate("Friends", {
          screen: "FamilyPhotos",
          params: {
            familyId: notification.data.familyId,
            familyName: notification.data.familyName
          }
        });
      } else {
        // Navigate directly to the specific photo when possible.
        const photo = await resolvePhotoFromNotification(notification);
        if (photo) {
          navigateToPhotoDetail(navigation, photo, user);
        } else {
          const friendId = notification.senderId;
          navigation.navigate("Friends", {
            screen: "FriendAlbum",
            params: {
              friendId: friendId,
              friendName: notification.senderName
            }
          });
        }
      }
    } else if (notification.type === NOTIFICATION_TYPES.FRIEND_REQUEST) {
      // Navigate to friends screen
      navigation.navigate("Friends");
    } else if (notification.type === NOTIFICATION_TYPES.FAMILY_INVITATION) {
      // Navigate to family request screen
      navigation.navigate("Friends", { screen: "FamilyRequest" });
    } else if (notification.type === NOTIFICATION_TYPES.FAMILY_ACCEPTED || notification.type === NOTIFICATION_TYPES.FAMILY_DECLINED) {
      // Navigate to family request screen
      navigation.navigate("Friends", { screen: "FamilyRequest" });
    } else if (notification.type === NOTIFICATION_TYPES.REACTION) {
      const photo = await resolvePhotoFromNotification(notification);
      if (photo) {
        navigateToPhotoDetail(navigation, photo, user);
      } else {
        navigation.navigate("Home");
      }
    } else if (notification.type === NOTIFICATION_TYPES.CHAT_MESSAGE) {
      const chatId = notification?.data?.chatId;
      const senderId = notification?.senderId || notification?.data?.senderId;

      if (chatId && senderId) {
        navigation.navigate("Friends", {
          screen: "ChatDetail",
          params: {
            chatId,
            otherUser: {
              uid: senderId,
              name: notification?.senderName || notification?.data?.senderName || "Người dùng",
              avatar: notification?.senderAvatar || notification?.data?.senderAvatar || null,
            },
          },
        });
      } else {
        navigation.navigate("Friends", { screen: "ChatList" });
      }
    }
  };

  const renderNotification = ({ item }) => {
    const isUnread = !item.read;

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          { backgroundColor: isUnread ? '#f0f7ff' : '#fff' },
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.iconContainer}>
          {item.type === NOTIFICATION_TYPES.NEW_PHOTO && (
            <Ionicons name="camera" size={20} color="#54b6f8" />
          )}
          {item.type === NOTIFICATION_TYPES.FRIEND_REQUEST && (
            <Ionicons name="person-add" size={20} color="#34c759" />
          )}
          {item.type === NOTIFICATION_TYPES.FRIEND_ACCEPTED && (
            <Ionicons name="checkmark-circle" size={20} color="#34c759" />
          )}
          {item.type === NOTIFICATION_TYPES.FAMILY_INVITATION && (
            <Ionicons name="people" size={20} color="#ff9500" />
          )}
          {item.type === NOTIFICATION_TYPES.FAMILY_ACCEPTED && (
            <Ionicons name="checkmark-done-circle" size={20} color="#34c759" />
          )}
          {item.type === NOTIFICATION_TYPES.FAMILY_DECLINED && (
            <Ionicons name="close-circle" size={20} color="#ff3b30" />
          )}
          {item.type === NOTIFICATION_TYPES.REACTION && (
            <Ionicons name="happy" size={20} color="#ff9500" />
          )}
          {item.type === NOTIFICATION_TYPES.CHAT_MESSAGE && (
            <Ionicons name="chatbubble" size={20} color="#34c759" />
          )}
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.senderName}>
            {item.senderName}
          </Text>
          <Text style={styles.message}>
            {item.message}
          </Text>
          <Text style={styles.time}>
            {formatTime(item.createdAt)}
          </Text>
        </View>

        {isUnread && (
          <View style={styles.unreadDot} />
        )}

        {item.data?.photoUrl && (
          <Image
            source={{ uri: item.data.photoUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>
    );
  };

  const formatTime = (date) => {
    if (!date) return "";

    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;

    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Đang tải thông báo...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Thông báo
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>
              Đánh dấu đã đọc
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notification List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              Chưa có thông báo nào
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.4,
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: '#54b6f8',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    marginVertical: 6,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: "600",
    color: '#000',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#54b6f8',
    marginLeft: 8,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    fontWeight: '500',
  },
});
