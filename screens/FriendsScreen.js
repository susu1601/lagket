import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { AuthContext } from "../context/AuthContext";
import { getFriendsDetailed, removeFriend } from "../services/friendService";

export default function FriendsScreen() {
  const { user } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);

  const load = async () => {
    const data = await getFriendsDetailed(user.id);
    setFriends(data);
  };

  useEffect(() => {
    load();
  }, []);

  const onRemove = async (friendId) => {
    Alert.alert("Xóa bạn", "Bạn chắc chắn muốn xóa người này khỏi danh sách bạn bè?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa", style: "destructive", onPress: async () => {
          await removeFriend(user.id, friendId);
          load();
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.id}>ID: {item.id}</Text>
      </View>
      <TouchableOpacity style={styles.buttonRemove} onPress={() => onRemove(item.id)}>
        <Text style={styles.buttonText}>Hủy kết bạn</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList data={friends} keyExtractor={(u) => u.id} renderItem={renderItem} ItemSeparatorComponent={() => <View style={styles.sep} />} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  info: { flexShrink: 1, paddingRight: 12 },
  email: { fontSize: 16, fontWeight: "600" },
  id: { fontSize: 12, color: "#666", marginTop: 2 },
  buttonRemove: { backgroundColor: "#d00", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  buttonText: { color: "#fff", fontWeight: "600" },
  sep: { height: 1, backgroundColor: "#eee" },
});
