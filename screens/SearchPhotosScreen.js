import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { searchPhotos } from "../services/aiService";
import { navigateToPhotoDetail } from "../utils/navigationHelper";

export default function SearchPhotosScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [query, setQuery] = useState("");
  const [allPhotos, setAllPhotos] = useState([]);
  const [filteredPhotos, setFilteredPhotos] = useState([]);

  useEffect(() => {
    loadPhotos();
  }, [user?.uid]);

  useEffect(() => {
    if (query.trim().length > 0) {
      filterPhotos(query);
    } else {
      setFilteredPhotos([]);
    }
  }, [query, allPhotos]);

  const loadPhotos = async () => {
    if (!user?.uid) return;
    try {
      const album = await getUserAlbum(user.uid);
      setAllPhotos(album.photos);
    } catch (error) {
      console.error("Error loading photos:", error);
    }
  };

  const filterPhotos = (searchQuery) => {
    const lowerQuery = searchQuery.toLowerCase().trim();
    
    const filtered = allPhotos.filter(photo => {
      // Search in labels
      const labels = photo.aiAnalysis?.labels || [];
      const hasMatchingLabel = labels.some(label => 
        label.toLowerCase().includes(lowerQuery)
      );

      // Search in note
      const hasMatchingNote = photo.note && typeof photo.note === 'string' 
        ? photo.note.toLowerCase().includes(lowerQuery) 
        : false;

      // Search in location
      const hasMatchingLocation = photo.location && typeof photo.location === 'string'
        ? photo.location.toLowerCase().includes(lowerQuery)
        : false;

      return hasMatchingLabel || hasMatchingNote || hasMatchingLocation;
    });

    setFilteredPhotos(filtered);
  };

  const renderPhoto = ({ item }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => navigateToPhotoDetail(navigation, item, user)}>
      <Image source={{ uri: item.cloudinaryUrl }} style={styles.photoImage} />
      <View style={styles.photoInfo}>
        <Text style={styles.photoLabels} numberOfLines={1}>
          {item.aiAnalysis?.labels?.join(", ") || "Không có nhãn"}
        </Text>
        {item.note && (
          <Text style={styles.photoNote} numberOfLines={1}>
            {item.note}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tìm kiếm ảnh</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Tìm theo nhãn, ghi chú, địa điểm..."
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
      <FlatList
        data={filteredPhotos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {query.trim().length > 0 ? (
              <>
                <Ionicons name="search-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Không tìm thấy ảnh</Text>
                <Text style={styles.emptySubtext}>
                  Thử tìm kiếm với từ khóa khác
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="images-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Tìm kiếm ảnh</Text>
                <Text style={styles.emptySubtext}>
                  Nhập từ khóa để tìm ảnh theo nhãn, ghi chú hoặc địa điểm
                </Text>
              </>
            )}
          </View>
        )}
      />
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  photoItem: {
    width: "48%",
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#f0f0f0",
  },
  photoInfo: {
    padding: 8,
  },
  photoLabels: {
    fontSize: 12,
    fontWeight: "600",
    color: "#54b6f8",
    marginBottom: 2,
  },
  photoNote: {
    fontSize: 11,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    width: "100%",
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
    paddingHorizontal: 40,
  },
});
