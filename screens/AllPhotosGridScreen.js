import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SafeImage from "../components/SafeImage";
import { AuthContext } from "../context/AuthContext";
import { getUserAlbum, getFriendsRecentPhotos } from "../services/userAlbumService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const GAP = 2;
const TILE_SIZE = (SCREEN_WIDTH - GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export default function AllPhotosGridScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "mine" | "friends"

  useEffect(() => {
    loadPhotos();
  }, [user?.uid]);

  const loadPhotos = async () => {
    try {
      if (!user?.uid) return;

      const [albumData, friendPhotos] = await Promise.all([
        getUserAlbum(user.uid, 100),
        getFriendsRecentPhotos(user.uid, 100),
      ]);

      const ownPhotos = albumData.photos.map((p) => ({
        ...p,
        userId: user.uid,
        userName: "Bạn",
        isOwn: true,
      }));

      const friends = friendPhotos.map((p) => ({
        ...p,
        isOwn: false,
      }));

      let all = [...ownPhotos, ...friends];

      // Remove duplicates
      const seen = new Set();
      all = all.filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      // Sort newest first
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setPhotos(all);
    } catch (error) {
      console.error("Error loading photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  }, [user?.uid]);

  const filteredPhotos = photos.filter((p) => {
    if (filter === "mine") return p.isOwn;
    if (filter === "friends") return !p.isOwn;
    return true;
  });

  const renderTile = ({ item }) => {
    const imageUri = item.cloudinaryUrl || item.uri || item.localUri;
    return (
      <TouchableOpacity
        style={styles.tile}
        activeOpacity={0.85}
        onPress={() => {
          if (item.isOwn) {
            navigation.navigate("MyPhotoDetail", { photo: item });
          } else {
            navigation.navigate("OtherPhotoDetail", { photo: item });
          }
        }}
      >
        <SafeImage source={{ uri: imageUri }} style={styles.tileImage} resizeMode="cover" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        {/* Filter pill */}
        <TouchableOpacity
          style={styles.filterPill}
          onPress={() => {
            const next = filter === "all" ? "mine" : filter === "mine" ? "friends" : "all";
            setFilter(next);
          }}
        >
          <Ionicons name="people" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.filterText}>
            {filter === "all" ? "Mọi người" : filter === "mine" ? "Của bạn" : "Bạn bè"}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#fff" style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        <View style={{ width: 40 }} />
      </View>

      {/* Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#54b6f8" />
        </View>
      ) : (
        <FlatList
          data={filteredPhotos}
          renderItem={renderTile}
          keyExtractor={(item, index) => item.id || `grid-${index}`}
          numColumns={NUM_COLUMNS}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
              colors={["#54b6f8"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>Chưa có ảnh nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gridContent: {
    paddingHorizontal: GAP,
    paddingBottom: 100,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    margin: GAP / 2,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
  emptyContainer: {
    paddingTop: 120,
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
    fontSize: 16,
    marginTop: 12,
  },
});
