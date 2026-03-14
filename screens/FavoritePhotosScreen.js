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
import { getFavoritePhotos } from "../services/favoriteService";
import { navigateToPhotoDetail } from "../utils/navigationHelper";
import { AuthContext } from "../context/AuthContext";

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 3;

export default function FavoritePhotosScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [photos, setPhotos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, [user?.uid]);

  const loadPhotos = async () => {
    if (!user?.uid) return;
    try {
      console.log('Loading favorite photos for user:', user.uid);
      const favoritePhotos = await getFavoritePhotos(user.uid);
      console.log('Loaded favorite photos:', favoritePhotos.length, favoritePhotos);
      setPhotos(favoritePhotos);
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  };

  const renderPhoto = ({ item }) => {
    console.log('Rendering favorite photo:', item.id, item.cloudinaryUrl);
    return (
      <TouchableOpacity
        style={styles.photoItem}
        onPress={() => {
          console.log('Navigate to PhotoDetail with:', item);
          navigateToPhotoDetail(navigation, item, user);
        }}>
        <Image 
          source={{ uri: item.cloudinaryUrl }} 
          style={styles.photoImage}
          resizeMode="cover"
        />
        <View style={styles.heartBadge}>
          <Ionicons name="heart" size={16} color="#fff" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ảnh yêu thích</Text>
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
            <Ionicons name="heart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có ảnh yêu thích</Text>
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
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  heartBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
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
