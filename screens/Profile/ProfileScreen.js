import React, { useContext, useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import SafeImage from "../../components/SafeImage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "../../context/AuthContext";
import { getUserAlbum } from "../../services/userAlbumService";
import { getDaysSince, formatDate, getRelativeTime } from "../../utils/dateUtils";

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateAvatar } = useContext(AuthContext);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastActivityDays, setLastActivityDays] = useState(0);
  const [totalActiveDays, setTotalActiveDays] = useState(0);

  useEffect(() => {
    loadStats();
  }, [user?.uid]);

  const loadStats = async () => {
    if (!user?.uid) return;
    try {
      const album = await getUserAlbum(user.uid);
      const photos = album.photos || [];
      
      if (photos.length > 0) {
        // Tính ngày hoạt động cuối cùng (ảnh gần nhất)
        const sortedPhotos = photos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const lastPhotoDate = new Date(sortedPhotos[0].createdAt);
        const daysSinceLastActivity = Math.floor((new Date() - lastPhotoDate) / (1000 * 60 * 60 * 24));
        setLastActivityDays(daysSinceLastActivity);
        
        // Tính tổng số ngày hoạt động (số ngày khác nhau có đăng ảnh)
        const uniqueDates = new Set();
        photos.forEach(photo => {
          const photoDate = new Date(photo.createdAt);
          const dateString = photoDate.toDateString(); // Chỉ lấy ngày, bỏ giờ
          uniqueDates.add(dateString);
        });
        setTotalActiveDays(uniqueDates.size);
      } else {
        setLastActivityDays(0);
        setTotalActiveDays(0);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAvatar = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingAvatar(true);
        try {
          await updateAvatar(result.assets[0].uri);
          Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện');
        } catch (error) {
          console.error('Error updating avatar:', error);
          Alert.alert('Lỗi', error.message || 'Không thể cập nhật ảnh đại diện');
        } finally {
          setUploadingAvatar(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
      setUploadingAvatar(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc muốn đăng xuất?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Đăng xuất", 
          style: "destructive",
          onPress: logout
        }
      ]
    );
  };


  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={handleChangeAvatar}
            disabled={uploadingAvatar}
          >
            {user?.avatar ? (
              <SafeImage source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
            {uploadingAvatar && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.displayName || user?.email?.split('@')[0] || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            {loading ? (
              <ActivityIndicator size="small" color="#54b6f8" />
            ) : (
              <>
                <Text style={styles.statValue}>{totalActiveDays}</Text>
                <Text style={styles.statLabel}>Ngày hoạt động</Text>
              </>
            )}
          </View>
          <View style={styles.statItem}>
            {loading ? (
              <ActivityIndicator size="small" color="#54b6f8" />
            ) : (
              <>
                <Text style={styles.statValue}>
                  {lastActivityDays === 0 ? "Hôm nay" : `${lastActivityDays} ngày`}
                </Text>
                <Text style={styles.statLabel}>Hoạt động gần đây</Text>
              </>
            )}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin</Text>
          
          {user?.createdAt && (
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="calendar" size={20} color="#54b6f8" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Tham gia</Text>
                <Text style={styles.infoValue}>
                  {formatDate(user.createdAt)}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.infoItem} onPress={handleChangeAvatar}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="camera" size={20} color="#54b6f8" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Đổi ảnh đại diện</Text>
              <Text style={styles.infoValue}>Cập nhật avatar</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 30,
    marginHorizontal: 20,
    marginTop: 50,
    marginBottom: 20,
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#54b6f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#54b6f8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#aaa',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffcc00', // Yellow accent
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  infoSection: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 204, 0, 0.1)', // Yellow tint
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  menuSection: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(84, 182, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff3b30',
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
