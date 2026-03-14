import React, { useEffect, useState, useContext } from "react";
import { 
  View,
  Text,
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl, 
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getFriendAlbum } from "../services/userAlbumService";
import { AuthContext } from "../context/AuthContext";

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 3;

export default function FriendAlbumScreen({ route, navigation }) {
  const { friend } = route.params || {};
  const { user } = useContext(AuthContext);
  const [photos, setPhotos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFriendAlbum();
  }, [friend?.uid]);

  const loadFriendAlbum = async () => {
    if (!friend?.uid || !user?.uid) return;
    try {
      const album = await getFriendAlbum(user.uid, friend.uid);
      setPhotos(album.photos || []);
    } catch (error) {
      console.error("Error loading friend album:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFriendAlbum();
    setRefreshing(false);
  };

  const renderPhoto = ({ item }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => navigation.navigate('OtherPhotoDetail', { photo: item })}>
      <Image 
        source={{ uri: item.cloudinaryUrl }} 
        style={styles.photoImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{friend?.displayName || friend?.email}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.countContainer}>
        <Text style={styles.countText}>{photos.length} ảnh</Text>
      </View>

      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có ảnh</Text>
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
  countContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  photoItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  photoImage: {
    width: '100%',
    height: '100%',
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
