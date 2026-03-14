import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getUserAlbum } from "../services/userAlbumService";
import { getRelativeTime, formatDate, getDaysSince } from "../utils/dateUtils";
import { getRelationshipStatus, sendFriendRequest, acceptFriendRequest, removeFriend, declineFriendRequest } from "../services/friendService";
import { getOrCreateChat } from "../services/chatService";
import { AuthContext } from "../context/AuthContext";

export default function FriendProfileScreen({ route, navigation }) {
  const { friend } = route.params || {};
  const { user } = useContext(AuthContext);
  const [photoCount, setPhotoCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [relationshipStatus, setRelationshipStatus] = useState('none');
  const [actionLoading, setActionLoading] = useState(false);
  const [lastActivityDays, setLastActivityDays] = useState(0);
  const [totalActiveDays, setTotalActiveDays] = useState(0);

  useEffect(() => {
    loadStats();
    loadRelationshipStatus();
  }, [friend?.uid]);

  const loadStats = async () => {
    if (!friend?.uid) return;
    try {
      const album = await getUserAlbum(friend.uid);
      const photos = album.photos || [];
      setPhotoCount(photos.length);
      
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

  const loadRelationshipStatus = async () => {
    if (!user?.uid || !friend?.uid) return;
    try {
      const status = await getRelationshipStatus(user.uid, friend.uid);
      setRelationshipStatus(status);
    } catch (error) {
      console.error("Error loading relationship status:", error);
    }
  };

  const handleAddFriend = async () => {
    setActionLoading(true);
    try {
      await sendFriendRequest(user.uid, friend.uid);
      setRelationshipStatus('sent');
      Alert.alert(
        'Đã gửi lời mời', 
        `Đã gửi lời mời kết bạn đến ${friend.displayName || friend.email}. Chờ họ chấp nhận!`
      );
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Lỗi', 'Không thể gửi lời mời kết bạn');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    setActionLoading(true);
    try {
      // user.uid accepts request from friend.uid
      await acceptFriendRequest(friend.uid, user.uid);
      setRelationshipStatus('friends');
      Alert.alert(
        'Thành công', 
        'Đã chấp nhận lời mời kết bạn. Bây giờ bạn có thể xem album của họ!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Lỗi', 'Không thể chấp nhận lời mời');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    Alert.alert(
      'Xóa bạn bè',
      'Bạn có chắc muốn xóa người này khỏi danh sách bạn bè?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await removeFriend(user.uid, friend.uid);
              setRelationshipStatus('none');
              Alert.alert(
                'Thành công', 
                'Đã xóa khỏi danh sách bạn bè',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              console.error('Error removing friend:', error);
              Alert.alert('Lỗi', 'Không thể xóa bạn bè');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeclineRequest = async () => {
    Alert.alert(
      'Từ chối lời mời',
      'Bạn có chắc muốn từ chối lời mời kết bạn?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await declineFriendRequest(friend.uid, user.uid);
              setRelationshipStatus('none');
              Alert.alert(
                'Đã từ chối',
                'Đã từ chối lời mời kết bạn',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              console.error('Error declining friend request:', error);
              Alert.alert('Lỗi', 'Không thể từ chối lời mời');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderActionButtons = () => {
    if (actionLoading) {
      return (
        <View style={styles.actionsContainer}>
          <View style={styles.loadingButton}>
            <ActivityIndicator size="small" color="#54b6f8" />
          </View>
        </View>
      );
    }

    switch (relationshipStatus) {
      case 'friends':
        return (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={async () => {
                try {
                  const chat = await getOrCreateChat(user.uid, friend.uid);
                  navigation.navigate("ChatDetail", {
                    chatId: chat.id,
                    otherUser: {
                      uid: friend.uid,
                      name: friend.displayName || friend.email,
                      avatar: friend.avatar
                    }
                  });
                } catch (error) {
                  console.error('Error opening chat:', error);
                  Alert.alert('Lỗi', 'Không thể mở chat');
                }
              }}>
              <Ionicons name="chatbubble" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Nhắn tin</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate("FriendAlbum", { friend })}>
              <Ionicons name="images" size={20} color="#54b6f8" />
              <Text style={styles.secondaryButtonText}>Xem Album</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'sent':
        return (
          <View style={styles.actionsContainer}>
            <View style={styles.disabledButton}>
              <Ionicons name="time" size={20} color="#999" />
              <Text style={styles.disabledButtonText}>Đã gửi lời mời</Text>
            </View>
          </View>
        );
      
      case 'received':
        return (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAcceptRequest}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Chấp nhận</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleDeclineRequest}>
              <Ionicons name="close" size={20} color="#54b6f8" />
              <Text style={styles.secondaryButtonText}>Từ chối</Text>
            </TouchableOpacity>
          </View>
        );
      
      default:
        return (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, { flex: 1 }]}
              onPress={handleAddFriend}>
              <Ionicons name="person-add" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Thêm bạn</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  if (!friend) return null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hồ sơ</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {friend.avatar ? (
              <Image source={{ uri: friend.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{friend.displayName || friend.email?.split('@')[0] || 'Người dùng'}</Text>
          <Text style={styles.userEmail}>{friend.email}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            {loading ? (
              <ActivityIndicator size="small" color="#54b6f8" />
            ) : (
              <>
                <Text style={styles.statValue}>{photoCount}</Text>
                <Text style={styles.statLabel}>Ảnh</Text>
              </>
            )}
          </View>
          <View style={styles.statDivider} />
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
        </View>

        {/* Action Buttons */}
        {renderActionButtons()}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin</Text>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="mail" size={20} color="#54b6f8" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{friend.email}</Text>
            </View>
          </View>

          {friend.createdAt && (
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="calendar" size={20} color="#54b6f8" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Tham gia</Text>
                <Text style={styles.infoValue}>
                  {formatDate(friend.createdAt)}
                </Text>
              </View>
            </View>
          )}

          {!loading && photoCount > 0 && (
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="time" size={20} color="#54b6f8" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Hoạt động gần đây</Text>
                <Text style={styles.infoValue}>
                  {lastActivityDays === 0 ? "Hôm nay" : `${lastActivityDays} ngày trước`}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#000',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 30,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1a1a1c',
    borderRadius: 16,
  },
  avatarContainer: {
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
    backgroundColor: '#1a1a1c',
    borderRadius: 12,
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#333',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#54b6f8',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#54b6f8',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1c',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#54b6f8',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#54b6f8',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff3b30',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButtonText: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 12,
  },
  infoSection: {
    marginHorizontal: 20,
    marginBottom: 40,
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
    backgroundColor: 'rgba(84, 182, 248, 0.1)',
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
});
