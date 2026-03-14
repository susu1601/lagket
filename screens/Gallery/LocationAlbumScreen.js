import React, { useMemo, useContext } from "react";
import { View, FlatList, Image, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { navigateToPhotoDetail } from "../../utils/navigationHelper";
import { AuthContext } from "../../context/AuthContext";

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

export default function LocationAlbumScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const { clusterKey, photos = [] } = route.params || {};

  const title = useMemo(() => {
    const count = Array.isArray(photos) ? photos.length : 0;
    return `Album địa điểm (${count} ảnh)`;
  }, [photos]);

  const renderItem = ({ item }) => {
    const imageUri = item.cloudinaryUrl || item.uri || item.localUri;
    return (
      <TouchableOpacity 
        style={styles.albumWrapper} 
        activeOpacity={0.85} 
        onPress={() => navigateToPhotoDetail(navigation, item, user)}
      >
        <View style={styles.albumCard}>
          <Image source={{ uri: imageUri }} style={styles.albumImage} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Photos Grid */}
      <FlatList
        data={photos}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
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
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  albumWrapper: {
    width: CARD_WIDTH,
    marginBottom: 20,
  },
  albumCard: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  albumImage: {
    width: '100%',
    height: '100%',
  },
  albumInfo: {
    paddingHorizontal: 4,
  },
  albumLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '400',
  },
});


