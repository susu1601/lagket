import React, { useState, useEffect, useRef, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder } from "react-native";
import SafeImage from "../../components/SafeImage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { AuthContext } from "../../context/AuthContext";
import { addReaction, removeReaction, getReactions, EMOJI_LIST } from "../../services/reactionService";

export default function OtherPhotoDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const photo = route?.params?.photo;
  const [showInfo, setShowInfo] = useState(false);
  const translateY = useRef(new Animated.Value(300)).current;
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [myReaction, setMyReaction] = useState(null);
  const [reactionCount, setReactionCount] = useState(0);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: showInfo ? 0 : 300,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [showInfo]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          setShowInfo(false);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    loadReaction();
  }, [photo?.id]);

  const loadReaction = async () => {
    if (!photo?.id || !user?.uid) return;
    try {
      const reactions = await getReactions(photo.id);
      setReactionCount(Object.keys(reactions).length);
      if (reactions[user.uid]) {
        setMyReaction(reactions[user.uid].emoji);
      }
    } catch (e) {}
  };

  const handleReaction = async (emoji) => {
    setShowEmojiPicker(false);
    if (!user?.uid || !photo?.id) return;
    try {
      if (myReaction === emoji) {
        await removeReaction(user.uid, photo.id);
        setMyReaction(null);
        setReactionCount(prev => Math.max(0, prev - 1));
      } else {
        await addReaction(user.uid, photo.id, emoji, user.displayName || "Bạn", photo.userId);
        setMyReaction(emoji);
        if (!myReaction) setReactionCount(prev => prev + 1);
      }
    } catch (e) {
      console.error("Reaction error:", e);
    }
  };

  if (!photo) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.textSecondary }}>No photo</Text>
      </View>
    );
  }

  const imageUri = photo.cloudinaryUrl || photo.uri || photo.localUri;
  const hasPhotoId = photo && photo.id;
  const caption = photo.caption || photo.note || "";
  const displayName = photo.userName || "Bạn bè";

  console.log('OtherPhotoDetailScreen Debug:', {
    photoId: photo?.id,
    userId: photo?.userId,
    hasPhotoId,
    screenName: 'OtherPhotoDetailScreen'
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => {
          navigation.navigate('Home');
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }, 100);
        }} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {hasPhotoId && (
            <TouchableOpacity onPress={() => setShowInfo(!showInfo)} style={styles.headerButton}>
              <Ionicons name="information-circle-outline" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Image */}
      <View style={styles.imageContainer}>
        <SafeImage source={{ uri: imageUri }} style={styles.fullImage} resizeMode="contain" />

        {/* Poster name & caption overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.posterOverlay}
        >
          <View style={styles.posterRow}>
            <View style={styles.posterAvatar}>
              <Ionicons name="people" size={16} color="#fff" />
            </View>
            <Text style={styles.posterName}>{displayName}</Text>
          </View>
          {caption ? (
            <Text style={styles.posterCaption} numberOfLines={3}>{caption}</Text>
          ) : null}

          {/* Emoji reaction row */}
          <View style={styles.emojiReactionArea}>
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
        </LinearGradient>
      </View>

      {/* Info Panel - Swipeable */}
      {showInfo && (
        <Animated.View 
          style={[
            styles.infoPanel,
            { transform: [{ translateY }] }
          ]}
          {...panResponder.panHandlers}>
          <View style={styles.swipeHandle} />
          
          {photo.createdAt && (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={18} color="#666" />
              <Text style={styles.infoText}>
                {new Date(photo.createdAt).toLocaleDateString('vi-VN', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          )}
          
          {photo.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color="#666" />
              <Text style={styles.infoText}>{photo.location.address || "Có vị trí"}</Text>
            </View>
          )}

          {(photo.aiAnalysis?.labels || photo.labels || photo.tags || []).length > 0 && (
            <View style={styles.tagsSection}>
              <View style={styles.tagsHeader}>
                <Ionicons name="pricetag-outline" size={18} color="#666" />
                <Text style={styles.tagsTitle}>Tags</Text>
              </View>
              <View style={styles.tagsRow}>
                {(photo.aiAnalysis?.labels || photo.labels || photo.tags || []).map((l, idx) => (
                  <View key={idx} style={styles.tagChip}>
                    <Text style={styles.tagText}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  posterOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 60,
  },
  posterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  posterAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  posterName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  posterCaption: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 42,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    maxHeight: '50%',
  },
  swipeHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
  },
  tagsSection: {
    marginTop: 8,
  },
  tagsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tagsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Emoji Reaction ──
  emojiReactionArea: {
    marginTop: 12,
  },
  emojiReactionBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emojiReactionBtnActive: {
    backgroundColor: 'rgba(84,182,248,0.25)',
    borderColor: 'rgba(84,182,248,0.5)',
  },
  emojiReactionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emojiPickerRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(42,42,42,0.95)',
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  emojiPickerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 20,
  },
  emojiPickerBtnActive: {
    backgroundColor: 'rgba(84,182,248,0.3)',
  },
  emojiPickerText: {
    fontSize: 24,
  },
});
