import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert
} from "react-native";
import { searchUsersByQuery, registerUser } from "../services/authService";

export default function TestSearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTime, setSearchTime] = useState(0);

  const handleSearch = async () => {
    if (!query.trim()) {
      Alert.alert("Lỗi", "Nhập từ khóa tìm kiếm");
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      const searchResults = await searchUsersByQuery(query, 10);
      const endTime = Date.now();
      
      setResults(searchResults);
      setSearchTime(endTime - startTime);
      
      console.log("Search results:", searchResults);
      console.log("Search time:", endTime - startTime, "ms");
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Lỗi", error.message || "Không thể tìm kiếm");
    } finally {
      setLoading(false);
    }
  };

  const createTestUsers = async () => {
    setLoading(true);
    try {
      const testUsers = [
        { email: "john.doe@test.com", password: "123456", name: "John Doe" },
        { email: "jane.smith@test.com", password: "123456", name: "Jane Smith" },
        { email: "bob.wilson@test.com", password: "123456", name: "Bob Wilson" },
        { email: "alice.brown@test.com", password: "123456", name: "Alice Brown" },
        { email: "charlie.davis@test.com", password: "123456", name: "Charlie Davis" }
      ];

      for (const user of testUsers) {
        try {
          await registerUser(user.email, user.password, user.name);
          console.log("Created:", user.name);
        } catch (error) {
          console.log("Skip (already exists):", user.name);
        }
      }

      Alert.alert("Thành công", "Đã tạo test users!");
    } catch (error) {
      Alert.alert("Lỗi", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.displayName || "No name"}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userId}>ID: {item.uid}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Test Firebase Search</Text>
      </View>

      {/* Create Test Users Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={createTestUsers}
        disabled={loading}
      >
        <Text style={styles.createButtonText}>
          Tạo Test Users (5 users)
        </Text>
      </TouchableOpacity>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tên hoặc email để tìm kiếm..."
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.searchButtonText}>Tìm</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Stats */}
      {searchTime > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            ⚡ Tìm thấy {results.length} kết quả trong {searchTime}ms
          </Text>
        </View>
      )}

      {/* Results */}
      <FlatList
        data={results}
        renderItem={renderUser}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? "Đang tìm kiếm..." : "Chưa có kết quả"}
            </Text>
            <Text style={styles.emptySubtext}>
              {!loading && "Nhập từ khóa và nhấn Tìm"}
            </Text>
          </View>
        )}
      />

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>📝 Hướng dẫn:</Text>
        <Text style={styles.instructionsText}>1. Nhấn "Tạo Test Users" để tạo 5 users mẫu</Text>
        <Text style={styles.instructionsText}>2. Thử tìm: "john", "jane", "bob", "alice", "charlie"</Text>
        <Text style={styles.instructionsText}>3. Hoặc tìm theo email: "john.doe", "test.com"</Text>
        <Text style={styles.instructionsText}>4. Kiểm tra console logs để xem chi tiết</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#007AFF",
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  createButton: {
    backgroundColor: "#34C759",
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    margin: 15,
    marginTop: 0,
  },
  input: {
    flex: 1,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 25,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
  },
  searchButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  statsContainer: {
    backgroundColor: "#E8F5E9",
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
  },
  statsText: {
    color: "#2E7D32",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  listContainer: {
    padding: 15,
    paddingTop: 0,
  },
  userItem: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    color: "#999",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
  },
  instructions: {
    backgroundColor: "#FFF3E0",
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#E65100",
  },
  instructionsText: {
    fontSize: 14,
    color: "#E65100",
    marginBottom: 4,
  },
});
