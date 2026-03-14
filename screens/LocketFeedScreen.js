import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import SafeImage from "../components/SafeImage";
import { AuthContext } from "../context/AuthContext";
import { getUserAlbum, getFriendsRecentPhotos, deletePhotoFromUserAlbum } from "../services/userAlbumService";
import { addToFavorites, removeFromFavorites, isFavorited } from "../services/favoriteService";
import { addReaction, removeReaction, getReactions, EMOJI_LIST } from "../services/reactionService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function FeedItem({ item, isActive, currentUser, onDeleteItem }) {
  const [favorited, setFavorited] = useState(false);
  const [showCaption, setShowCaption] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [myReaction, setMyReaction] = useState(null);
  const [reactionCount, setReactionCount] = useState(0);

  useEffect(() => {
    if (isActive) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isActive]);

  useEffect(() => {
    checkFav();
    loadReaction();
  }, [item?.id]);

  const checkFav = async () => {
    if (currentUser?.uid && item?.id) {
      const status = await isFavorited(currentUser.uid, item.id);
      setFavorited(status);
    }
  };

  const loadReaction = async () => {
    if (!item?.id || !currentUser?.uid) return;
    try {
      const reactions = await getReactions(item.id);
      setReactionCount(Object.keys(reactions).length);
      if (reactions[currentUser.uid]) {
        setMyReaction(reactions[currentUser.uid].emoji);
      }
    } catch (e) { }
  };

  const handleReaction = async (emoji) => {
    setShowEmojiPicker(false);
    if (!currentUser?.uid || !item?.id) return;
    try {
      if (myReaction === emoji) {
        await removeReaction(currentUser.uid, item.id);
        setMyReaction(null);
        setReactionCount(prev => Math.max(0, prev - 1));
      } else {
        await addReaction(
          currentUser.uid,
          item.id,
          emoji,
          currentUser.displayName || "Bạn",
          item.userId,
          {
            photoUrl: imageUri,
            caption,
          }
        );
        setMyReaction(emoji);
        if (!myReaction) setReactionCount(prev => prev + 1);
      }
    } catch (e) {
      console.error("Reaction error:", e);
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
              if (onDeleteItem) onDeleteItem(item.id);
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
  const isOwn = !item.userId || item.userId === currentUser?.uid;
  const displayName = isOwn ? "Bạn" : (item.userName || "Bạn bè");
  const timeAgo = item.createdAt ? getTimeAgo(item.createdAt) : "";

  return (
    <View style={styles.feedItem}>
      <SafeImage
        source={{ uri: imageUri }}
        style={styles.feedImage}
        resizeMode="cover"
      />

      {/* Gradient overlay bottom */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.75)"]}
        locations={[0.4, 0.65, 1]}
        style={styles.gradient}
      />

      {/* Info overlay */}
      <Animated.View style={[styles.infoOverlay, { opacity: fadeAnim }]}>
        {/* User info */}
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Ionicons
              name={isOwn ? "person" : "people"}
              size={16}
              color="#fff"
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            {timeAgo ? <Text style={styles.timeText}>{timeAgo}</Text> : null}
          </View>
        </View>

        {/* Caption */}
        {caption ? (
          <Text style={styles.captionText} numberOfLines={3}>
            {caption}
          </Text>
        ) : null}

        {/* Favorite/reaction button */}
        {isOwn && (
          <View style={styles.ownActions}>
            <TouchableOpacity onPress={toggleFavorite} style={styles.actionCircle}>
              <Ionicons
                name={favorited ? "heart" : "heart-outline"}
                size={26}
                color={favorited ? "#ff3b30" : "#fff"}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.actionCircle}>
              <Ionicons name="trash-outline" size={22} color="#fff" />
            </TouchableOpacity>
            {reactionCount > 0 && (
              <View style={styles.reactionCountBadge}>
                <Text style={styles.reactionCountText}>{reactionCount} cảm xúc</Text>
              </View>
            )}
          </View>
        )}

        {/* Emoji reaction for friends' photos */}
        {!isOwn && (
          <View style={styles.friendReactionRow}>
            <TouchableOpacity
              style={[styles.emojiReactionBtn, myReaction && styles.emojiReactionBtnActive]}
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Text style={styles.emojiReactionBtnText}>
                {myReaction || "😀"} {reactionCount > 0 ? reactionCount : "Thả cảm xúc"}
              </Text>
            </TouchableOpacity>
            {showEmojiPicker && (
              <View style={styles.emojiPickerRow}>
                {EMOJI_LIST.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[styles.emojiPickerBtn, myReaction === emoji && styles.emojiPickerBtnActive]}
                    onPress={() => handleReaction(emoji)}
                  >
                    <Text style={styles.emojiPickerText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* "Just posted" badge for the first item */}
        {item._isNewPost && (
          <View style={styles.newBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#34c759" />
            <Text style={styles.newBadgeText}>Đã đăng!</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

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

export default function LocketFeedScreen({ route, navigation }) {
  const { user } = useContext(AuthContext);
  const newPhoto = route?.params?.newPhoto;
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  const loadFeed = useCallback(async () => {
    try {
      if (!user?.uid) return;

      // Get own photos + friends' photos in parallel
      const [albumData, friendPhotos] = await Promise.all([
        getUserAlbum(user.uid, 20),
        getFriendsRecentPhotos(user.uid, 20),
      ]);

      // Combine & sort by createdAt (newest first)
      let allPhotos = [
        ...albumData.photos.map((p) => ({ ...p, userId: user.uid })),
        ...friendPhotos,
      ];

      // Remove duplicates by id
      const seen = new Set();
      allPhotos = allPhotos.filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      // Sort newest first
      allPhotos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // If we have a new photo, put it first (with badge)
      if (newPhoto) {
        // Remove it from list if already present
        allPhotos = allPhotos.filter((p) => p.id !== newPhoto.id);
        // Add to front with badge
        allPhotos.unshift({ ...newPhoto, _isNewPost: true, userId: user.uid });
      }

      setFeedItems(allPhotos);
    } catch (error) {
      console.error("Error loading feed:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, newPhoto?.id]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    if (!newPhoto?.id || !user?.uid) return;

    // Show newly uploaded photo immediately without waiting for remote fetch.
    setFeedItems((prev) => {
      const withoutNew = (prev || []).filter((p) => p.id !== newPhoto.id);
      return [{ ...newPhoto, _isNewPost: true, userId: user.uid }, ...withoutNew];
    });

    setActiveIndex(0);
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
  }, [newPhoto?.id, user?.uid]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }, [loadFeed]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const handleDeleteFeedItem = useCallback((photoId) => {
    setFeedItems(prev => prev.filter(p => p.id !== photoId));
  }, []);

  const renderItem = useCallback(
    ({ item, index }) => (
      <FeedItem
        item={item}
        isActive={index === activeIndex}
        currentUser={user}
        onDeleteItem={handleDeleteFeedItem}
      />
    ),
    [activeIndex, user, handleDeleteFeedItem]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#54b6f8" />
        <Text style={styles.loadingText}>Đang tải feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header - floating on top */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate("Home");
            }
          }}
        >
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Feed</Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate("CameraMain")}
        >
          <Ionicons name="camera" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Vertical paging feed */}
      <FlatList
        ref={flatListRef}
        data={feedItems}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id || `feed-${index}`}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={["#54b6f8"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>Chưa có ảnh nào</Text>
            <Text style={styles.emptySubtext}>
              Hãy chụp ảnh đầu tiên hoặc kết bạn để xem feed!
            </Text>
          </View>
        }
      />

      {/* Page indicator dots */}
      {feedItems.length > 1 && (
        <View style={styles.pageIndicator}>
          <Text style={styles.pageText}>
            {activeIndex + 1} / {feedItems.length}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#999",
    fontSize: 14,
    marginTop: 12,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  feedItem: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#000",
  },
  feedImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    borderRadius: 0,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.45,
  },
  infoOverlay: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  timeText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 2,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  captionText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ownActions: {
    flexDirection: "row",
    alignSelf: "flex-end",
    gap: 10,
    marginTop: 4,
  },
  actionCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  newBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(52, 199, 89, 0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(52, 199, 89, 0.4)",
  },
  newBadgeText: {
    color: "#34c759",
    fontSize: 14,
    fontWeight: "600",
  },
  pageIndicator: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pageText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  // ── Reaction styles ──
  reactionCountBadge: {
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  reactionCountText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "500",
  },
  friendReactionRow: {
    marginTop: 8,
  },
  emojiReactionBtn: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  emojiReactionBtnActive: {
    backgroundColor: "rgba(84,182,248,0.25)",
    borderColor: "rgba(84,182,248,0.5)",
  },
  emojiReactionBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  emojiPickerRow: {
    flexDirection: "row",
    backgroundColor: "rgba(42,42,42,0.95)",
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  emojiPickerBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 20,
  },
  emojiPickerBtnActive: {
    backgroundColor: "rgba(84,182,248,0.3)",
  },
  emojiPickerText: {
    fontSize: 24,
  },
  emptyContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    color: "#999",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
