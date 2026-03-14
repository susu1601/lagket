import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { getFriends, removeFriend, getPendingRequestsDetailed, acceptFriendRequest, declineFriendRequest } from "../services/friendService";

export default function UnifiedFriendsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("friends");

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFriends(true); // Force refresh when screen comes into focus
    });
    return unsubscribe;
  }, [navigation]);

  const loadFriends = async (forceRefresh = false) => {
    if (!user) return;
    try {
      const [friendsList, requestsList] = await Promise.all([
        getFriends(user.uid, forceRefresh),
        getPendingRequestsDetailed(user.uid, forceRefresh)
      ]);
      setFriends(friendsList);
      setFriendRequests(requestsList);
    } catch (error) {
      console.error("Error loading friends:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFriends(true); // Force refresh on pull-to-refresh
    setRefreshing(false);
  };

  const handleRemoveFriend = async (friendId) => {
    Alert.alert(
      "Xóa bạn bè",
      "Bạn có chắc muốn xóa bạn này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFriend(user.uid, friendId);
              // Force refresh to get latest data
              await loadFriends(true);
              Alert.alert("Thành công", "Đã xóa khỏi danh sách bạn bè");
            } catch (error) {
              console.error("Error removing friend:", error);
              Alert.alert("Lỗi", "Không thể xóa bạn bè");
            }
          }
        }
      ]
    );
  };

  const handleAcceptRequest = async (friendId) => {
    try {
      await acceptFriendRequest(friendId, user.uid);
      // Force refresh to get latest data
      await loadFriends(true);
      Alert.alert("Thành công", "Đã chấp nhận lời mời kết bạn!");
    } catch (error) {
      console.error("Error accepting request:", error);
      Alert.alert("Lỗi", "Không thể chấp nhận lời mời");
    }
  };

  const handleDeclineRequest = async (friendId) => {
    Alert.alert(
      "Từ chối lời mời",
      "Bạn có chắc muốn từ chối lời mời kết bạn?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Từ chối",
          style: "destructive",
          onPress: async () => {
            try {
              await declineFriendRequest(friendId, user.uid);
              // Force refresh to get latest data
              await loadFriends(true);
              Alert.alert("Đã từ chối", "Đã từ chối lời mời kết bạn");
            } catch (error) {
              console.error("Error declining request:", error);
              Alert.alert("Lỗi", "Không thể từ chối lời mời");
            }
          }
        }
      ]
    );
  };

  const renderFriend = ({ item: friend }) => (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => navigation.navigate("FriendProfile", { friend })}>
      <Image
        source={{ uri: friend.avatar || "https://via.placeholder.com/50" }}
        style={styles.avatar}
      />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{friend.displayName || friend.email}</Text>
        <Text style={styles.friendEmail}>{friend.email}</Text>
      </View>
      <View style={styles.friendActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("FriendAlbum", { friend })}>
          <Ionicons name="images" size={20} color="#ffcc00" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleRemoveFriend(friend.uid)}>
          <Ionicons name="trash" size={20} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFriendRequest = ({ item: request }) => (
    <View style={styles.friendItem}>
      <Image
        source={{ uri: request.avatar || "https://via.placeholder.com/50" }}
        style={styles.avatar}
      />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{request.displayName || request.email}</Text>
        <Text style={styles.friendEmail}>{request.email}</Text>
        <Text style={styles.requestTime}>Lời mời kết bạn</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptRequest(request.uid)}>
          <Ionicons name="checkmark" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => handleDeclineRequest(request.uid)}>
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bạn bè</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('ChatList')}>
            <Ionicons name="chatbubbles" size={24} color="#ffcc00" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('SearchUsers')}>
            <Ionicons name="search" size={24} color="#ffcc00" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "friends" && styles.activeTab]}
          onPress={() => setActiveTab("friends")}>
          <Text style={[styles.tabText, activeTab === "friends" && styles.activeTabText]}>
            Bạn bè ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "requests" && styles.activeTab]}
          onPress={() => setActiveTab("requests")}>
          <Text style={[styles.tabText, activeTab === "requests" && styles.activeTabText]}>
            Lời mời ({friendRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === "friends" ? friends : friendRequests}
        renderItem={activeTab === "friends" ? renderFriend : renderFriendRequest}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {activeTab === "friends" ? "Chưa có bạn bè" : "Không có lời mời"}
            </Text>
          </View>
        }
      />
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
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 204, 0, 0.1)', // Yellow tint
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#1c1c1e',
  },
  activeTab: {
    backgroundColor: '#ffcc00', // Yellow accent
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#aaa',
  },
  activeTabText: {
    color: '#000',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 13,
    color: '#aaa',
  },
  requestTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#34c759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
});
