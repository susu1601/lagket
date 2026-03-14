import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { AuthContext } from "../context/AuthContext";
import { getPendingRequestsDetailed, acceptFriendRequest, declineFriendRequest } from "../services/friendService";

export default function RequestsScreen() {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);

  const load = async () => {
    const data = await getPendingRequestsDetailed(user.id);
    setRequests(data);
  };

  useEffect(() => {
    load();
  }, []);

  const onAccept = async (senderId) => {
    await acceptFriendRequest(senderId, user.id);
    load();
  };

  const onDecline = async (senderId) => {
    await declineFriendRequest(senderId, user.id);
    load();
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.id}>ID: {item.id}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.accept]} onPress={() => onAccept(item.id)}>
          <Text style={styles.buttonText}>Chấp nhận</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.decline]} onPress={() => onDecline(item.id)}>
          <Text style={styles.buttonText}>Từ chối</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList data={requests} keyExtractor={(u) => u.id} renderItem={renderItem} ItemSeparatorComponent={() => <View style={styles.sep} />} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  info: { flexShrink: 1, paddingRight: 12 },
  email: { fontSize: 16, fontWeight: "600" },
  id: { fontSize: 12, color: "#666", marginTop: 2 },
  actions: { flexDirection: "row", gap: 8 },
  button: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  accept: { backgroundColor: "#28a745" },
  decline: { backgroundColor: "#d00" },
  buttonText: { color: "#fff", fontWeight: "600" },
  sep: { height: 1, backgroundColor: "#eee" },
});
