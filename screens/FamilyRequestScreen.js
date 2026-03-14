import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import {
  createFamily,
  getUserFamilies,
  getFamilyRequests,
  acceptFamilyRequest,
  declineFamilyRequest
} from "../services/familyService";

export default function FamilyRequestScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [families, setFamilies] = useState([]);
  const [requests, setRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [familyName, setFamilyName] = useState("");

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      const [familiesData, requestsData] = await Promise.all([
        getUserFamilies(user.uid),
        getFamilyRequests(user.uid)
      ]);
      setFamilies(familiesData);
      setRequests(requestsData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên gia đình");
      return;
    }

    try {
      await createFamily(user.uid, familyName.trim());
      setShowCreateInput(false);
      setFamilyName("");
      Alert.alert("Thành công", "Đã tạo gia đình mới");
      loadData();
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Không thể tạo gia đình");
    }
  };

  const handleAcceptRequest = async (request) => {
    try {
      await acceptFamilyRequest(user.uid, request.familyId, request.fromUserId);
      Alert.alert("Thành công", "Đã chấp nhận lời mời");
      loadData();
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Không thể chấp nhận lời mời");
    }
  };

  const handleDeclineRequest = async (request) => {
    try {
      await declineFamilyRequest(user.uid, request.familyId, request.fromUserId);
      Alert.alert("Thành công", "Đã từ chối lời mời");
      loadData();
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Không thể từ chối lời mời");
    }
  };

  const renderFamilyItem = ({ item }) => (
    <TouchableOpacity
      style={styles.familyCard}
      onPress={() => navigation.navigate('FamilyPhotos', { family: item })}>
      <View style={styles.familyIcon}>
        <Ionicons name="people" size={32} color="#ff9500" />
      </View>
      <View style={styles.familyInfo}>
        <Text style={styles.familyName}>{item.name}</Text>
        <Text style={styles.familyMembers}>{item.members?.length || 0} thành viên</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#999" />
    </TouchableOpacity>
  );

  const renderRequestItem = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestInfo}>
        <Ionicons name="mail" size={24} color="#ff9500" />
        <View style={styles.requestText}>
          <Text style={styles.requestTitle}>Lời mời tham gia</Text>
          <Text style={styles.requestFamily}>{item.familyName}</Text>
          <Text style={styles.requestFrom}>Từ {item.fromUserName}</Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptRequest(item)}>
          <Ionicons name="checkmark" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => handleDeclineRequest(item)}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gia đình</Text>
        <TouchableOpacity onPress={() => setShowCreateInput(!showCreateInput)}>
          <Ionicons name="add-circle" size={28} color="#ff9500" />
        </TouchableOpacity>
      </View>

      {showCreateInput && (
        <View style={styles.createInputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Tên gia đình..."
            value={familyName}
            onChangeText={setFamilyName}
          />
          <TouchableOpacity style={styles.createBtn} onPress={handleCreateFamily}>
            <Text style={styles.createBtnText}>Tạo</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={families}
        renderItem={renderFamilyItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          requests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lời mời ({requests.length})</Text>
              {requests.map((request, index) => (
                <View key={index}>
                  {renderRequestItem({ item: request })}
                </View>
              ))}
            </View>
          )
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có gia đình nào</Text>
            <Text style={styles.emptySubtext}>Tạo gia đình để chia sẻ ảnh với người thân</Text>
          </View>
        }
      />
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
  createInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  createBtn: {
    backgroundColor: '#ff9500',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  familyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 12,
  },
  familyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  familyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  familyMembers: {
    fontSize: 13,
    color: '#666',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff5e6',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  requestInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  requestText: {
    marginLeft: 12,
    flex: 1,
  },
  requestTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  requestFamily: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ff9500',
    marginBottom: 2,
  },
  requestFrom: {
    fontSize: 12,
    color: '#666',
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
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
  },
});
