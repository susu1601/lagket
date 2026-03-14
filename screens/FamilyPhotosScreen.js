import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "../context/AuthContext";
import { navigateToPhotoDetail } from "../utils/navigationHelper";
import {
  getFamilyPhotos,
  uploadFamilyPhoto
} from "../services/familyPhotoService";
import { getFamilyMembers } from "../services/familyService";

const { width } = Dimensions.get("window");
const ITEM_SIZE = (width - 32) / 4;

export default function FamilyPhotosScreen({ route, navigation }) {
  const { family } = route.params;
  const { user } = useContext(AuthContext);
  const [photos, setPhotos] = useState([]);
  const [members, setMembers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, [family?.id]);

  const loadPhotos = async () => {
    if (!family?.id || !user?.uid) return;
    try {
      const [photosData, membersData] = await Promise.all([
        getFamilyPhotos(family.id, user.uid),
        getFamilyMembers(family.id)
      ]);
      setPhotos(photosData);
      setMembers(membersData);
    } catch (error) {
      console.error("Error loading photos:", error);
    }
  };

  const photosByMember = useMemo(() => {
    const grouped = {};
    photos.forEach(photo => {
      const uploaderId = photo.uploadedBy || photo.userId;
      if (!grouped[uploaderId]) {
        grouped[uploaderId] = [];
      }
      grouped[uploaderId].push(photo);
    });
    return grouped;
  }, [photos]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Lỗi", "Cần quyền truy cập thư viện ảnh");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleUploadPhoto(result.assets[0].uri);
    }
  };

  const handleUploadPhoto = async (uri) => {
    try {
      setUploading(true);
      await uploadFamilyPhoto(family.id, user.uid, uri);
      Alert.alert("Thành công", "Đã tải ảnh lên");
      loadPhotos();
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Không thể tải ảnh lên");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{family?.name}</Text>
        <TouchableOpacity onPress={handlePickImage} disabled={uploading}>
          <Ionicons 
            name="add-circle" 
            size={28} 
            color={uploading ? "#ccc" : "#ff9500"} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Ionicons name="images" size={20} color="#ff9500" />
          <Text style={styles.statText}>{photos.length} ảnh</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="people" size={20} color="#ff9500" />
          <Text style={styles.statText}>{members.length} thành viên</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {photos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có ảnh nào</Text>
            <Text style={styles.emptySubtext}>Bấm + để thêm ảnh</Text>
          </View>
        ) : (
          Object.keys(photosByMember).map(memberId => {
            const memberPhotos = photosByMember[memberId];
            const member = members.find(m => m.uid === memberId);
            const memberName = member?.displayName || member?.email || 'Thành viên';
            
            return (
              <View key={memberId} style={styles.memberSection}>
                <View style={styles.memberHeader}>
                  <Ionicons name="person-circle" size={24} color="#ff9500" />
                  <Text style={styles.memberName}>{memberName}</Text>
                  <Text style={styles.memberCount}>({memberPhotos.length})</Text>
                </View>
                <View style={styles.photoGrid}>
                  {memberPhotos.map(photo => (
                    <TouchableOpacity
                      key={photo.id}
                      style={styles.photoItem}
                      onPress={() => navigateToPhotoDetail(navigation, photo, user)}>
                      <Image 
                        source={{ uri: photo.cloudinaryUrl || photo.url }} 
                        style={styles.photoImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {uploading && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingBox}>
            <Text style={styles.uploadingText}>Đang tải lên...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  memberSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  photoItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingBox: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 12,
  },
  uploadingText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
});
