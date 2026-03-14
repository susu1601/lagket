import React, { useEffect, useState, useContext } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { getUserAlbum } from "../services/userAlbumService";
import { navigateToPhotoDetail } from "../utils/navigationHelper";

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 3;

export default function AlbumByTagScreen({ route, navigation }) {
  const { tag } = route.params;
  const { user } = useContext(AuthContext);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhotos();
  }, [tag]);

  const loadPhotos = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const albumData = await getUserAlbum(user.uid);
      
      // Filter photos by tag
      const filteredPhotos = albumData.photos.filter(photo => {
        const labels = photo.aiAnalysis?.labels || [];
        return labels.some(label => 
          label.toLowerCase() === tag.toLowerCase()
        );
      });
      
      setPhotos(filteredPhotos);
    } catch (error) {
      console.error("Error loading photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderPhoto = ({ item }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => navigateToPhotoDetail(navigation, item, user)}>
      <Image 
        source={{ uri: item.cloudinaryUrl }} 
        style={styles.photoImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Photos count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>{photos.length} ảnh</Text>
      </View>

      {/* Photos Grid */}
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
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
    backgroundColor: '#54b6f8',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
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
});
