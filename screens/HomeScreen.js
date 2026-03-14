import React, { useContext, useEffect, useState, useCallback } from "react";
import { 
  View,
  TouchableOpacity, 
  FlatList, 
  Dimensions,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Alert,
} from "react-native";
import SafeImage from "../components/SafeImage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { Text } from "../components/ui";
import useTheme from "../hooks/useTheme";
import { getUserAlbum, deletePhotoFromUserAlbum } from "../services/userAlbumService";
import { addToFavorites, removeFromFavorites, isFavorited } from "../services/favoriteService";
import { subscribeToUserChats, getUnreadCount } from "../services/chatService";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 16;

// ─── Helper ────────────────────────────────────────────
function getTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

// ─── Feed Card (own photos only) ───────────────────────
function OwnFeedCard({ item, currentUser, onDelete }) {
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    checkFav();
  }, [item?.id]);

  const checkFav = async () => {
    if (currentUser?.uid && item?.id) {
      const status = await isFavorited(currentUser.uid, item.id);
      setFavorited(status);
    }
  };

  const toggleFavorite = async () => {
    if (!currentUser?.uid || !item?.id) return;
    try {
      if (favorited) {
        await removeFromFavorites(currentUser.uid, item.id);
        setFavorited(false);
      } else {
        await addToFavorites(currentUser.uid, item.id);
        setFavorited(true);
      }
    } catch (e) {
      console.error("Favorite error:", e);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Xóa ảnh',
      'Bạn có chắc chắn muốn xóa ảnh này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePhotoFromUserAlbum(currentUser.uid, item.id);
              if (onDelete) onDelete(item.id);
            } catch (e) {
              Alert.alert('Lỗi', 'Không thể xóa ảnh: ' + (e?.message || String(e)));
            }
          },
        },
      ]
    );
  };

  const imageUri = item.cloudinaryUrl || item.uri || item.localUri;
  const caption = item.caption || item.note || "";
  const timeAgo = item.createdAt ? getTimeAgo(item.createdAt) : "";

  return (
    <View style={styles.feedCard}>
      <View style={styles.feedImageWrapper}>
        <SafeImage
          source={{ uri: imageUri }}
          style={styles.feedImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.6)"]}
          locations={[0.5, 1]}
          style={styles.feedGradient}
        />

        {/* Action buttons (top-right) */}
        <View style={styles.topActions}>
          <TouchableOpacity onPress={toggleFavorite} style={styles.actionBtn}>
            <Ionicons
              name={favorited ? "heart" : "heart-outline"}
              size={22}
              color={favorited ? "#ff3b30" : "#fff"}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Bottom info */}
        <View style={styles.feedOverlay}>
          {timeAgo ? <Text style={styles.feedTime} color="#fff">{timeAgo}</Text> : null}
          {caption ? (
            <View style={styles.captionPill}>
              <Text style={styles.feedCaption} color="#fff" numberOfLines={2}>{caption}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

// ─── Main Home Screen ──────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { colors, sizes } = useTheme();
  const { unreadCount: notifUnreadCount } = useNotifications();
  const [ownPhotos, setOwnPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  useEffect(() => {
    loadPhotos();
  }, [user?.uid]);

  // Subscribe to chat unread count
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToUserChats(user.uid, async (chats) => {
      // Count actual unread messages across all chats
      let totalUnread = 0;
      try {
        const counts = await Promise.all(
          chats.map(chat => getUnreadCount(chat.id, user.uid))
        );
        totalUnread = counts.reduce((sum, c) => sum + c, 0);
      } catch (e) {
        console.warn('Error counting unread messages:', e);
      }
      setChatUnreadCount(totalUnread);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const loadPhotos = async () => {
    try {
      if (!user?.uid) return;
      const albumData = await getUserAlbum(user.uid, 30);
      setOwnPhotos(albumData.photos);
    } catch (error) {
      console.error("Error loading photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  }, [user?.uid]);

  const quickActions = [
    { icon: "images", label: "Album Ảnh", color: "#5ac8fa", onPress: () => navigation.navigate('Album') },
    { icon: "heart", label: "Yêu thích", color: "#ff3b30", onPress: () => navigation.navigate('FavoritePhotos') },
  ];

  const handleDeletePhoto = useCallback((photoId) => {
    setOwnPhotos(prev => prev.filter(p => p.id !== photoId));
  }, []);

  const renderFeedItem = useCallback(({ item }) => (
    <OwnFeedCard item={item} currentUser={user} onDelete={handleDeletePhoto} />
  ), [user, handleDeletePhoto]);

  return (
    <View style={styles.container}>
      {/* Fixed Header area */}
      <View style={styles.stickyHeader}>
        {/* Title row */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Chào {user?.displayName || "bạn"},</Text>
            <Text style={styles.headerSubtitle}>Hôm nay bạn thế nào?</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            {/* Chat button */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('Friends', { screen: 'ChatList' })}
              style={{ position: 'relative' }}
            >
              <Ionicons name="chatbubble-outline" size={23} color="#fff" />
              {chatUnreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{chatUnreadCount > 9 ? '9+' : chatUnreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Notification button */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('Notifications')}
              style={{ position: 'relative' }}
            >
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              {notifUnreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notifUnreadCount > 9 ? '9+' : notifUnreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              onPress={action.onPress}
              style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.actionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Feed — only own photos */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#54b6f8" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={ownPhotos}
          renderItem={renderFeedItem}
          keyExtractor={(item, index) => item.id || `feed-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#54b6f8']}
              tintColor="#54b6f8"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Chưa có ảnh nào</Text>
              <Text style={styles.emptySubtext}>
                Nhấn dấu + ở thanh dưới để chụp ảnh đầu tiên!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
    marginTop: 12,
  },

  // ── Sticky header ──
  stickyHeader: {
    backgroundColor: '#000',
    paddingBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#aaa',
    marginTop: 4,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a2c',
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // ── Feed list ──
  feedList: {
    paddingHorizontal: CARD_MARGIN,
    paddingTop: 12,
    paddingBottom: 100,
  },
  feedCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1c1c1e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  feedImageWrapper: {
    width: '100%',
    height: CARD_WIDTH * 1.1,
    position: 'relative',
  },
  feedImage: {
    width: '100%',
    height: '100%',
  },
  feedGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  feedOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  feedTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  feedCaption: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  captionPill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    maxWidth: '90%',
    marginTop: 6,
  },
  topActions: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Badge ──
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#ffcc00', // Yellow accent for badges
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#000',
  },
  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },

  // ── Empty state ──
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
