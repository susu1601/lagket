import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { AuthContext } from "../context/AuthContext";
import { getAllUsers } from "../services/authService";
import { sendFriendRequest, getRelationshipStatus } from "../services/friendService";

export default function PeopleScreen() {
  const { user } = useContext(AuthContext);
  const [people, setPeople] = useState([]);
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    (async () => {
      const all = await getAllUsers();
      const others = all.filter(u => u.id !== user?.id);
      setPeople(others);
      const entries = await Promise.all(others.map(async u => [u.id, await getRelationshipStatus(user.id, u.id)]));
      setStatuses(Object.fromEntries(entries));
    })();
  }, [user]);

  const onSend = async (targetId) => {
    await sendFriendRequest(user.id, targetId);
    const status = await getRelationshipStatus(user.id, targetId);
    setStatuses(prev => ({ ...prev, [targetId]: status }));
  };

  const renderItem = ({ item }) => {
    const status = statuses[item.id] || "none";
    let btnText = "Kết bạn";
    let disabled = false;
    if (status === "sent") { btnText = "Đã gửi"; disabled = true; }
    if (status === "received") { btnText = "Đợi bạn chấp nhận"; disabled = true; }
    if (status === "friends") { btnText = "Bạn bè"; disabled = true; }

    return (
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.email}>{item.email}</Text>
          <Text style={styles.id}>ID: {item.id}</Text>
        </View>
        <TouchableOpacity style={[styles.button, disabled && styles.buttonDisabled]} onPress={() => onSend(item.id)} disabled={disabled}>
          <Text style={styles.buttonText}>{btnText}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList data={people} keyExtractor={(u) => u.id} renderItem={renderItem} ItemSeparatorComponent={() => <View style={styles.sep} />} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  info: { flexShrink: 1, paddingRight: 12 },
  email: { fontSize: 16, fontWeight: "600" },
  id: { fontSize: 12, color: "#666", marginTop: 2 },
  button: { backgroundColor: "#007AFF", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  buttonDisabled: { backgroundColor: "#aaa" },
  buttonText: { color: "#fff", fontWeight: "600" },
  sep: { height: 1, backgroundColor: "#eee" },
});
