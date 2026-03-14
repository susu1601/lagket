import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import { 
  View, TextInput, Image, Button, KeyboardAvoidingView, Platform, 
  ScrollView, StyleSheet, TouchableOpacity, Text, FlatList,
  Dimensions, RefreshControl, ActivityIndicator, Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system/legacy";
import { savePhotoToCloudinary } from "../services/cloudinaryPhotoService";
import { addPhotoToUserAlbum, getUserAlbum, getFriendsRecentPhotos } from "../services/userAlbumService";
import { notifyFriendsAboutNewPhoto } from "../services/notificationService";
import { addReaction, removeReaction, getReactions, getUserReaction, EMOJI_LIST } from "../services/reactionService";
import { getOrCreateChat, sendMessage, sendImageMessage } from "../services/chatService";
import SafeImage from "../components/SafeImage";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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

// ─── Emoji Picker ─────────────────────────────────────
function EmojiPicker({ visible, onSelect, onClose, currentEmoji }) {
  if (!visible) return null;
  return (
    <View style={styles.emojiPickerOverlay}>
      <TouchableOpacity style={styles.emojiPickerBackdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.emojiPickerContainer}>
        {EMOJI_LIST.map((emoji) => (
          <TouchableOpacity
            key={emoji}
            style={[styles.emojiButton, currentEmoji === emoji && styles.emojiButtonActive]}
            onPress={() => onSelect(emoji)}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Feed Card ─────────────────────────────────────────
function CameraFeedCard({ item, currentUser, navigation }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [myReaction, setMyReaction] = useState(null);
  const [reactionCount, setReactionCount] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const isOwn = !item.userId || item.userId === currentUser?.uid;
  const displayName = isOwn ? "Bạn" : (item.userName || "Bạn bè");
  const caption = item.caption || item.note || "";
  const timeAgo = item.createdAt ? getTimeAgo(item.createdAt) : "";
  const imageUri = item.cloudinaryUrl || item.uri || item.localUri;

  useEffect(() => {
    loadReaction();
  }, [item?.id]);

  const loadReaction = async () => {
    if (!item?.id || !currentUser?.uid) return;
    try {
      const reactions = await getReactions(item.id);
      setReactionCount(Object.keys(reactions).length);
      if (reactions[currentUser.uid]) {
        setMyReaction(reactions[currentUser.uid].emoji);
      }
    } catch (e) {}
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
        await addReaction(currentUser.uid, item.id, emoji, currentUser.displayName || "Bạn", item.userId);
        setMyReaction(emoji);
        if (!myReaction) setReactionCount(prev => prev + 1);
      }
    } catch (e) {
      console.error("Reaction error:", e);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !currentUser?.uid || !item.userId || sendingReply) return;
    setSendingReply(true);
    try {
      const chat = await getOrCreateChat(currentUser.uid, item.userId);
      const photoUrl = item.cloudinaryUrl || item.uri || item.localUri;
      // Send the photo as an image message first
      if (photoUrl) {
        await sendImageMessage(chat.id, currentUser.uid, photoUrl, replyText.trim());
      } else {
        await sendMessage(chat.id, currentUser.uid, replyText.trim());
      }
      setReplyText("");
      Alert.alert("Đã gửi", "Bình luận đã được gửi đến tin nhắn!");
    } catch (e) {
      console.error("Reply error:", e);
      Alert.alert("Lỗi", "Không thể gửi bình luận");
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <View style={styles.feedCard}>
      <TouchableOpacity 
        activeOpacity={0.95}
        onPress={() => {
          if (isOwn) {
            navigation.navigate("MyPhotoDetail", { photo: item });
          } else {
            navigation.navigate("OtherPhotoDetail", { photo: item });
          }
        }}
      >
        <View style={styles.feedImageWrapper}>
          <SafeImage source={{ uri: imageUri }} style={styles.feedImage} resizeMode="cover" />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.65)"]}
            locations={[0.45, 1]}
            style={styles.feedGradient}
          />

          {/* Bottom info overlay */}
          <View style={styles.feedOverlay}>
            <View style={styles.feedUserRow}>
              <View style={styles.feedAvatar}>
                <Ionicons name={isOwn ? "person" : "people"} size={14} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.feedUserName}>{displayName}</Text>
                {timeAgo ? <Text style={styles.feedTime}>{timeAgo}</Text> : null}
              </View>
            </View>
            {caption ? (
              <View style={styles.captionPill}>
                <Text style={styles.feedCaption} numberOfLines={2}>{caption}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>

      {/* Reaction + Reply bar (for friends' photos) */}
      {!isOwn && (
        <View style={styles.reactionBar}>
          <View style={styles.reactionRow}>
            <TouchableOpacity 
              style={[styles.reactionBtn, myReaction && styles.reactionBtnActive]}
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Text style={styles.reactionBtnText}>
                {myReaction || "😀"} {reactionCount > 0 ? reactionCount : "Thả cảm xúc"}
              </Text>
            </TouchableOpacity>
          </View>
          <EmojiPicker 
            visible={showEmojiPicker} 
            onSelect={handleReaction} 
            onClose={() => setShowEmojiPicker(false)}
            currentEmoji={myReaction}
          />
          {/* Reply input */}
          <View style={styles.replyInputRow}>
            <TextInput
              style={styles.replyInput}
              placeholder="Gửi tin nhắn..."
              placeholderTextColor="#888"
              value={replyText}
              onChangeText={setReplyText}
              editable={!sendingReply}
              maxLength={200}
            />
            <TouchableOpacity
              style={[styles.replySendBtn, (!replyText.trim() || sendingReply) && styles.replySendBtnDisabled]}
              onPress={handleSendReply}
              disabled={!replyText.trim() || sendingReply}>
              {sendingReply ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Show reaction count for own photos */}
      {isOwn && reactionCount > 0 && (
        <View style={styles.reactionBar}>
          <View style={styles.reactionInfo}>
            <Text style={styles.reactionInfoText}>
              {reactionCount} cảm xúc
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Main Camera Screen ────────────────────────────────
export default function CameraScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const [photo, setPhoto] = useState(null);
  const [note, setNote] = useState("");
  const [coords, setCoords] = useState(null);
  const [locationName, setLocationName] = useState(null);
  const [includeLocation, setIncludeLocation] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState("off");
  const [zoom, setZoom] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [notifyFriends, setNotifyFriends] = useState(true);
  const [suggestedCaptions, setSuggestedCaptions] = useState([]);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const cameraRef = useRef(null);
  const mountedRef = useRef(true);
  const scrollViewRef = useRef(null);

  // Feed state
  const [feedItems, setFeedItems] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedRefreshing, setFeedRefreshing] = useState(false);
  const [feedLoaded, setFeedLoaded] = useState(false);

  const generateCaptions = () => {
    setIsGeneratingCaption(true);
    setTimeout(() => {
      const allCaptions = [
        "Một ngày tuyệt vời! ✨",
        "Kỷ niệm đáng nhớ 📸",
        "Thật chill 🍃",
        "Cuộc sống là những bức tranh đẹp 🎨",
        "Sống hết mình! 🔥",
        "Bình yên ⛅",
        "Năng lượng tích cực ⚡",
        "Cùng nhau đi khắp thế gian 🌍",
        "Khoảnh khắc đẹp nhất 💖"
      ];
      const shuffled = [...allCaptions].sort(() => 0.5 - Math.random());
      setSuggestedCaptions(shuffled.slice(0, 3));
      setIsGeneratingCaption(false);
    }, 500);
  };

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      await Location.requestForegroundPermissionsAsync();
    })();
    return () => { mountedRef.current = false; };
  }, []);

  const loadFeed = useCallback(async () => {
    if (!user?.uid) return;
    setFeedLoading(true);
    try {
      const [albumData, friendPhotos] = await Promise.all([
        getUserAlbum(user.uid, 30),
        getFriendsRecentPhotos(user.uid, 30),
      ]);

      const ownPhotos = albumData.photos.map(p => ({
        ...p,
        userId: user.uid,
        userName: user.displayName || "Bạn",
        isOwn: true,
      }));

      const friends = friendPhotos.map(p => ({ ...p, isOwn: false }));

      let all = [...ownPhotos, ...friends];
      const seen = new Set();
      all = all.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setFeedItems(all);
      setFeedLoaded(true);
    } catch (error) {
      console.error("Error loading feed:", error);
    } finally {
      setFeedLoading(false);
    }
  }, [user?.uid]);

  const onFeedRefresh = useCallback(async () => {
    setFeedRefreshing(true);
    await loadFeed();
    setFeedRefreshing(false);
  }, [loadFeed]);

  // Load feed when user scrolls to page 2
  const handleScroll = useCallback((e) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    if (offsetY > SCREEN_HEIGHT * 0.3 && !feedLoaded && !feedLoading) {
      loadFeed();
    }
  }, [feedLoaded, feedLoading, loadFeed]);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>Cần quyền truy cập camera</Text>
        <Button onPress={requestPermission} title="Cấp quyền" />
      </View>
    );
  }

  const takePhoto = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    
    try {
      if (cameraRef.current) {
        console.log("📸 Bắt đầu chụp ảnh...");
        
        const shot = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: false,
          skipProcessing: true,
          exif: false,
        });

        if (!mountedRef.current) return;

        setPhoto({ 
          uri: shot.uri, 
          fileName: `photo_${Date.now()}.jpg`, 
          width: shot.width, 
          height: shot.height 
        });

        generateCaptions();

        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
          timeout: 3000,
        }).then(async location => {
          if (mountedRef.current) {
            setCoords(location.coords);
            try {
              const geocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
              });
              
              if (geocode && geocode.length > 0) {
                const bestMatch = geocode[0];
                const addressArr = [bestMatch.name || bestMatch.street, bestMatch.city || bestMatch.subregion || bestMatch.region].filter(Boolean);
                if (addressArr.length > 0 && mountedRef.current) {
                  setLocationName(addressArr.join(", "));
                  setIncludeLocation(true);
                }
              }
            } catch (err) {
              console.warn("Reverse geocode error:", err);
            }
          }
        }).catch(error => {
          console.warn("Location error:", error);
          if (mountedRef.current) {
            setCoords(null);
          }
        });
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert("Lỗi chụp ảnh: " + (error?.message || String(error)));
    } finally {
      if (mountedRef.current) setIsCapturing(false);
    }
  };

  const onSave = async () => {
    if (!photo) return alert("Chụp ảnh trước đã 😅");
    setLoading(true);

    try {
      const isSelfie = facing === "front";
      
      let photoData = { uri: photo.uri, coords, note, labels: [], isSelfie, source: "camera" };
      
      if (!photo.uri.startsWith('file://')) {
        photoData.uri = photo.uri;
      }
      
      const created = await savePhotoToCloudinary(photoData, user.uid);

      console.log("💾 Syncing photo to Firebase...");
      
      const cloudinaryUrl = created.uri || created.cloudinaryUrl;
      
      if (!cloudinaryUrl || cloudinaryUrl.startsWith('file://')) {
        throw new Error("Không thể upload ảnh lên Cloudinary. Vui lòng kiểm tra kết nối internet và thử lại.");
      }

      await addPhotoToUserAlbum(user.uid, {
        id: created.id,
        cloudinaryUrl: cloudinaryUrl,
        publicId: created.cloudinary?.publicId || created.publicId,
        caption: note,
        tags: created.labels || [],
        location: (coords && includeLocation) ? {
          latitude: coords.latitude,
          longitude: coords.longitude,
          address: locationName || null
        } : null,
        aiAnalysis: {
          labels: created.labels || [],
          categoryPrimary: created.categoryPrimary,
          categorySecondary: created.categorySecondary
        }
      });
      console.log("✅ Photo synced to Firebase with URL:", cloudinaryUrl);

      if (notifyFriends) {
        try {
          console.log("📢 Notifying friends about new photo...");
          await notifyFriendsAboutNewPhoto(
            user.uid, 
            user.displayName || user.email,
            {
              id: created.id,
              cloudinaryUrl: created.uri,
              caption: note,
              note: note
            }
          );
          console.log("✅ Friends notified!");
        } catch (notifyError) {
          console.error("⚠️ Failed to notify friends:", notifyError);
        }
      }

      if (!mountedRef.current) return;
      setLoading(false);
      setPhoto(null);
      setNote("");
      setLocationName(null);
      setIncludeLocation(true);
      setNotifyFriends(true);
      setSuggestedCaptions([]);
      
      const newPhotoData = {
        id: created.id,
        cloudinaryUrl: created.uri || created.cloudinaryUrl,
        userId: user.uid,
        publicId: created.cloudinary?.publicId || created.publicId,
        caption: note,
        tags: created.labels || [],
        location: (coords && includeLocation) ? {
          latitude: coords.latitude,
          longitude: coords.longitude,
          address: locationName || null
        } : null,
        aiAnalysis: {
          labels: created.labels || [],
          categoryPrimary: created.categoryPrimary,
          categorySecondary: created.categorySecondary
        },
        createdAt: new Date().toISOString()
      };
      navigation.replace('LocketFeed', { newPhoto: newPhotoData });
    } catch (error) {
      if (mountedRef.current) setLoading(false);
      console.error("Save error:", error);
      alert("Lỗi lưu ảnh: " + (error?.message || String(error)));
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      {!photo ? (
        <ScrollView
          ref={scrollViewRef}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          bounces={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {/* ─── Page 1: Camera ──────────────────── */}
          <View style={{ height: SCREEN_HEIGHT, backgroundColor: '#000' }}>
            <View style={styles.cameraWrapper}>
              <CameraView style={styles.camera} facing={facing} ref={cameraRef} zoom={zoom} enableZoomGesture onPinchGestureEnd={({ nativeEvent }) => {
                const next = Math.max(0, Math.min(1, zoom + (nativeEvent.scale > 1 ? 0.1 : -0.1)));
                setZoom(Number(next.toFixed(2)));
              }} flash={flash} />

              {showGrid && (
                <View pointerEvents="none" style={styles.gridOverlay}>
                  <View style={styles.gridRow} />
                  <View style={styles.gridRow} />
                </View>
              )}

              <View style={styles.navTopLeft}>
                <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.controlsCenter}>
                <TouchableOpacity style={styles.topButton} onPress={() => setFlash((f) => (f === "off" ? "on" : f === "on" ? "auto" : "off"))} disabled={isCapturing}>
                  <Ionicons name={flash === 'off' ? 'flash-outline' : flash === 'on' ? 'flash' : 'flash'} size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

              {/* Removed duplicate nav views to fix syntax error length */}

            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.bottomSideButton}
                onPress={() => navigation.navigate('AllPhotosGrid')}
                disabled={isCapturing}
              >
                <Ionicons name="grid" size={26} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.shutter, isCapturing && { opacity: 0.6 }]} 
                onPress={takePhoto} 
                disabled={isCapturing}
                activeOpacity={0.7}
              >
                {isCapturing && (
                  <View style={styles.captureIndicator}>
                    <Text style={styles.captureText}>📸</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bottomSideButton}
                onPress={() => setFacing((cur) => (cur === "back" ? "front" : "back"))}
                disabled={isCapturing}
              >
                <Ionicons name="camera-reverse" size={26} color="#fff" />
              </TouchableOpacity>
            </View>


          </View>

          {/* ─── Page 2: Feed ────────────────────── */}
          <View style={styles.feedPage}>
            <View style={styles.feedHeader}>
              <TouchableOpacity 
                onPress={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })}
                style={styles.feedHeaderBtn}
              >
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.feedHeaderTitle}>Feed của bạn</Text>
              <TouchableOpacity 
                onPress={onFeedRefresh}
                style={styles.feedHeaderBtn}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {feedLoading && !feedLoaded ? (
              <View style={styles.feedLoadingContainer}>
                <ActivityIndicator size="large" color="#54b6f8" />
                <Text style={styles.feedLoadingText}>Đang tải feed...</Text>
              </View>
            ) : feedItems.length === 0 ? (
              <View style={styles.emptyFeed}>
                <Ionicons name="images-outline" size={48} color="#666" />
                <Text style={styles.emptyFeedText}>Chưa có ảnh nào</Text>
                <Text style={styles.emptyFeedSubtext}>Chụp ảnh hoặc kết bạn để xem feed!</Text>
              </View>
            ) : (
              <View style={styles.feedList}>
                {feedItems.map((item, index) => (
                  <CameraFeedCard key={item.id || `feed-${index}`} item={item} currentUser={user} navigation={navigation} />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo.uri }} style={styles.previewImage} />
          
          <View style={styles.previewHeader}>
            <TouchableOpacity 
              style={styles.previewButton}
              onPress={() => {
                setPhoto(null);
                setLocationName(null);
                setSuggestedCaptions([]);
              }}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={[styles.previewActions, { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingVertical: 24 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
              <TextInput
                style={[styles.captionInput, { flex: 1, marginBottom: 0 }]}
                placeholder="Thêm chú thích..."
                placeholderTextColor="#666"
                value={note}
                onChangeText={setNote}
                multiline
              />
              <TouchableOpacity
                style={styles.aiButton}
                onPress={generateCaptions}
                disabled={isGeneratingCaption}>
                {isGeneratingCaption ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="sparkles" size={24} color="#ffcc00" />
                )}
              </TouchableOpacity>
            </View>

            {suggestedCaptions.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.captionSuggestions}>
                {suggestedCaptions.map((caption, idx) => (
                  <TouchableOpacity key={idx} style={styles.suggestionChip} onPress={() => { setNote(caption); setSuggestedCaptions([]); }}>
                    <Text style={styles.suggestionText}>{caption}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            
            {locationName && (
              <TouchableOpacity
                style={[styles.locationCheckIn, !includeLocation && styles.locationCheckInDisabled]}
                onPress={() => !loading && setIncludeLocation(!includeLocation)}
                disabled={loading}>
                <Ionicons name="location" size={16} color={includeLocation ? "#ff3b30" : "#999"} />
                <Text style={[styles.locationCheckInText, !includeLocation && styles.textDisabled]} numberOfLines={1}>
                  {locationName}
                </Text>
                <Ionicons 
                  name={includeLocation ? "checkmark-circle" : "ellipse-outline"} 
                  size={18} 
                  color={includeLocation ? "#54b6f8" : "#999"} 
                  style={{marginLeft: 4}}
                />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.notifyToggle, loading && styles.toggleDisabled]}
              onPress={() => !loading && setNotifyFriends(!notifyFriends)}
              disabled={loading}>
              <Ionicons 
                name={notifyFriends ? "notifications" : "notifications-off"} 
                size={20} 
                color={loading ? "#ccc" : (notifyFriends ? "#54b6f8" : "#999")} 
              />
              <Text style={[styles.notifyText, notifyFriends && !loading && styles.notifyTextActive, loading && styles.textDisabled]}>
                Thông báo bạn bè
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={onSave}
              disabled={loading}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>
                {loading ? "Đang lưu..." : "Lưu ảnh"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const CARD_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#000' },
  cameraWrapper: {
    flex: 1,
    marginTop: 80,
    marginBottom: 140,
    borderRadius: 40,
    overflow: 'hidden',
  },
  camera: { flex: 1 },
  gridOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "column",
    justifyContent: "space-evenly",
  },
  gridRow: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: 16,
  },
  bottomBar: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 36,
  },
  bottomSideButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  swipeHint: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    alignItems: "center",
  },
  swipeHintText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  navTopLeft: {
    position: "absolute",
    top: 40,
    left: 16,
  },
  navButton: {
    backgroundColor: "rgba(30,30,30,0.8)", // Darker translucent
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  controlsCenter: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  topButton: {
    backgroundColor: "rgba(30,30,30,0.8)", // Darker translucent
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  shutter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.8)",
  },

  // ── Preview ──
  previewContainer: { flex: 1, backgroundColor: "#000" },
  previewImage: { flex: 1, resizeMode: "cover" },
  previewHeader: {
    position: "absolute",
    top: 40,
    left: 16,
  },
  previewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  captionInput: {
    backgroundColor: "rgba(0,0,0,0.05)",
    color: "#000",
    fontSize: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 50,
    maxHeight: 120,
    marginBottom: 16,
  },
  aiButton: {
    backgroundColor: "rgba(255, 204, 0, 0.2)",
    borderRadius: 12,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  captionSuggestions: {
    flexDirection: "row",
    marginBottom: 16,
  },
  suggestionChip: {
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  suggestionText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  locationCheckIn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,59,48,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.3)",
  },
  locationCheckInDisabled: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  locationCheckInText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
    maxWidth: SCREEN_WIDTH * 0.6,
  },
  notifyToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  feedPage: {
    minHeight: SCREEN_HEIGHT,
    backgroundColor: "#111",
  },
  feedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  feedHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(30,30,30,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  feedHeaderTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  feedLoadingContainer: {
    paddingTop: 80,
    alignItems: "center",
  },
  feedLoadingText: {
    color: "#999",
    fontSize: 14,
    marginTop: 12,
  },
  feedList: {
    paddingHorizontal: CARD_MARGIN,
    paddingBottom: 100,
  },
  feedCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  feedImageWrapper: {
    width: "100%",
    height: CARD_WIDTH * 1.1,
    position: "relative",
  },
  feedImage: {
    width: "100%",
    height: "100%",
  },
  feedGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "45%",
  },
  feedOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  feedUserRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  feedAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  feedUserName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  feedTime: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginTop: 1,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  feedCaption: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
  },
  captionPill: {
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
    maxWidth: "90%",
    marginTop: 6,
  },

  // ── Reaction ──
  reactionBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: "relative",
  },
  reactionBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  reactionBtnActive: {
    backgroundColor: "rgba(84,182,248,0.2)",
    borderColor: "rgba(84,182,248,0.4)",
  },
  reactionBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  reactionInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  reactionInfoText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
  reactionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  replyInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    color: "#fff",
    fontSize: 14,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  replySendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#54b6f8",
    alignItems: "center",
    justifyContent: "center",
  },
  replySendBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  // ── Emoji Picker ──
  emojiPickerOverlay: {
    position: "absolute",
    bottom: 48,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  emojiPickerBackdrop: {
    position: "absolute",
    top: -500,
    bottom: -500,
    left: -500,
    right: -500,
  },
  emojiPickerContainer: {
    flexDirection: "row",
    backgroundColor: "#2a2a2a",
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  emojiButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 20,
  },
  emojiButtonActive: {
    backgroundColor: "rgba(84,182,248,0.3)",
  },
  emojiText: {
    fontSize: 24,
  },

  // ── Empty feed ──
  emptyFeed: {
    paddingTop: 80,
    alignItems: "center",
  },
  emptyFeedText: {
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptyFeedSubtext: {
    color: "#666",
    fontSize: 13,
    marginTop: 6,
  },

  // ── Preview ──
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  previewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  captionInput: {
    fontSize: 16,
    color: '#000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 16,
    minHeight: 50,
  },
  notifyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  notifyText: {
    fontSize: 15,
    color: '#999',
    fontWeight: '500',
  },
  notifyTextActive: {
    color: '#54b6f8',
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  textDisabled: {
    color: '#ccc',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#54b6f8',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  captureIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 30,
  },
  captureText: {
    fontSize: 20,
  },
});
