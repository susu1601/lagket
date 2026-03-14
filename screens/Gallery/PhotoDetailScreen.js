import React, { useState, useEffect, useContext, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder, Alert } from "react-native";
import SafeImage from "../../components/SafeImage";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { AuthContext } from "../../context/AuthContext";
import { deletePhotoLocal } from "../../services/cloudinaryPhotoService";
import { addToFavorites, removeFromFavorites, isFavorited } from "../../services/favoriteService";

export default function PhotoDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const photo = route?.params?.photo;
  const [favorited, setFavorited] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const translateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    checkFavoriteStatus();
  }, [photo?.id]);

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

  const checkFavoriteStatus = async () => {
    if (user && photo?.id) {
      const status = await isFavorited(user.uid, photo.id);
      setFavorited(status);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !photo?.id) return;
    
    try {
      console.log('Toggling favorite for photo:', photo.id, 'Current state:', favorited);
      if (favorited) {
        await removeFromFavorites(user.uid, photo.id);
        console.log('Removed from favorites');
        setFavorited(false);
      } else {
        await addToFavorites(user.uid, photo.id);
        console.log('Added to favorites');
        setFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDeletePhoto = () => {
    Alert.alert(
      'Xóa ảnh',
      'Bạn có chắc chắn muốn xóa ảnh này?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting photo:', photo.id, 'for user:', photo.userId);
              const result = await deletePhotoLocal(photo.userId, photo.id);
              console.log('Delete result:', result);
              Alert.alert('Thành công', 'Đã xóa ảnh', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack()
                }
              ]);
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert('Lỗi', 'Không thể xóa ảnh');
            }
          },
        },
      ]
    );
  };

  if (!photo) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.textSecondary }}>No photo</Text>
      </View>
    );
  }

  const imageUri = photo.cloudinaryUrl || photo.uri || photo.localUri;

  const isOwnPhoto = user && photo && user.uid === photo.userId;
  const hasPhotoId = photo && photo.id; // Check if photo has an ID (not from chat)
  
  console.log('PhotoDetail Debug:', {
    userId: user?.uid,
    photoUserId: photo?.userId,
    photoId: photo?.id,
    isOwnPhoto,
    hasPhotoId
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {hasPhotoId && (
            <TouchableOpacity onPress={() => setShowInfo(!showInfo)} style={styles.headerButton}>
              <Ionicons name="information-circle-outline" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          {isOwnPhoto && hasPhotoId && (
            <TouchableOpacity onPress={toggleFavorite} style={styles.headerButton}>
              <Ionicons 
                name={favorited ? "heart" : "heart-outline"} 
                size={26} 
                color={favorited ? "#ff3b30" : "#fff"} 
              />
            </TouchableOpacity>
          )}
          {isOwnPhoto && (
            <TouchableOpacity 
              onPress={handleDeletePhoto}
              style={styles.headerButton}>
              <Ionicons name="trash-outline" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Image */}
      <View style={styles.imageContainer}>
        <SafeImage source={{ uri: imageUri }} style={styles.fullImage} resizeMode="contain" />
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
              <Text style={styles.infoText}>Có vị trí</Text>
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
});


