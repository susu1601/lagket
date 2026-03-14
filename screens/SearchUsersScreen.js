import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { searchUsersByQuery } from "../services/authService";
import { sendFriendRequest, getRelationshipStatus } from "../services/friendService";
import { AuthContext } from "../context/AuthContext";

export default function SearchUsersScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [relationshipStatuses, setRelationshipStatuses] = useState({});

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (query.trim().length >= 2) {
        handleSearch();
      } else {
        setResults([]);
        setSearched(false);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const searchResults = await searchUsersByQuery(query, 20);
      // Filter out current user
      const filtered = searchResults.filter(u => u.uid !== user?.uid);
      setResults(filtered);
      
      // Load relationship status for each user
      const statuses = {};
      await Promise.all(
        filtered.map(async (u) => {
          const status = await getRelationshipStatus(user.uid, u.uid);
          statuses[u.uid] = status;
        })
      );
      setRelationshipStatuses(statuses);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (friendId) => {
    try {
      await sendFriendRequest(user.uid, friendId);
      // Update status locally
      setRelationshipStatuses(prev => ({
        ...prev,
        [friendId]: 'sent'
      }));
      Alert.alert('Thành công', 'Đã gửi lời mời kết bạn');
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Lỗi', 'Không thể gửi lời mời kết bạn');
    }
  };

  const getButtonConfig = (userId) => {
    const status = relationshipStatuses[userId];
    
    switch (status) {
      case 'friends':
        return { text: 'Bạn bè', icon: 'checkmark-circle', color: '#34c759', disabled: true };
      case 'sent':
        return { text: 'Đã gửi', icon: 'time', color: '#999', disabled: true };
      case 'received':
        return { text: 'Phản hồi', icon: 'mail', color: '#ff9500', disabled: false };
      default:
        return { text: 'Thêm bạn', icon: 'person-add', color: '#54b6f8', disabled: false };
    }
  };

  const renderUser = ({ item }) => {
    const buttonConfig = getButtonConfig(item.uid);
    
    return (
      <View style={styles.userItem}>
        <View style={styles.userTouchable}>
          <View style={styles.avatarContainer}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.displayName || "Người dùng"}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: buttonConfig.disabled ? '#f0f0f0' : buttonConfig.color }
          ]}
          onPress={() => !buttonConfig.disabled && handleAddFriend(item.uid)}
          disabled={buttonConfig.disabled}>
          <Ionicons 
            name={buttonConfig.icon} 
            size={18} 
            color={buttonConfig.disabled ? '#999' : '#fff'} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tìm kiếm người dùng</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Tìm theo tên hoặc email..."
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={true}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#54b6f8" />
          <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderUser}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              {searched ? (
                <>
                  <Ionicons name="search-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>Không tìm thấy người dùng</Text>
                  <Text style={styles.emptySubtext}>
                    Thử tìm kiếm với từ khóa khác
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="people-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>Tìm kiếm người dùng</Text>
                  <Text style={styles.emptySubtext}>
                    Nhập tên hoặc email để bắt đầu
                  </Text>
                </>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#000",
  },
  clearButton: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#54b6f8",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});
